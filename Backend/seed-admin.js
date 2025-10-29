import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './models/Restaurant.js';

// Load environment variables
dotenv.config();

const seedAdminRestaurant = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGOURI);
        console.log('✅ Connected to MongoDB');

        // Check if admin restaurant already exists
        const existingAdmin = await Restaurant.findOne({ email: 'admin@mealmonkey.com' });
        
        if (existingAdmin) {
            console.log('⚠️  Admin restaurant already exists');
            console.log('Email:', existingAdmin.email);
            console.log('Restaurant:', existingAdmin.title);
            
            // Update password and ensure account is active
            existingAdmin.password = 'admin123';
            existingAdmin.isActive = true;
            await existingAdmin.save();
            console.log('✅ Admin password updated to: admin123');
            console.log('✅ Account activated');
        } else {
            // Create admin restaurant
            const adminRestaurant = new Restaurant({
                title: 'Meal Monkey Admin Restaurant',
                time: '30 min',
                imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
                pickup: true,
                delivery: true,
                isAvailable: true,
                owner: 'Admin',
                code: 'ADMIN001',
                logoUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200',
                rating: 5,
                ratingCount: '100',
                verification: 'Verified',
                verificationMessage: 'Admin restaurant - Verified',
                coords: {
                    id: 'admin-location',
                    latitude: 37.7749,
                    longitude: -122.4194,
                    address: '123 Admin Street, San Francisco, CA 94102',
                    title: 'Admin Restaurant Location',
                    latitudeDelta: 0.0122,
                    longitudeDelta: 0.0122
                },
                businessHours: '24/7',
                email: 'admin@mealmonkey.com',
                password: 'admin123',
                phone: '+1234567890',
                isOpen: true,
                isActive: true
            });

            await adminRestaurant.save();
            console.log('✅ Admin restaurant created successfully!');
        }

        console.log('\n📋 Admin Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Email:    admin@mealmonkey.com');
        console.log('Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🎉 Admin setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin restaurant:', error);
        process.exit(1);
    }
};

seedAdminRestaurant();
