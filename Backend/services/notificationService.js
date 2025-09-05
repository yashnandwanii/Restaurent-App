import admin from 'firebase-admin';
// Temporarily remove circular dependency
// import { subscribeToEvent, EVENTS } from './eventBus.js';

class NotificationService {
    constructor() {
        this.initializeFirebase();
        this.setupEventListeners();
    }

    initializeFirebase() {
        try {
            // Only initialize if not already initialized
            if (!admin.apps.length) {
                // You'll need to add your Firebase service account key
                // For now, we'll just log that Firebase is not configured
                console.log('Firebase Admin SDK not configured. Notifications will be logged only.');
            }
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
        }
    }

    setupEventListeners() {
        // Temporarily commented out to avoid circular dependency
        // subscribeToEvent(EVENTS.USER_REGISTERED, this.handleUserRegistered.bind(this));
        // subscribeToEvent(EVENTS.RESTAURANT_REGISTERED, this.handleRestaurantRegistered.bind(this));
        // subscribeToEvent(EVENTS.ORDER_CREATED, this.handleOrderCreated.bind(this));
        // subscribeToEvent(EVENTS.ORDER_STATUS_UPDATED, this.handleOrderStatusUpdated.bind(this));
    }

    async sendNotification(fcmToken, title, body, data = {}) {
        try {
            if (!admin.apps.length) {
                console.log('Mock notification sent:', { fcmToken, title, body, data });
                return { success: true, mockNotification: true };
            }

            const message = {
                notification: {
                    title,
                    body
                },
                data,
                token: fcmToken
            };

            const response = await admin.messaging().send(message);
            console.log('Notification sent successfully:', response);
            return { success: true, messageId: response };
        } catch (error) {
            console.error('Error sending notification:', error);
            return { success: false, error: error.message };
        }
    }

    async sendMulticastNotification(fcmTokens, title, body, data = {}) {
        try {
            if (!admin.apps.length) {
                console.log('Mock multicast notification sent:', { fcmTokens, title, body, data });
                return { success: true, mockNotification: true };
            }

            const message = {
                notification: {
                    title,
                    body
                },
                data,
                tokens: fcmTokens
            };

            const response = await admin.messaging().sendMulticast(message);
            console.log('Multicast notification sent:', response);
            return { success: true, response };
        } catch (error) {
            console.error('Error sending multicast notification:', error);
            return { success: false, error: error.message };
        }
    }

    handleUserRegistered(userData) {
        console.log('User registered event received:', userData.email);
        // Send welcome notification if FCM token is available
        if (userData.fcmToken) {
            this.sendNotification(
                userData.fcmToken,
                'Welcome to Meal Monkey!',
                'Thank you for joining us. Start exploring delicious meals!'
            );
        }
    }

    handleRestaurantRegistered(restaurantData) {
        console.log('Restaurant registered event received:', restaurantData.name);
        // Send welcome notification for restaurant
        if (restaurantData.fcmToken) {
            this.sendNotification(
                restaurantData.fcmToken,
                'Welcome to Meal Monkey Restaurant!',
                'Your restaurant has been successfully registered. Start adding your menu items!'
            );
        }
    }

    handleOrderCreated(orderData) {
        console.log('Order created event received:', orderData.orderId);
        // Notify restaurant about new order
        if (orderData.restaurantFcmToken) {
            this.sendNotification(
                orderData.restaurantFcmToken,
                'New Order Received!',
                `You have a new order #${orderData.orderId}`,
                { orderId: orderData.orderId.toString() }
            );
        }
    }

    handleOrderStatusUpdated(orderData) {
        console.log('Order status updated event received:', orderData.orderId);
        // Notify user about order status change
        if (orderData.userFcmToken) {
            this.sendNotification(
                orderData.userFcmToken,
                'Order Status Updated',
                `Your order #${orderData.orderId} is now ${orderData.status}`,
                { orderId: orderData.orderId.toString(), status: orderData.status }
            );
        }
    }
}

const notificationService = new NotificationService();
export default notificationService;
