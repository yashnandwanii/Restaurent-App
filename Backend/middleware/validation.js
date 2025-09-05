import { body, param, query, validationResult } from 'express-validator';

// Handle validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
            code: 'VALIDATION_ERROR'
        });
    }
    next();
};

// Validation middleware for routes
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.path || error.param,
            message: error.msg,
            value: error.value
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors,
            code: 'VALIDATION_ERROR'
        });
    }

    next();
};

// User registration validation
const validateUserRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('phone')
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
];

// User login validation
const validateUserLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// Restaurant registration validation
const validateRestaurantRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Restaurant name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('phone')
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('ownerName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Owner name must be between 2 and 100 characters'),
    body('address.street')
        .trim()
        .notEmpty()
        .withMessage('Street address is required'),
    body('address.city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    body('address.state')
        .trim()
        .notEmpty()
        .withMessage('State is required'),
    body('address.zipCode')
        .trim()
        .notEmpty()
        .withMessage('Zip code is required'),
    body('address.coordinates.lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Valid latitude is required'),
    body('address.coordinates.lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Valid longitude is required'),
    handleValidationErrors
];

// Restaurant login validation
const validateRestaurantLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// Order creation validation
const validateOrderCreation = [
    body('restaurantId')
        .isMongoId()
        .withMessage('Valid restaurant ID is required'),
    body('items')
        .isArray({ min: 1 })
        .withMessage('At least one item is required'),
    body('items.*.foodItemId')
        .isMongoId()
        .withMessage('Valid food item ID is required'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    body('deliveryAddress.street')
        .trim()
        .notEmpty()
        .withMessage('Street address is required'),
    body('deliveryAddress.city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    body('deliveryAddress.coordinates.lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Valid latitude is required'),
    body('deliveryAddress.coordinates.lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Valid longitude is required'),
    body('idempotencyKey')
        .trim()
        .isLength({ min: 10, max: 100 })
        .withMessage('Idempotency key must be between 10 and 100 characters'),
    handleValidationErrors
];

// Food item creation validation
const validateFoodItemCreation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Food item name must be between 2 and 100 characters'),
    body('category')
        .isIn(['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Starter', 'Soup', 'Salad', 'Other'])
        .withMessage('Valid category is required'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('preparationTime')
        .optional()
        .isInt({ min: 5, max: 120 })
        .withMessage('Preparation time must be between 5 and 120 minutes'),
    handleValidationErrors
];

// Order status update validation
const validateOrderStatusUpdate = [
    body('status')
        .isIn([
            'pending', 'payment_verified', 'confirmed', 'preparing',
            'ready_for_pickup', 'out_for_delivery', 'delivered',
            'rejected', 'cancelled', 'refunded'
        ])
        .withMessage('Valid status is required'),
    body('note')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Note must not exceed 500 characters'),
    handleValidationErrors
];

// Order ID parameter validation
const validateOrderId = [
    param('orderId')
        .isMongoId()
        .withMessage('Valid order ID is required'),
    handleValidationErrors
];

// Restaurant ID parameter validation
const validateRestaurantId = [
    param('id')
        .isMongoId()
        .withMessage('Valid restaurant ID is required'),
    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

// FCM token validation
const validateFCMToken = [
    body('fcmToken')
        .trim()
        .notEmpty()
        .withMessage('FCM token is required'),
    handleValidationErrors
];

export {
    handleValidationErrors,
    validateRequest,
    validateUserRegistration,
    validateUserLogin,
    validateRestaurantRegistration,
    validateRestaurantLogin,
    validateOrderCreation,
    validateFoodItemCreation,
    validateOrderStatusUpdate,
    validateOrderId,
    validateRestaurantId,
    validatePagination,
    validateFCMToken
};
