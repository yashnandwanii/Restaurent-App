import express from 'express';
import { body, param, query } from 'express-validator';
import authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validation.js';
import { verifyRestaurantToken, verifyUserToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Validation middleware
const restaurantRegisterValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Restaurant name must be between 2 and 100 characters'),
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
    body('address.street')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Street address must be between 5 and 200 characters'),
    body('address.city')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be between 2 and 50 characters'),
    body('address.state')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('State must be between 2 and 50 characters'),
    body('address.zipCode')
        .trim()
        .isLength({ min: 3, max: 10 })
        .withMessage('Zip code must be between 3 and 10 characters'),
];

const restaurantLoginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 1 })
        .withMessage('Password is required'),
];

const userRegisterValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
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
];

const userLoginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 1 })
        .withMessage('Password is required'),
];

// Restaurant Authentication Routes
router.post(
    '/restaurant/register',
    restaurantRegisterValidation,
    validateRequest,
    authController.registerRestaurant
);

router.post(
    '/restaurant/login',
    restaurantLoginValidation,
    validateRequest,
    authController.loginRestaurant
);

// router.get(
//     '/restaurant/profile',
//     verifyRestaurantToken,
//     authController.getRestaurantProfile
// );

// router.put(
//     '/restaurant/profile',
//     verifyRestaurantToken,
//     authController.updateRestaurantProfile
// );

// User Authentication Routes
router.post(
    '/user/register',
    userRegisterValidation,
    validateRequest,
    authController.registerUser
);

router.post(
    '/user/login',
    userLoginValidation,
    validateRequest,
    authController.loginUser
);

// router.get(
//     '/user/profile',
//     verifyUserToken,
//     authController.getUserProfile
// );

// router.put(
//     '/user/profile',
//     verifyUserToken,
//     authController.updateUserProfile
// );

// Password reset routes - temporarily disabled
// router.post(
//     '/restaurant/forgot-password',
//     body('email').isEmail().normalizeEmail(),
//     validateRequest,
//     authController.forgotRestaurantPassword
// );

// router.post(
//     '/restaurant/reset-password',
//     body('token').isLength({ min: 1 }),
//     body('password').isLength({ min: 6 }),
//     validateRequest,
//     authController.resetRestaurantPassword
// );

// router.post(
//     '/user/forgot-password',
//     body('email').isEmail().normalizeEmail(),
//     validateRequest,
//     authController.forgotUserPassword
// );

// router.post(
//     '/user/reset-password',
//     body('token').isLength({ min: 1 }),
//     body('password').isLength({ min: 6 }),
//     validateRequest,
//     authController.resetUserPassword
// );

export default router;
