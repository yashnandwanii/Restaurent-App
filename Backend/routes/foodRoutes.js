const express = require('express');
const router = express.Router();
const { addFoodItem } = require('../controllers/foodController');

router.post('/food-items', addFoodItem);

module.exports = router;
