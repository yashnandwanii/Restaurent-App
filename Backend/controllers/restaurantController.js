import Restaurant from '../models/Restaurant.js';

// Create Restaurant with Location Data
export const createRestaurant = async (req, res) => {
    try {
        const {
            title,
            time,
            imageUrl,
            foods,
            pickup,
            delivery,
            isAvailable,
            owner,
            code,
            logoUrl,
            rating,
            ratingCount,
            verification,
            verificationMessage,
            coords,
            businessHours,
            email,
            password,
            phone
        } = req.body;

        // Validate required fields
        if (!title || !imageUrl || !owner || !code || !logoUrl || !coords || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                required: ['title', 'imageUrl', 'owner', 'code', 'logoUrl', 'coords', 'email', 'password', 'phone']
            });
        }

        // Validate coords structure
        if (!coords.id || !coords.latitude || !coords.longitude || !coords.address || !coords.title) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coords structure',
                required: ['coords.id', 'coords.latitude', 'coords.longitude', 'coords.address', 'coords.title']
            });
        }

        // Check if restaurant already exists
        const existingRestaurant = await Restaurant.findOne({
            $or: [{ email }, { phone }, { code }]
        });

        if (existingRestaurant) {
            return res.status(400).json({
                success: false,
                message: existingRestaurant.email === email ?
                    'Restaurant with this email already exists' :
                    existingRestaurant.phone === phone ?
                        'Restaurant with this phone number already exists' :
                        'Restaurant with this code already exists',
                code: 'RESTAURANT_EXISTS'
            });
        }

        // Create new restaurant
        const restaurant = new Restaurant({
            title,
            time: time || "30 min",
            imageUrl,
            foods: foods || [],
            pickup: pickup !== undefined ? pickup : true,
            delivery: delivery !== undefined ? delivery : true,
            isAvailable: isAvailable !== undefined ? isAvailable : true,
            owner,
            code,
            logoUrl,
            rating: rating || 0,
            ratingCount: ratingCount || "0",
            verification: verification || 'Pending',
            verificationMessage: verificationMessage || "Your restaurant is under review.",
            coords: {
                id: coords.id,
                latitude: parseFloat(coords.latitude),
                longitude: parseFloat(coords.longitude),
                address: coords.address,
                title: coords.title,
                latitudeDelta: coords.latitudeDelta || 0.0122,
                longitudeDelta: coords.longitudeDelta || 0.0122
            },
            businessHours: businessHours || "10:00 am - 10:00 pm",
            email,
            password,
            phone,
            __v: 0
        });

        const savedRestaurant = await restaurant.save();

        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully',
            data: {
                restaurant: savedRestaurant
            }
        });

    } catch (error) {
        console.error('Restaurant creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create restaurant',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get All Restaurants
export const getAllRestaurants = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, verification, isAvailable } = req.query;

        // Build filter object
        const filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { owner: { $regex: search, $options: 'i' } },
                { 'coords.address': { $regex: search, $options: 'i' } }
            ];
        }

        if (verification) {
            filter.verification = verification;
        }

        if (isAvailable !== undefined) {
            filter.isAvailable = isAvailable === 'true';
        }

        const restaurants = await Restaurant.find(filter)
            .populate('foods')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Restaurant.countDocuments(filter);

        res.json({
            success: true,
            data: {
                restaurants,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });

    } catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch restaurants',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get Restaurant by ID
export const getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findById(id).populate('foods');

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.json({
            success: true,
            data: { restaurant }
        });

    } catch (error) {
        console.error('Get restaurant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch restaurant',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Update Restaurant
export const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove sensitive fields from update
        delete updateData.password;
        delete updateData.email;
        delete updateData.__v;

        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.json({
            success: true,
            message: 'Restaurant updated successfully',
            data: { restaurant }
        });

    } catch (error) {
        console.error('Update restaurant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update restaurant',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Delete Restaurant
export const deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findByIdAndDelete(id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.json({
            success: true,
            message: 'Restaurant deleted successfully'
        });

    } catch (error) {
        console.error('Delete restaurant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete restaurant',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Search Restaurants by Location
export const searchRestaurantsByLocation = async (req, res) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const restaurants = await Restaurant.find({
            'coords.latitude': {
                $gte: parseFloat(latitude) - parseFloat(radius) / 111,
                $lte: parseFloat(latitude) + parseFloat(radius) / 111
            },
            'coords.longitude': {
                $gte: parseFloat(longitude) - parseFloat(radius) / 111,
                $lte: parseFloat(longitude) + parseFloat(radius) / 111
            },
            isAvailable: true,
            verification: 'Verified'
        }).populate('foods');

        res.json({
            success: true,
            data: {
                restaurants,
                count: restaurants.length
            }
        });

    } catch (error) {
        console.error('Search restaurants error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search restaurants',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
