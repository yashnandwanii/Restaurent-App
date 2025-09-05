const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateUser } = require('../middleware/auth').default;
const { body, param } = require('express-validator');
const { validateRequest } = require('../middleware/validation');

// Validation middleware
const createPaymentValidation = [
    body('orderId')
        .isMongoId()
        .withMessage('Invalid order ID'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number'),
];

const verifyPaymentValidation = [
    body('razorpay_order_id')
        .notEmpty()
        .withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id')
        .notEmpty()
        .withMessage('Razorpay payment ID is required'),
    body('razorpay_signature')
        .notEmpty()
        .withMessage('Razorpay signature is required'),
];

const refundValidation = [
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Refund reason must not exceed 200 characters'),
];

const paramValidation = [
    param('orderId')
        .isMongoId()
        .withMessage('Invalid order ID'),
];

// Payment Routes (Protected - User Authentication Required)
router.post(
    '/create',
    authenticateUser,
    createPaymentValidation,
    validateRequest,
    paymentController.createPaymentIntent
);

router.post(
    '/verify',
    authenticateUser,
    verifyPaymentValidation,
    validateRequest,
    paymentController.verifyPayment
);

router.get(
    '/:orderId',
    authenticateUser,
    paramValidation,
    validateRequest,
    paymentController.getPaymentStatus
);

router.post(
    '/:orderId/refund',
    authenticateUser,
    paramValidation,
    refundValidation,
    validateRequest,
    paymentController.initiateRefund
);

// Webhook Route (Public - No Authentication)
router.post('/webhook', paymentController.handlePaymentWebhook);

module.exports = router;
