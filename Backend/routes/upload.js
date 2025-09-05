import express from 'express';
import multer, { memoryStorage } from 'multer';
import cloudinary from '../config/cloudinary.js';
import { verifyRestaurantToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Configure multer for memory storage
const storage = memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

// Upload single image
router.post('/food-image', verifyRestaurantToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided',
                code: 'NO_FILE'
            });
        }

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'meal-monkey/food-items',
                    resource_type: 'image',
                    transformation: [
                        { width: 800, height: 600, crop: 'fill', quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });

        res.status(200).json({
            success: true,
            data: {
                imageUrl: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height
            },
            message: 'Image uploaded successfully'
        });

    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Upload multiple images
router.post('/food-images', verifyRestaurantToken, upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided',
                code: 'NO_FILES'
            });
        }

        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: 'meal-monkey/food-items',
                        resource_type: 'image',
                        transformation: [
                            { width: 800, height: 600, crop: 'fill', quality: 'auto' },
                            { fetch_format: 'auto' }
                        ]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve({
                            imageUrl: result.secure_url,
                            publicId: result.public_id,
                            width: result.width,
                            height: result.height
                        });
                    }
                ).end(file.buffer);
            });
        });

        const uploadResults = await Promise.all(uploadPromises);

        res.status(200).json({
            success: true,
            data: {
                images: uploadResults,
                count: uploadResults.length
            },
            message: `${uploadResults.length} images uploaded successfully`
        });

    } catch (error) {
        console.error('Multiple images upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Delete image from Cloudinary
router.delete('/food-image/:publicId', verifyRestaurantToken, async (req, res) => {
    try {
        const { publicId } = req.params;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required',
                code: 'MISSING_PUBLIC_ID'
            });
        }

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            res.status(200).json({
                success: true,
                message: 'Image deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Image not found or already deleted',
                code: 'IMAGE_NOT_FOUND'
            });
        }

    } catch (error) {
        console.error('Image deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete image',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

export default router;
