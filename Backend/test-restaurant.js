// Test script for restaurant creation
import fetch from 'node-fetch';

const testRestaurantData = {
    title: "Haldirams",
    time: "15 min",
    imageUrl: "https://res.cloudinary.com/dkwedcimq/image/upload/v1748687956/Haldiram.jpg",
    pickup: true,
    delivery: true,
    isAvailable: true,
    owner: "rovnovrna",
    code: "41007428",
    logoUrl: "https://res.cloudinary.com/dkwedcimq/image/upload/v1748687558/Haldiram.jpg",
    rating: 5,
    ratingCount: "6765",
    verification: "Pending",
    verificationMessage: "Your restaurant is under review.",
    coords: {
        id: "2023",
        latitude: 28.63096,
        longitude: 77.222195,
        address: "698 Post St, San Francisco, CA 94109, United States",
        title: "Haldirams",
        latitudeDelta: 0.0122,
        longitudeDelta: 0.0122
    },
    businessHours: "10:00 am - 10:00 pm",
    email: "haldirams@example.com",
    password: "password123",
    phone: "+1234567890"
};

async function testRestaurantCreation() {
    try {
        console.log('Testing restaurant creation...');

        const response = await fetch('http://localhost:3001/api/restaurants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testRestaurantData)
        });

        const result = await response.json();

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log('✅ Restaurant created successfully!');
            console.log('Restaurant ID:', result.data.restaurant._id);
            console.log('Collection used:', 'restaurents');
        } else {
            console.log('❌ Failed to create restaurant');
        }

    } catch (error) {
        console.error('Error testing restaurant creation:', error);
    }
}

async function testGetRestaurants() {
    try {
        console.log('\nTesting get restaurants...');

        const response = await fetch('http://localhost:3001/api/restaurants');
        const result = await response.json();

        console.log('Status:', response.status);
        console.log('Total restaurants:', result.data?.total || 0);

        if (result.data?.restaurants?.length > 0) {
            console.log('✅ Restaurants retrieved successfully!');
            console.log('First restaurant:', result.data.restaurants[0].title);
        }

    } catch (error) {
        console.error('Error testing get restaurants:', error);
    }
}

// Run tests
testRestaurantCreation()
    .then(() => testGetRestaurants())
    .then(() => process.exit(0));
