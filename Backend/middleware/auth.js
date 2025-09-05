import jwt from 'jsonwebtoken';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';

// JWT Authentication middleware for restaurants
const authenticateRestaurant = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'restaurant') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Invalid token type.',
                code: 'INVALID_TOKEN_TYPE'
            });
        }

        const restaurant = await Restaurant.findById(decoded.id);

        if (!restaurant) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Restaurant not found.',
                code: 'RESTAURANT_NOT_FOUND'
            });
        }

        if (!restaurant.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Restaurant account is inactive.',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        req.restaurant = restaurant;
        req.restaurantId = restaurant._id.toString();
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token.',
                code: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token expired.',
                code: 'TOKEN_EXPIRED'
            });
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            code: 'AUTH_ERROR'
        });
    }
};

// JWT Authentication middleware for users
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'user') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Invalid token type.',
                code: 'INVALID_TOKEN_TYPE'
            });
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. User not found.',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. User account is inactive.',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        req.user = user;
        req.userId = user._id.toString();
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token.',
                code: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token expired.',
                code: 'TOKEN_EXPIRED'
            });
        }

        console.error('User auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            code: 'AUTH_ERROR'
        });
    }
};

// Optional authentication - sets user/restaurant if token is valid but doesn't fail if missing
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type === 'restaurant') {
            const restaurant = await Restaurant.findById(decoded.id);
            if (restaurant && restaurant.isActive) {
                req.restaurant = restaurant;
                req.restaurantId = restaurant._id.toString();
            }
        } else if (decoded.type === 'user') {
            const user = await User.findById(decoded.id);
            if (user && user.isActive) {
                req.user = user;
                req.userId = user._id.toString();
            }
        }

        next();
    } catch (error) {
        // Ignore errors in optional auth and proceed
        next();
    }
};

// Generate JWT token
const generateToken = (id, type, expiresIn = process.env.JWT_EXPIRES_IN || '21d') => {
    return jwt.sign(
        { id, type },
        process.env.JWT_SECRET,
        { expiresIn }
    );
};

// Verify JWT token
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

export {
    authenticateRestaurant,
    authenticateUser,
    optionalAuth,
    generateToken,
    verifyToken
};
