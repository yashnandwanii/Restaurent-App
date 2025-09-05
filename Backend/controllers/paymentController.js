const Order = require('../models/Order').default;
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const { eventBus, EVENTS, publishOrderEvent, publishPaymentEvent } = require('../services/eventBus').default;
const socketService = require('../services/socketService');

// Create Payment Intent
const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = 'INR', orderId, customerInfo } = req.body;

        // Validate order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                code: 'ORDER_NOT_FOUND'
            });
        }

        // Check if payment intent already exists
        if (order.paymentId) {
            return res.status(200).json({
                success: true,
                message: 'Payment intent already exists',
                data: {
                    paymentIntent: order.paymentDetails.gatewayResponse
                },
                code: 'PAYMENT_INTENT_EXISTS'
            });
        }

        // Create payment intent
        const paymentIntent = await paymentService.createPaymentIntent(
            amount,
            currency,
            orderId,
            customerInfo
        );

        if (!paymentIntent.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment intent',
                error: paymentIntent.error
            });
        }

        // Update order with payment details
        order.paymentId = paymentIntent.paymentIntent.id;
        order.paymentDetails = {
            transactionId: paymentIntent.paymentIntent.razorpay_order_id,
            gateway: 'razorpay',
            gatewayResponse: paymentIntent.paymentIntent
        };

        await order.save();

        // Publish payment initiated event
        await publishPaymentEvent(EVENTS.PAYMENT_INITIATED, {
            paymentId: paymentIntent.paymentIntent.id,
            orderId: order._id,
            amount: amount,
            currency: currency
        });

        res.status(201).json({
            success: true,
            message: 'Payment intent created successfully',
            data: {
                paymentIntent: paymentIntent.paymentIntent
            }
        });

    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment intent',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Payment Webhook Handler
const handlePaymentWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'] || req.headers['razorpay-signature'];
        const payload = JSON.stringify(req.body);

        // Process webhook
        const webhookResult = await paymentService.processWebhook(payload, signature);

        if (!webhookResult.success) {
            console.error('Webhook verification failed:', webhookResult.error);
            return res.status(400).json({
                success: false,
                message: 'Webhook verification failed',
                error: webhookResult.error
            });
        }

        // Handle payment captured
        if (req.body.event === 'payment.captured') {
            await handlePaymentCaptured(req.body.payload.payment.entity);
        }
        // Handle payment failed
        else if (req.body.event === 'payment.failed') {
            await handlePaymentFailed(req.body.payload.payment.entity);
        }
        // Handle refund processed
        else if (req.body.event === 'refund.processed') {
            await handleRefundProcessed(req.body.payload.refund.entity);
        }

        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('Payment webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Handle Payment Captured
const handlePaymentCaptured = async (payment) => {
    try {
        // Find order by payment ID or transaction ID
        const order = await Order.findOne({
            $or: [
                { paymentId: payment.id },
                { 'paymentDetails.transactionId': payment.order_id }
            ]
        }).populate('userId restaurantId');

        if (!order) {
            console.error('Order not found for payment:', payment.id);
            return;
        }

        // Check for duplicate processing
        if (order.paymentStatus === 'completed') {
            console.log('Payment already processed for order:', order._id);
            return;
        }

        // Validate payment amount
        const expectedAmount = order.totalPrice * 100; // Convert to paise
        if (!paymentService.validatePaymentAmount(expectedAmount, payment.amount)) {
            console.error('Payment amount mismatch:', {
                expected: expectedAmount,
                received: payment.amount,
                orderId: order._id
            });
            return;
        }

        // Update order payment status
        order.paymentStatus = 'completed';
        order.paymentDetails = {
            ...order.paymentDetails,
            capturedAt: new Date(),
            gatewayPaymentId: payment.id,
            method: payment.method,
            bank: payment.bank,
            wallet: payment.wallet
        };

        // Update order status to payment_verified
        order.updateStatus('payment_verified', 'system', 'Payment completed successfully');

        await order.save();

        // Add audit log
        order.addAuditLog('payment_captured', 'system', {
            paymentId: payment.id,
            amount: payment.amount,
            method: payment.method
        });

        await order.save();

        // Publish payment completed event
        await publishPaymentEvent(EVENTS.PAYMENT_COMPLETED, {
            paymentId: payment.id,
            orderId: order._id,
            amount: payment.amount / 100, // Convert back to rupees
            method: payment.method
        });

        // Publish order payment verified event
        await publishOrderEvent(EVENTS.ORDER_PAYMENT_VERIFIED, order, {
            paymentId: payment.id,
            paymentMethod: payment.method
        });

        // Send notification to restaurant about new order
        await notificationService.sendOrderNotification(order, 'order_placed', 'restaurant');

        console.log('Payment captured successfully for order:', order._id);

    } catch (error) {
        console.error('Error handling payment captured:', error);
    }
};

// Handle Payment Failed
const handlePaymentFailed = async (payment) => {
    try {
        const order = await Order.findOne({
            $or: [
                { paymentId: payment.id },
                { 'paymentDetails.transactionId': payment.order_id }
            ]
        });

        if (!order) {
            console.error('Order not found for failed payment:', payment.id);
            return;
        }

        // Update order payment status
        order.paymentStatus = 'failed';
        order.paymentDetails = {
            ...order.paymentDetails,
            failedAt: new Date(),
            errorCode: payment.error_code,
            errorDescription: payment.error_description
        };

        await order.save();

        // Add audit log
        order.addAuditLog('payment_failed', 'system', {
            paymentId: payment.id,
            errorCode: payment.error_code,
            errorDescription: payment.error_description
        });

        await order.save();

        // Publish payment failed event
        await publishPaymentEvent(EVENTS.PAYMENT_FAILED, {
            paymentId: payment.id,
            orderId: order._id,
            errorCode: payment.error_code,
            errorDescription: payment.error_description
        });

        console.log('Payment failed for order:', order._id);

    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
};

// Handle Refund Processed
const handleRefundProcessed = async (refund) => {
    try {
        const order = await Order.findOne({
            paymentId: refund.payment_id
        });

        if (!order) {
            console.error('Order not found for refund:', refund.id);
            return;
        }

        // Update order payment status
        if (refund.amount >= order.totalPrice * 100) {
            order.paymentStatus = 'refunded';
        } else {
            order.paymentStatus = 'partially_refunded';
        }

        order.paymentDetails = {
            ...order.paymentDetails,
            refundId: refund.id,
            refundAmount: refund.amount,
            refundedAt: new Date()
        };

        await order.save();

        // Add audit log
        order.addAuditLog('refund_processed', 'system', {
            refundId: refund.id,
            amount: refund.amount,
            paymentId: refund.payment_id
        });

        await order.save();

        // Publish refund processed event
        await publishPaymentEvent(EVENTS.PAYMENT_REFUNDED, {
            refundId: refund.id,
            paymentId: refund.payment_id,
            orderId: order._id,
            amount: refund.amount / 100
        });

        console.log('Refund processed for order:', order._id);

    } catch (error) {
        console.error('Error handling refund processed:', error);
    }
};

// Verify Payment (Manual verification endpoint)
const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        // Find order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                code: 'ORDER_NOT_FOUND'
            });
        }

        // Verify payment signature
        const isValid = paymentService.verifyPaymentSignature(
            order.paymentDetails.transactionId,
            paymentId,
            signature
        );

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature',
                code: 'INVALID_SIGNATURE'
            });
        }

        // Update order if not already updated
        if (order.paymentStatus !== 'completed') {
            order.paymentStatus = 'completed';
            order.updateStatus('payment_verified', 'manual_verification', 'Payment verified manually');
            order.paymentDetails.gatewayPaymentId = paymentId;
            await order.save();

            // Publish events
            await publishPaymentEvent(EVENTS.PAYMENT_COMPLETED, {
                paymentId,
                orderId: order._id,
                amount: order.totalPrice
            });

            await publishOrderEvent(EVENTS.ORDER_PAYMENT_VERIFIED, order, {
                paymentId,
                verificationMethod: 'manual'
            });

            // Send notification to restaurant
            await notificationService.sendOrderNotification(order, 'order_placed', 'restaurant');
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: { order }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get Payment Status
const getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).select('paymentStatus paymentDetails paymentId totalPrice');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                code: 'ORDER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: {
                orderId: order._id,
                paymentId: order.paymentId,
                paymentStatus: order.paymentStatus,
                totalAmount: order.totalPrice,
                paymentDetails: order.paymentDetails
            }
        });

    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Initiate Refund
const initiateRefund = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { amount, reason = 'Refund requested' } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                code: 'ORDER_NOT_FOUND'
            });
        }

        if (order.paymentStatus !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payment not completed, cannot refund',
                code: 'PAYMENT_NOT_COMPLETED'
            });
        }

        // Calculate refund amount
        const refundAmount = amount || order.totalPrice;

        // Initiate refund
        const refund = await paymentService.initiateRefund(
            order.paymentDetails.gatewayPaymentId || order.paymentId,
            refundAmount,
            reason
        );

        if (!refund.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to initiate refund',
                error: refund.error
            });
        }

        // Update order
        order.paymentStatus = 'refund_initiated';
        order.addAuditLog('refund_initiated', req.userId || req.restaurantId || 'admin', {
            refundId: refund.refund.id,
            amount: refundAmount,
            reason
        });

        await order.save();

        // Publish refund initiated event
        await publishPaymentEvent(EVENTS.PAYMENT_REFUND_INITIATED, {
            refundId: refund.refund.id,
            paymentId: order.paymentId,
            orderId: order._id,
            amount: refundAmount,
            reason
        });

        res.json({
            success: true,
            message: 'Refund initiated successfully',
            data: {
                refund: refund.refund,
                order: order
            }
        });

    } catch (error) {
        console.error('Initiate refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate refund',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    createPaymentIntent,
    handlePaymentWebhook,
    verifyPayment,
    getPaymentStatus,
    initiateRefund
};
