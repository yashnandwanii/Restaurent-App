import { EventEmitter } from 'events';

// Event constants
export const EVENTS = {
    USER_REGISTERED: 'user_registered',
    RESTAURANT_REGISTERED: 'restaurant_registered',
    ORDER_CREATED: 'order_created',
    ORDER_STATUS_UPDATED: 'order_status_updated',
    PAYMENT_PROCESSED: 'payment_processed',
    NOTIFICATION_SENT: 'notification_sent'
};

// Create a singleton instance
const eventBus = new EventEmitter();

// Function to publish events
export const publishNotificationEvent = (eventName, data) => {
    eventBus.emit(eventName, data);
};

// Function to subscribe to events
export const subscribeToEvent = (eventName, callback) => {
    eventBus.on(eventName, callback);
};

// Function to unsubscribe from events
export const unsubscribeFromEvent = (eventName, callback) => {
    eventBus.off(eventName, callback);
};

export default eventBus;
