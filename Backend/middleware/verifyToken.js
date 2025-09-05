import jwt from 'jsonwebtoken';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No token provided',
            code: 'NO_TOKEN'
        });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token is not valid',
                code: 'INVALID_TOKEN'
            });
        }
        console.log("Decoded JWT:", decoded);
        req.user = decoded;
        next();
    });
}

const verifyTokenAndAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.userType === 'Admin'
            || req.user.userType === 'Client'
            || req.user.userType === 'Vendor'
            || req.user.userType === 'Driver'
            || req.user.type === 'restaurant'
            || req.user.type === 'user') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to do that!',
                code: 'ACCESS_DENIED'
            });
        }
    });
}

const verifyRestaurantToken = async (req, res, next) => {
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

        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            code: 'AUTH_ERROR'
        });
    }
};

const verifyUserToken = async (req, res, next) => {
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

        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            code: 'AUTH_ERROR'
        });
    }
};

const verifyAdminToken = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.userType === 'Admin') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to do that!',
                code: 'ADMIN_ACCESS_REQUIRED'
            });
        }
    });
}

const verifyVendorToken = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.userType === 'Admin'
            || req.user.userType === 'Vendor'
            || req.user.type === 'restaurant') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to do that!',
                code: 'VENDOR_ACCESS_REQUIRED'
            });
        }
    });
}

const verifyDriver = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.userType === 'Driver') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to do that!',
                code: 'DRIVER_ACCESS_REQUIRED'
            });
        }
    });
}

// Alias for backward compatibility
const authenticateRestaurant = verifyRestaurantToken;
const authenticateUser = verifyUserToken;

export {
    verifyToken,
    verifyTokenAndAuthorization,
    verifyRestaurantToken,
    verifyUserToken,
    verifyVendorToken,
    verifyAdminToken,
    verifyDriver,
    authenticateRestaurant,
    authenticateUser,
};
