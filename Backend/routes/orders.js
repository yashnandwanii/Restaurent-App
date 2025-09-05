const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateUser, authenticateRestaurant } = require('../middleware/auth').default;
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation');

// Validation middleware
const createOrderValidation = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    body('items.*.foodItemId')
        .isMongoId()
        .withMessage('Invalid food item ID'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
    body('items.*.customizations')
        .optional()
        .isArray()
        .withMessage('Customizations must be an array'),
    body('deliveryAddress.street')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Street address must be between 5 and 200 characters'),
    body('deliveryAddress.city')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be between 2 and 50 characters'),
    body('deliveryAddress.zipCode')
        .trim()
        .isLength({ min: 5, max: 10 })
        .withMessage('Zip code must be between 5 and 10 characters'),
    body('paymentMethod')
        .isIn(['razorpay', 'cash_on_delivery'])
        .withMessage('Invalid payment method'),
];

const statusUpdateValidation = [
    body('status')
        .isIn(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'])
        .withMessage('Invalid order status'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Reason must not exceed 200 characters'),
];

const paramValidation = [
    param('orderId')
        .isMongoId()
        .withMessage('Invalid order ID'),
];

const queryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('status')
        .optional()
        .isIn(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'])
        .withMessage('Invalid status filter'),
];

// User Routes (Protected - User Authentication Required)
router.post(
    '/',
    authenticateUser,
    createOrderValidation,
    validateRequest,
    orderController.createOrder
);

router.get(
    '/user',
    authenticateUser,
    queryValidation,
    validateRequest,
    orderController.getUserOrders
);

router.get(
    '/:orderId',
    authenticateUser,
    paramValidation,
    validateRequest,
    orderController.getOrder
);

router.post(
    '/:orderId/cancel',
    authenticateUser,
    paramValidation,
    validateRequest,
    orderController.cancelOrder
);

// Restaurant Routes (Protected - Restaurant Authentication Required)
router.get(
    '/restaurant',
    authenticateRestaurant,
    queryValidation,
    validateRequest,
    orderController.getRestaurantOrders
);

router.get(
    '/restaurant/:orderId',
    authenticateRestaurant,
    paramValidation,
    validateRequest,
    orderController.getOrder
);

router.patch(
    '/:orderId/status',
    authenticateRestaurant,
    paramValidation,
    statusUpdateValidation,
    validateRequest,
    orderController.updateOrderStatus
);

router.post(
    '/:orderId/confirm',
    authenticateRestaurant,
    paramValidation,
    validateRequest,
    orderController.confirmOrder
);

router.post(
    '/:orderId/reject',
    authenticateRestaurant,
    paramValidation,
    body('reason')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Rejection reason must be between 5 and 200 characters'),
    validateRequest,
    orderController.rejectOrder
);

// Analytics Routes (Protected - Restaurant Authentication Required)
router.get(
    '/restaurant/analytics/dashboard',
    authenticateRestaurant,
    orderController.getRestaurantAnalytics
);

module.exports = router;
