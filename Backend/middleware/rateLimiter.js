const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.url === '/health' || req.url === '/api/health';
    }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful requests
});

// Payment webhook rate limiting
const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Allow more webhook calls as they can be frequent
    message: {
        success: false,
        message: 'Too many webhook requests.',
        code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
        // Use a combination of IP and user agent for webhooks
        return req.ip + ':' + (req.get('User-Agent') || '');
    }
});

// Order creation rate limiting
const orderLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 order creation requests per 5 minutes
    message: {
        success: false,
        message: 'Too many order creation attempts, please try again later.',
        code: 'ORDER_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.userId || req.ip;
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
    webhookLimiter,
    orderLimiter
};
