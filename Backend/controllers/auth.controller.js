import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import { generateToken } from '../middleware/auth.js';
// Temporarily commenting out to fix server startup
// import { publishNotificationEvent, EVENTS } from '../services/eventBus.js';
// import notificationService from '../services/notificationService.js';


// User Registration
const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, address, fcmToken } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email ?
                    'User with this email already exists' :
                    'User with this phone number already exists',
                code: 'USER_EXISTS'
            });
        }

        // Create new user
        const user = new User({
            name,
            email,
            phone,
            password,
            address,
            fcmToken
        });

        await user.save();

        // Generate JWT token (21 days expiry)
        const token = authMid.generateToken(user._id, 'user', '21d');

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Publish user registration event
        // await publishNotificationEvent(EVENTS.USER_REGISTERED, {
        //     userId: user._id,
        //     name: user.name,
        //     email: user.email
        // });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                token,
                expiresIn: '21d'
            }
        });
    } catch (error) {
        console.error('User registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// User Login
const loginUser = async (req, res) => {
    try {
        const { email, password, fcmToken } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Generate JWT token (21 days expiry)
        const token = authMid.generateToken(user._id, 'user', '21d');

        // Update last login and FCM token
        user.lastLogin = new Date();
        if (fcmToken) {
            user.fcmToken = fcmToken;
        }
        await user.save();

        // Publish user login event
        // await publishNotificationEvent(EVENTS.USER_LOGIN, {
        //     userId: user._id,
        //     name: user.name,
        //     email: user.email,
        //     loginTime: new Date()
        // });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token,
                expiresIn: '21d'
            }
        });
    } catch (error) {
        console.error('User login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Restaurant Registration
const registerRestaurant = async (req, res) => {
    try {
        const {
            title,
            time,
            imageUrl,
            pickup,
            delivery,
            isAvailable,
            owner,
            code,
            logoUrl,
            rating,
            ratingCount,
            verification,
            verificationMessage,
            coords,
            businessHours,
            email,
            password,
            phone,
            fcmToken
        } = req.body;

        // Check if restaurant already exists
        const existingRestaurant = await Restaurant.findOne({
            $or: [{ email }, { phone }, { code }]
        });

        if (existingRestaurant) {
            return res.status(400).json({
                success: false,
                message: existingRestaurant.email === email ?
                    'Restaurant with this email already exists' :
                    existingRestaurant.phone === phone ?
                        'Restaurant with this phone number already exists' :
                        'Restaurant with this code already exists',
                code: 'RESTAURANT_EXISTS'
            });
        }

        // Create new restaurant
        const restaurant = new Restaurant({
            title,
            time: time || "30 min",
            imageUrl,
            pickup: pickup !== undefined ? pickup : true,
            delivery: delivery !== undefined ? delivery : true,
            isAvailable: isAvailable !== undefined ? isAvailable : true,
            owner,
            code,
            logoUrl,
            rating: rating || 0,
            ratingCount: ratingCount || "0",
            verification: verification || 'Pending',
            verificationMessage: verificationMessage || "Your restaurant is under review.",
            coords: {
                id: coords.id,
                latitude: coords.latitude,
                longitude: coords.longitude,
                address: coords.address,
                title: coords.title,
                latitudeDelta: coords.latitudeDelta || 0.0122,
                longitudeDelta: coords.longitudeDelta || 0.0122
            },
            businessHours: businessHours || "10:00 am - 10:00 pm",
            email,
            password,
            phone,
            fcmToken
        });

        await restaurant.save();

        // Generate JWT token (21 days expiry)
        const token = generateToken(restaurant._id, 'restaurant', '21d');

        // Update last login
        restaurant.lastLogin = new Date();
        await restaurant.save();

        res.status(201).json({
            success: true,
            message: 'Restaurant registered successfully',
            data: {
                restaurant,
                token,
                expiresIn: '21d'
            }
        });
    } catch (error) {
        console.error('Restaurant registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Restaurant Login
const loginRestaurant = async (req, res) => {
    try {
        const { email, password, fcmToken } = req.body;

        // Find restaurant by email
        const restaurant = await Restaurant.findOne({ email });

        if (!restaurant) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check if account is active
        if (!restaurant.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        // Verify password
        const isPasswordValid = await restaurant.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Generate JWT token (21 days expiry)
        const token = generateToken(restaurant._id, 'restaurant', '21d');

        // Update last login and FCM token
        restaurant.lastLogin = new Date();
        if (fcmToken) {
            restaurant.fcmToken = fcmToken;
        }
        await restaurant.save();

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                restaurant,
                token,
                expiresIn: '21d'
            }
        });
    } catch (error) {
        console.error('Restaurant login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Refresh Token
const refreshToken = async (req, res) => {
    try {
        const user = req.user || req.restaurant;
        const userType = req.user ? 'user' : 'restaurant';

        // Generate new token
        const token = generateToken(user._id, userType, '21d');

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token,
                expiresIn: '21d',
                user: user
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get Current User Profile
const getCurrentUser = async (req, res) => {
    try {
        const user = req.user || req.restaurant;
        const userType = req.user ? 'user' : 'restaurant';

        res.json({
            success: true,
            message: 'Profile retrieved successfully',
            data: {
                [userType]: user,
                type: userType
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Update FCM Token
const updateFCMToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const user = req.user || req.restaurant;

        user.fcmToken = fcmToken;
        await user.save();

        res.json({
            success: true,
            message: 'FCM token updated successfully'
        });
    } catch (error) {
        console.error('Update FCM token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update FCM token',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        const user = req.user || req.restaurant;

        // Remove FCM token on logout
        user.fcmToken = null;
        await user.save();

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export default {
    registerUser,
    loginUser,
    registerRestaurant,
    loginRestaurant,
    refreshToken,
    getCurrentUser,
    updateFCMToken,
    logout
};
