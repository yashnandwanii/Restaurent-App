import { Schema, model } from 'mongoose';

const OrderSchema = new Schema({
    // Unique identifier for idempotency
    idempotencyKey: {
        type: String,
        unique: true,
        required: true
    },

    // Order identifiers
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },

    // References
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true
    },

    // Customer info (for backward compatibility)
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    customerEmail: { type: String },

    // Order items
    items: [{
        foodItemId: {
            type: Schema.Types.ObjectId,
            ref: 'FoodItem',
            required: true
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        customizations: [{
            name: String,
            selectedOptions: [String],
            additionalPrice: { type: Number, default: 0 }
        }],
        specialInstructions: String
    }],

    // Legacy fields (for backward compatibility)
    itemName: { type: String },
    quantity: { type: Number },

    // Pricing
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    taxes: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },

    // Delivery address
    deliveryAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        },
        instructions: String
    },

    // Payment information
    paymentId: String,
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'wallet', 'cash_on_delivery'],
        default: 'card'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending',
        index: true
    },
    paymentDetails: {
        transactionId: String,
        gateway: String,
        gatewayResponse: Schema.Types.Mixed
    },

    // Order status and timeline
    status: {
        type: String,
        enum: [
            'pending',           // Order created, waiting for payment
            'payment_verified',  // Payment successful, waiting for restaurant confirmation
            'confirmed',         // Restaurant confirmed the order
            'preparing',         // Restaurant is preparing the food
            'ready_for_pickup',  // Food is ready for delivery pickup
            'out_for_delivery',  // Food is out for delivery
            'delivered',         // Order successfully delivered
            'rejected',          // Restaurant rejected the order
            'cancelled',         // Order cancelled
            'refunded'          // Order refunded
        ],
        default: 'pending',
        index: true
    },

    // Timeline tracking
    timeline: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: {
            type: String,
            enum: ['customer', 'restaurant', 'delivery', 'system']
        }
    }],

    // Delivery tracking
    deliveryInfo: {
        estimatedTime: Date,
        actualPickupTime: Date,
        actualDeliveryTime: Date,
        deliveryPersonId: String,
        deliveryPersonName: String,
        deliveryPersonPhone: String,
        trackingUrl: String
    },

    // Restaurant processing
    estimatedPreparationTime: { type: Number, default: 30 }, // minutes
    actualPreparationTime: Number,
    restaurantNotes: String,
    rejectionReason: String,

    // Audit logs for tracking changes
    auditLogs: [{
        action: String,
        performedBy: String,
        timestamp: { type: Date, default: Date.now },
        details: Schema.Types.Mixed,
        ipAddress: String
    }],

    // Additional metadata
    platformFee: { type: Number, default: 0 },
    couponCode: String,
    specialInstructions: String,
    contactlessDelivery: { type: Boolean, default: false },

    // Ratings and feedback
    rating: {
        food: { type: Number, min: 1, max: 5 },
        delivery: { type: Number, min: 1, max: 5 },
        overall: { type: Number, min: 1, max: 5 },
        comment: String,
        ratedAt: Date
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    confirmedAt: Date,
    completedAt: Date
});

// Compound indexes for efficient queries
OrderSchema.index({ restaurantId: 1, status: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });

// Update timestamp on save
OrderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Generate order number
OrderSchema.pre('save', function (next) {
    if (this.isNew && !this.orderNumber) {
        this.orderNumber = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    next();
});

// Add status to timeline when status changes
OrderSchema.pre('save', function (next) {
    if (this.isModified('status') && !this.isNew) {
        this.timeline.push({
            status: this.status,
            timestamp: new Date(),
            updatedBy: 'system'
        });

        // Set completion timestamp
        if (['delivered', 'cancelled', 'refunded'].includes(this.status)) {
            this.completedAt = new Date();
        }

        // Set confirmation timestamp
        if (this.status === 'confirmed' && !this.confirmedAt) {
            this.confirmedAt = new Date();
        }
    }
    next();
});

// Instance methods
OrderSchema.methods.addAuditLog = function (action, performedBy, details = {}, ipAddress = null) {
    this.auditLogs.push({
        action,
        performedBy,
        details,
        ipAddress,
        timestamp: new Date()
    });
};

OrderSchema.methods.updateStatus = function (newStatus, updatedBy = 'system', note = null) {
    const oldStatus = this.status;
    this.status = newStatus;

    this.timeline.push({
        status: newStatus,
        timestamp: new Date(),
        note,
        updatedBy
    });

    this.addAuditLog('status_change', updatedBy, {
        from: oldStatus,
        to: newStatus,
        note
    });
};

OrderSchema.methods.canBeModified = function () {
    return ['pending', 'payment_verified'].includes(this.status);
};

OrderSchema.methods.canBeCancelled = function () {
    return ['pending', 'payment_verified', 'confirmed'].includes(this.status);
};

// Calculate total preparation time
OrderSchema.methods.calculateTotalPreparationTime = function () {
    if (!this.items || this.items.length === 0) return this.estimatedPreparationTime;

    // Find the maximum preparation time among all items
    const maxPrepTime = Math.max(...this.items.map(item => item.preparationTime || 20));
    return Math.max(maxPrepTime, this.estimatedPreparationTime);
};

export default model('Order', OrderSchema);
