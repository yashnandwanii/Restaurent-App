import FoodItem from '../models/FoodItem.js';
import Restaurant from '../models/Restaurant.js';

// Add Food Item (Restaurant only)
export const addFoodItem = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            price,
            originalPrice,
            images,
            imageUrl, // Keep for backward compatibility
            ingredients,
            allergens,
            nutritionalInfo,
            tags,
            preparationTime,
            stock,
            customizations
        } = req.body;

        const restaurantId = req.restaurantId;

        // Verify restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found',
                code: 'RESTAURANT_NOT_FOUND'
            });
        }

        // Create food item
        const foodItem = new FoodItem({
            restaurantId,
            name,
            description,
            category,
            price,
            originalPrice,
            images: images || (imageUrl ? [imageUrl] : []),
            imageUrl, // Keep for backward compatibility
            ingredients,
            allergens,
            nutritionalInfo,
            tags,
            preparationTime,
            stock,
            customizations
        });

        await foodItem.save();

        res.status(201).json({
            success: true,
            data: foodItem,
            message: 'Food item created successfully'
        });
    } catch (error) {
        console.error('Add food item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create food item',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get Restaurant Food Items
export const getRestaurantFoodItems = async (req, res) => {
    try {
        const restaurantId = req.restaurantId || req.params.restaurantId;
        const { category, isAvailable, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const query = { restaurantId };

        if (category) {
            query.category = category;
        }

        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable === 'true';
        }

        const skip = (page - 1) * limit;
        const foodItems = await FoodItem.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalItems = await FoodItem.countDocuments(query);

        res.json({
            success: true,
            data: {
                foodItems,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    hasNextPage: page * limit < totalItems,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get restaurant food items error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve food items',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Update Food Item
export const updateFoodItem = async (req, res) => {
    try {
        const { foodItemId } = req.params;
        const restaurantId = req.restaurantId;
        const updateData = req.body;

        const foodItem = await FoodItem.findOne({
            _id: foodItemId,
            restaurantId: restaurantId
        });

        if (!foodItem) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found',
                code: 'FOOD_ITEM_NOT_FOUND'
            });
        }

        // Update food item
        Object.assign(foodItem, updateData);
        await foodItem.save();

        res.json({
            success: true,
            data: foodItem,
            message: 'Food item updated successfully'
        });
    } catch (error) {
        console.error('Update food item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update food item',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Delete Food Item
export const deleteFoodItem = async (req, res) => {
    try {
        const { foodItemId } = req.params;
        const restaurantId = req.restaurantId;

        const foodItem = await FoodItem.findOneAndDelete({
            _id: foodItemId,
            restaurantId: restaurantId
        });

        if (!foodItem) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found',
                code: 'FOOD_ITEM_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            message: 'Food item deleted successfully'
        });
    } catch (error) {
        console.error('Delete food item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete food item',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get Food Item by ID
export const getFoodItem = async (req, res) => {
    try {
        const { foodItemId } = req.params;

        const foodItem = await FoodItem.findById(foodItemId)
            .populate('restaurantId', 'name address phone rating');

        if (!foodItem) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found',
                code: 'FOOD_ITEM_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: foodItem
        });
    } catch (error) {
        console.error('Get food item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve food item',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Search Food Items
export const searchFoodItems = async (req, res) => {
    try {
        const { query: searchQuery, category, minPrice, maxPrice, tags, page = 1, limit = 20 } = req.query;

        const filter = {};

        if (searchQuery) {
            filter.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { ingredients: { $in: [new RegExp(searchQuery, 'i')] } }
            ];
        }

        if (category) {
            filter.category = category;
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            filter.tags = { $in: tagArray };
        }

        filter.isAvailable = true;

        const skip = (page - 1) * limit;
        const foodItems = await FoodItem.find(filter)
            .populate('restaurantId', 'name address rating')
            .sort({ 'rating.average': -1, soldCount: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalItems = await FoodItem.countDocuments(filter);

        res.json({
            success: true,
            data: {
                foodItems,
                searchQuery,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    hasNextPage: page * limit < totalItems,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Search food items error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search food items',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Toggle Food Item Availability
export const toggleAvailability = async (req, res) => {
    try {
        const { foodItemId } = req.params;
        const restaurantId = req.restaurantId;

        const foodItem = await FoodItem.findOne({
            _id: foodItemId,
            restaurantId: restaurantId
        });

        if (!foodItem) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found',
                code: 'FOOD_ITEM_NOT_FOUND'
            });
        }

        foodItem.isAvailable = !foodItem.isAvailable;
        await foodItem.save();

        res.json({
            success: true,
            data: foodItem,
            message: `Food item ${foodItem.isAvailable ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error) {
        console.error('Toggle availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle food item availability',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Update Stock
export const updateStock = async (req, res) => {
    try {
        const { foodItemId } = req.params;
        const { stock } = req.body;
        const restaurantId = req.restaurantId;

        const foodItem = await FoodItem.findOne({
            _id: foodItemId,
            restaurantId: restaurantId
        });

        if (!foodItem) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found',
                code: 'FOOD_ITEM_NOT_FOUND'
            });
        }

        foodItem.stock = stock;
        await foodItem.save();

        res.json({
            success: true,
            data: foodItem,
            message: 'Stock updated successfully'
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update stock',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
