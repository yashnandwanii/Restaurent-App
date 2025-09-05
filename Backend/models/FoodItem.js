import { Schema, model } from 'mongoose';

const FoodItemSchema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    category: {
        type: String,
        required: true,
        enum: ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Starter', 'Soup', 'Salad', 'Other']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    images: [String],
    imageUrl: { type: String }, // Keep for backward compatibility
    ingredients: [String],
    allergens: [String],
    nutritionalInfo: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number
    },
    tags: [{
        type: String,
        enum: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy', 'Popular', 'New', 'Chef Special']
    }],
    preparationTime: {
        type: Number,
        default: 20,
        min: 5,
        max: 120
    }, // minutes
    isAvailable: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        default: -1 // -1 means unlimited
    },
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
    },
    soldCount: {
        type: Number,
        default: 0
    },
    customizations: [{
        name: String,
        options: [{
            name: String,
            price: { type: Number, default: 0 },
            isDefault: { type: Boolean, default: false }
        }],
        isRequired: { type: Boolean, default: false },
        allowMultiple: { type: Boolean, default: false }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
FoodItemSchema.index({ restaurantId: 1 });
FoodItemSchema.index({ category: 1 });
FoodItemSchema.index({ tags: 1 });
FoodItemSchema.index({ isAvailable: 1 });
FoodItemSchema.index({ 'rating.average': -1 });
FoodItemSchema.index({ soldCount: -1 });
FoodItemSchema.index({ price: 1 });
FoodItemSchema.index({ createdAt: -1 });

// Compound indexes
FoodItemSchema.index({ restaurantId: 1, category: 1 });
FoodItemSchema.index({ restaurantId: 1, isAvailable: 1 });

// Update timestamp on save
FoodItemSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for discount percentage
FoodItemSchema.virtual('discountPercentage').get(function () {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Method to check if item is in stock
FoodItemSchema.methods.isInStock = function (quantity = 1) {
    if (this.stock === -1) return true; // Unlimited stock
    return this.stock >= quantity;
};

// Method to reduce stock
FoodItemSchema.methods.reduceStock = function (quantity = 1) {
    if (this.stock !== -1) {
        this.stock = Math.max(0, this.stock - quantity);
    }
    this.soldCount += quantity;
};

export default model('FoodItem', FoodItemSchema);
