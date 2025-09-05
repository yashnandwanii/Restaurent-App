import express from 'express';
import { body, param, query } from 'express-validator';
import {
    createRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant,
    searchRestaurantsByLocation
} from '../controllers/restaurantController.js';
import { verifyRestaurantToken } from '../middleware/verifyToken.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Validation middleware for restaurant creation
const restaurantCreationValidation = [
    body('title')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Restaurant title must be between 2 and 100 characters'),
    body('imageUrl')
        .isURL()
        .withMessage('Please provide a valid image URL'),
    body('owner')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Owner name must be between 2 and 100 characters'),
    body('code')
        .trim()
        .isLength({ min: 4, max: 20 })
        .withMessage('Restaurant code must be between 4 and 20 characters'),
    body('logoUrl')
        .isURL()
        .withMessage('Please provide a valid logo URL'),
    body('coords.id')
        .notEmpty()
        .withMessage('Coordinates ID is required'),
    body('coords.latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be a valid number between -90 and 90'),
    body('coords.longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be a valid number between -180 and 180'),
    body('coords.address')
        .trim()
        .notEmpty()
        .withMessage('Address is required'),
    body('coords.title')
        .trim()
        .notEmpty()
        .withMessage('Location title is required'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('phone')
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    validateRequest
];

// Parameter validation
const paramValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid restaurant ID'),
    validateRequest
];

// Location search validation
const locationSearchValidation = [
    query('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be a valid number between -90 and 90'),
    query('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be a valid number between -180 and 180'),
    query('radius')
        .optional()
        .isFloat({ min: 0.1, max: 100 })
        .withMessage('Radius must be between 0.1 and 100 km'),
    validateRequest
];

// Create Restaurant
router.post(
    '/',
    restaurantCreationValidation,
    createRestaurant
);

// Get All Restaurants
router.get(
    '/',
    getAllRestaurants
);

// Search Restaurants by Location
router.get(
    '/search/location',
    locationSearchValidation,
    searchRestaurantsByLocation
);

// Get Restaurant by ID
router.get(
    '/:id',
    paramValidation,
    getRestaurantById
);

// Update Restaurant (Protected - Restaurant Authentication Required)
router.put(
    '/:id',
    verifyRestaurantToken,
    paramValidation,
    updateRestaurant
);

// Delete Restaurant (Protected - Restaurant Authentication Required)
router.delete(
    '/:id',
    verifyRestaurantToken,
    paramValidation,
    deleteRestaurant
);

export default router;
