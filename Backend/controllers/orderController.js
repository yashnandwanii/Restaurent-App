const Order = require('../models/Order').default;
const User = require('../models/User').default;
const Restaurant = require('../models/Restaurant').default;
const FoodItem = require('../models/FoodItem').default;
const mongoose = require('mongoose');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const { eventBus, EVENTS, publishOrderEvent } = require('../services/eventBus').default;
const socketService = require('../services/socketService');

// Legacy method - Get Latest Pending Order (kept for backward compatibility)
exports.getLatestPendingOrder = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        if (!restaurantId) {
            return res.status(400).json({ success: false, data: null, message: 'Missing restaurantId.' });
        }
        const order = await Order.findOne({ restaurantId, status: 'payment_verified' })
            .sort({ createdAt: -1 })
            .populate('userId', 'name email phone')
            .populate('items.foodItemId', 'name images');
        res.status(200).json({ success: true, data: order, message: 'Latest pending order fetched.' });
    } catch (error) {
        res.status(500).json({ success: false, data: null, message: error.message });
    }
};

// Legacy method - Confirm Order (kept for backward compatibility)
exports.confirmOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { note } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, data: null, message: 'Order not found.' });
        }

        if (order.status !== 'payment_verified') {
            return res.status(400).json({
                success: false,
                data: null,
                message: `Order cannot be confirmed. Current status: ${order.status}`
            });
        }

        order.updateStatus('confirmed', 'restaurant', note);
        await order.save();

        // Publish order confirmed event
        await publishOrderEvent(EVENTS.ORDER_CONFIRMED, order, { note });

        // Send notifications
        await notificationService.sendOrderNotification(order, 'order_confirmed', 'user');

        res.status(200).json({ success: true, data: order, message: 'Order confirmed.' });
    } catch (error) {
        console.error('Confirm order error:', error);
        res.status(500).json({ success: false, data: null, message: error.message });
    }
};

// Create Order
const createOrder = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const {
            restaurantId,
            items,
            deliveryAddress,
            specialInstructions,
            paymentMethod = 'card',
            idempotencyKey,
            contactlessDelivery = false
        } = req.body;

        const userId = req.userId;

        // Check for existing order with same idempotency key
        const existingOrder = await Order.findOne({ idempotencyKey });
        if (existingOrder) {
            return res.status(200).json({
                success: true,
                message: 'Order already exists',
                data: { order: existingOrder },
                code: 'ORDER_EXISTS'
            });
        }

        // Verify restaurant exists and is active
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || !restaurant.isActive || !restaurant.isVerified) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Restaurant not available',
                code: 'RESTAURANT_UNAVAILABLE'
            });
        }

        // Get user info
        const user = await User.findById(userId);
        if (!user) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Verify and calculate order details
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const foodItem = await FoodItem.findById(item.foodItemId);
            if (!foodItem || !foodItem.isAvailable) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Food item ${item.foodItemId} not available`,
                    code: 'ITEM_UNAVAILABLE'
                });
            }

            // Check if item belongs to the same restaurant
            if (foodItem.restaurantId.toString() !== restaurantId) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: 'All items must be from the same restaurant',
                    code: 'MIXED_RESTAURANT_ITEMS'
                });
            }

            // Check stock
            if (!foodItem.isInStock(item.quantity)) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${foodItem.name}`,
                    code: 'INSUFFICIENT_STOCK'
                });
            }

            // Calculate item price with customizations
            let itemPrice = foodItem.price;
            let customizationPrice = 0;

            if (item.customizations) {
                for (const customization of item.customizations) {
                    customizationPrice += customization.additionalPrice || 0;
                }
            }

            const totalItemPrice = (itemPrice + customizationPrice) * item.quantity;
            subtotal += totalItemPrice;

            orderItems.push({
                foodItemId: foodItem._id,
                name: foodItem.name,
                quantity: item.quantity,
                price: itemPrice,
                customizations: item.customizations || [],
                specialInstructions: item.specialInstructions
            });

            // Reduce stock
            foodItem.reduceStock(item.quantity);
            await foodItem.save({ session });
        }

        // Check minimum order amount
        if (subtotal < restaurant.minimumOrder) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Minimum order amount is ₹${restaurant.minimumOrder}`,
                code: 'MINIMUM_ORDER_NOT_MET'
            });
        }

        // Calculate fees and total
        const deliveryFee = restaurant.deliveryFee || 20;
        const taxes = paymentService.calculateTaxes(subtotal);
        const platformFee = paymentService.calculatePlatformFee(subtotal);
        const totalPrice = subtotal + deliveryFee + taxes + platformFee;

        // Create order
        const order = new Order({
            idempotencyKey,
            userId,
            restaurantId,
            customerName: user.name,
            customerPhone: user.phone,
            customerEmail: user.email,
            items: orderItems,
            subtotal,
            deliveryFee,
            taxes,
            platformFee,
            totalPrice,
            deliveryAddress,
            specialInstructions,
            paymentMethod,
            contactlessDelivery,
            estimatedPreparationTime: Math.max(...orderItems.map(item =>
                orderItems.find(oi => oi.foodItemId === item.foodItemId)?.preparationTime || 20
            ))
        });

        // Add audit log
        order.addAuditLog('order_created', userId, {
            items: orderItems.length,
            totalPrice,
            paymentMethod
        }, req.ip);

        await order.save({ session });

        // Create payment intent
        const paymentIntent = await paymentService.createPaymentIntent(
            totalPrice,
            'INR',
            order._id,
            {
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        );

        if (!paymentIntent.success) {
            await session.abortTransaction();
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment intent',
                code: 'PAYMENT_INTENT_FAILED'
            });
        }

        // Update order with payment details
        order.paymentId = paymentIntent.paymentIntent.id;
        order.paymentDetails = {
            transactionId: paymentIntent.paymentIntent.razorpay_order_id,
            gateway: 'razorpay',
            gatewayResponse: paymentIntent.paymentIntent
        };

        await order.save({ session });
        await session.commitTransaction();

        // Publish order created event
        await publishOrderEvent(EVENTS.ORDER_CREATED, order);

        // Populate order for response
        const populatedOrder = await Order.findById(order._id)
            .populate('userId', 'name email phone')
            .populate('restaurantId', 'name address phone');

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: populatedOrder,
                paymentIntent: paymentIntent.paymentIntent
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    } finally {
        session.endSession();
    }
};

// Get Order by ID
const getOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;
        const restaurantId = req.restaurantId;

        const order = await Order.findById(orderId)
            .populate('userId', 'name email phone')
            .populate('restaurantId', 'name address phone email')
            .populate('items.foodItemId', 'name images');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                code: 'ORDER_NOT_FOUND'
            });
        }

        // Check authorization - user can see their orders, restaurant can see their orders
        if (userId && order.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
                code: 'ACCESS_DENIED'
            });
        }

        if (restaurantId && order.restaurantId._id.toString() !== restaurantId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
                code: 'ACCESS_DENIED'
            });
        }

        res.json({
            success: true,
            data: { order }
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Reject Order (Restaurant)
const rejectOrder = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { orderId } = req.params;
        const { reason } = req.body;
        const restaurantId = req.restaurantId;

        const order = await Order.findOne({
            _id: orderId,
            restaurantId: restaurantId
        }).session(session);

        if (!order) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                code: 'ORDER_NOT_FOUND'
            });
        }

        // Check if order can be rejected
        if (!['payment_verified', 'confirmed'].includes(order.status)) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Order cannot be rejected. Current status: ${order.status}`,
                code: 'INVALID_ORDER_STATUS'
            });
        }

        // Update order status
        order.updateStatus('rejected', 'restaurant', reason);
        order.rejectionReason = reason;

        await order.save({ session });

        // Restore stock for rejected order
        for (const item of order.items) {
            const foodItem = await FoodItem.findById(item.foodItemId).session(session);
            if (foodItem && foodItem.stock !== -1) {
                foodItem.stock += item.quantity;
                foodItem.soldCount = Math.max(0, foodItem.soldCount - item.quantity);
                await foodItem.save({ session });
            }
        }

        await session.commitTransaction();

        // Initiate refund
        if (order.paymentId && order.paymentStatus === 'completed') {
            const refund = await paymentService.initiateRefund(
                order.paymentId,
                order.totalPrice,
                `Order rejected: ${reason}`
            );

            if (refund.success) {
                order.paymentStatus = 'refunded';
                await order.save();
            }
        }

        // Publish order rejected event
        await publishOrderEvent(EVENTS.ORDER_REJECTED, order, {
            rejectedBy: restaurantId,
            reason
        });

        // Send notifications
        await notificationService.sendOrderNotification(order, 'order_rejected', 'user');

        res.json({
            success: true,
            message: 'Order rejected successfully',
            data: { order }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Reject order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject order',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    } finally {
        session.endSession();
    }
};

// Update Order Status (Restaurant)
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, note } = req.body;
        const restaurantId = req.restaurantId;

        const order = await Order.findOne({
            _id: orderId,
            restaurantId: restaurantId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                code: 'ORDER_NOT_FOUND'
            });
        }

        // Validate status transition
        const validTransitions = {
            'confirmed': ['preparing'],
            'preparing': ['ready_for_pickup'],
            'ready_for_pickup': ['out_for_delivery'],
            'out_for_delivery': ['delivered']
        };

        if (!validTransitions[order.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${order.status} to ${status}`,
                code: 'INVALID_STATUS_TRANSITION'
            });
        }

        // Update order status
        order.updateStatus(status, 'restaurant', note);

        // Set specific timestamps
        if (status === 'ready_for_pickup') {
            order.deliveryInfo.actualPickupTime = new Date();
        } else if (status === 'delivered') {
            order.deliveryInfo.actualDeliveryTime = new Date();
        }

        await order.save();

        // Publish appropriate event
        const eventMap = {
            'preparing': EVENTS.ORDER_PREPARING,
            'ready_for_pickup': EVENTS.ORDER_READY_FOR_PICKUP,
            'out_for_delivery': EVENTS.ORDER_OUT_FOR_DELIVERY,
            'delivered': EVENTS.ORDER_DELIVERED
        };

        if (eventMap[status]) {
            await publishOrderEvent(eventMap[status], order, { note, updatedBy: restaurantId });
        }

        // Send notifications
        const notificationTypeMap = {
            'preparing': 'order_preparing',
            'ready_for_pickup': 'order_ready',
            'out_for_delivery': 'order_out_for_delivery',
            'delivered': 'order_delivered'
        };

        if (notificationTypeMap[status]) {
            await notificationService.sendOrderNotification(order, notificationTypeMap[status]);
        }

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: { order }
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get Restaurant Orders
const getRestaurantOrders = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const query = { restaurantId };

        if (status) {
            if (status === 'pending') {
                query.status = 'payment_verified'; // Pending orders for restaurant are payment_verified orders
            } else {
                query.status = status;
            }
        }

        const skip = (page - 1) * limit;
        const orders = await Order.find(query)
            .populate('userId', 'name email phone')
            .populate('items.foodItemId', 'name images')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalOrders = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalOrders / limit),
                    totalOrders,
                    hasNextPage: page * limit < totalOrders,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get restaurant orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get User Orders
const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const { status, page = 1, limit = 20 } = req.query;

        const query = { userId };
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('restaurantId', 'name address phone images')
            .populate('items.foodItemId', 'name images')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalOrders = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalOrders / limit),
                    totalOrders,
                    hasNextPage: page * limit < totalOrders,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    createOrder,
    getOrder,
    cancelOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (!['payment_verified', 'confirmed', 'preparing'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Order cannot be cancelled'
                });
            }

            order.status = 'cancelled';
            order.statusHistory.push({
                status: 'cancelled',
                timestamp: new Date(),
                updatedBy: 'user'
            });

            await order.save();

            res.json({
                success: true,
                message: 'Order cancelled successfully',
                data: order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to cancel order',
                error: error.message
            });
        }
    },
    confirmOrder: exports.confirmOrder,
    getRestaurantAnalytics: async (req, res) => {
        try {
            // Placeholder for analytics
            res.json({
                success: true,
                message: 'Analytics retrieved successfully',
                data: {
                    totalOrders: 0,
                    revenue: 0,
                    averageOrderValue: 0
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get analytics',
                error: error.message
            });
        }
    },
    rejectOrder,
    updateOrderStatus,
    getRestaurantOrders,
    getUserOrders
};
