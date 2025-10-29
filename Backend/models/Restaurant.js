import { Schema, model } from 'mongoose';
import { genSalt, hash, compare } from 'bcrypt';

const RestaurantSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    time: {
        type: String,
        required: true,
        default: "30 min"
    },
    imageUrl: {
        type: String,
        required: true
    },
    foods: [{
        type: Schema.Types.ObjectId,
        ref: 'Food'
    }],
    pickup: {
        type: Boolean,
        default: true
    },
    delivery: {
        type: Boolean,
        default: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    owner: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    logoUrl: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    ratingCount: {
        type: String,
        default: "0"
    },
    verification: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    verificationMessage: {
        type: String,
        default: "Your restaurant is under review."
    },
    coords: {
        id: { type: String, required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: { type: String, required: true },
        title: { type: String, required: true },
        latitudeDelta: { type: Number, default: 0.0122 },
        longitudeDelta: { type: Number, default: 0.0122 }
    },
    __v: {
        type: Number,
        default: 0
    },
    businessHours: {
        type: String,
        default: "10:00 am - 10:00 pm"
    },
    // Authentication fields for restaurant login
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    fcmToken: String,
    isOpen: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date
}, {
    timestamps: true,
    collection: 'restaurents' // Use 'restaurents' collection name
});

// Indexes
RestaurantSchema.index({ email: 1 });
RestaurantSchema.index({ phone: 1 });
RestaurantSchema.index({ code: 1 });
RestaurantSchema.index({ 'coords.latitude': 1, 'coords.longitude': 1 });
RestaurantSchema.index({ rating: -1 });
RestaurantSchema.index({ isAvailable: 1, verification: 1, isOpen: 1 });
RestaurantSchema.index({ createdAt: -1 });

// Hash password before saving
RestaurantSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await genSalt(12);
    this.password = await hash(this.password, salt);
    next();
});

// Compare password method
RestaurantSchema.methods.comparePassword = async function (candidatePassword) {
    return await compare(candidatePassword, this.password);
};

// Remove password from JSON output
RestaurantSchema.methods.toJSON = function () {
    const restaurantObject = this.toObject();
    delete restaurantObject.password;
    return restaurantObject;
};

// Check if restaurant is currently open based on business hours
RestaurantSchema.methods.isCurrentlyOpen = function () {
    if (!this.isOpen || !this.isAvailable) return false;

    // Simple check - you can extend this to parse businessHours string
    const now = new Date();
    const currentHour = now.getHours();

    // Default business hours: 10:00 am - 10:00 pm
    return currentHour >= 10 && currentHour < 22;
};

export default model('Restaurant', RestaurantSchema);
