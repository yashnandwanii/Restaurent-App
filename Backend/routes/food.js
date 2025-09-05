import express from 'express';
import { body, param, query } from 'express-validator';
import {
    addFoodItem,
    getRestaurantFoodItems,
    updateFoodItem,
    deleteFoodItem,
    getFoodItem,
    searchFoodItems,
    toggleAvailability,
    updateStock
} from '../controllers/foodController.js';
import { verifyRestaurantToken, verifyUserToken } from '../middleware/verifyToken.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Validation middleware
const foodItemValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Food name must be between 2 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    body('category')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category must be between 2 and 50 characters'),
    body('price')
        .isFloat({ min: 0.01 })
        .withMessage('Price must be a positive number'),
    body('originalPrice')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Original price must be a positive number'),
    body('preparationTime')
        .optional()
        .isInt({ min: 1, max: 180 })
        .withMessage('Preparation time must be between 1 and 180 minutes'),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
];

const stockUpdateValidation = [
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
];

const searchValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum price must be non-negative'),
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum price must be non-negative'),
];

const paramValidation = [
    param('foodItemId')
        .isMongoId()
        .withMessage('Invalid food item ID'),
];

const restaurantParamValidation = [
    param('restaurantId')
        .isMongoId()
        .withMessage('Invalid restaurant ID'),
];

// Restaurant Routes (Protected - Restaurant Authentication Required)
router.post(
    '/',
    verifyRestaurantToken,
    foodItemValidation,
    validateRequest,
    addFoodItem
);

router.get(
    '/restaurant',
    verifyRestaurantToken,
    searchValidation,
    validateRequest,
    getRestaurantFoodItems
);

router.put(
    '/:foodItemId',
    verifyRestaurantToken,
    paramValidation,
    foodItemValidation,
    validateRequest,
    updateFoodItem
);

router.delete(
    '/:foodItemId',
    verifyRestaurantToken,
    paramValidation,
    validateRequest,
    deleteFoodItem
);

router.patch(
    '/:foodItemId/availability',
    verifyRestaurantToken,
    paramValidation,
    validateRequest,
    toggleAvailability
);

router.patch(
    '/:foodItemId/stock',
    verifyRestaurantToken,
    paramValidation,
    stockUpdateValidation,
    validateRequest,
    updateStock
);

// Public Routes (No Authentication Required)
router.get(
    '/search',
    searchValidation,
    validateRequest,
    searchFoodItems
);

router.get(
    '/restaurant/:restaurantId',
    restaurantParamValidation,
    searchValidation,
    validateRequest,
    getRestaurantFoodItems
);

router.get(
    '/:foodItemId',
    paramValidation,
    validateRequest,
    getFoodItem
);

export default router;
