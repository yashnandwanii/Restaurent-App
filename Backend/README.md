# Meal Monkey Backend - Production Ready Food Delivery API

A comprehensive, production-ready Node.js + Express + MongoDB backend for a Restaurant Owner app supporting both user and restaurant apps with real-time features, payment processing, and robust order management.

## 🚀 Features

### Core Features
- **JWT Authentication** with 21-day session storage for users and restaurants
- **Real-time Communication** via Socket.IO for order updates
- **Payment Processing** with Razorpay integration and webhook handling
- **Order Lifecycle Management** from creation to delivery
- **Event-Driven Architecture** with Redis pub/sub for scalability
- **Push Notifications** via Firebase Cloud Messaging (FCM)
- **Comprehensive Validation** and error handling
- **Rate Limiting** and security middleware
- **File Upload** support for food images

### Security Features
- Helmet.js for security headers
- Rate limiting per IP and route
- JWT token validation with expiration
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Request size limiting

### Performance Features
- Response compression
- Database indexing
- Optimized queries with pagination
- Redis caching for events
- Connection pooling

## 📦 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Cache/Pub-Sub**: Redis
- **Payments**: Razorpay
- **Notifications**: Firebase Cloud Messaging
- **Validation**: express-validator
- **Security**: Helmet, bcrypt, rate limiting

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- Firebase project with FCM enabled
- Razorpay account

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URLS=http://localhost:3000,http://localhost:3001

# Database
MONGODB_URI=mongodb://localhost:27017/meal-monkey
MONGODB_TEST_URI=mongodb://localhost:27017/meal-monkey-test

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRE=21d

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
MAX_FILE_SIZE=10
UPLOAD_PATH=./uploads/
```

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Restaurent-App/Backend

# Install dependencies
npm install

# Start MongoDB and Redis services
# MongoDB: brew services start mongodb/brew/mongodb-community (macOS)
# Redis: brew services start redis (macOS)

# Run the application
npm run dev          # Development mode with nodemon
npm start            # Production mode
npm run seed         # Seed database with sample data (if available)
```

## � API Documentation

### Authentication Endpoints

#### User Authentication
```http
POST /api/auth/user/register
POST /api/auth/user/login
```

#### Restaurant Authentication
```http
POST /api/auth/restaurant/register
POST /api/auth/restaurant/login
```

### Food Management Endpoints

#### Restaurant Routes (Authenticated)
```http
POST   /api/food                    # Add food item
GET    /api/food/restaurant         # Get restaurant's food items
PUT    /api/food/:id                # Update food item
DELETE /api/food/:id                # Delete food item
PATCH  /api/food/:id/availability   # Toggle availability
PATCH  /api/food/:id/stock          # Update stock
```

#### Public Routes
```http
GET /api/food/search              # Search food items
GET /api/food/restaurant/:id      # Get restaurant's public menu
GET /api/food/:id                 # Get food item details
```

### Order Management Endpoints

#### User Routes (Authenticated)
```http
POST   /api/orders                 # Create order
GET    /api/orders/user            # Get user's orders
GET    /api/orders/:id             # Get order details
POST   /api/orders/:id/cancel      # Cancel order
```

#### Restaurant Routes (Authenticated)
```http
GET    /api/orders/restaurant           # Get restaurant's orders
GET    /api/orders/restaurant/:id       # Get order details
PATCH  /api/orders/:id/status           # Update order status
POST   /api/orders/:id/confirm          # Confirm order
POST   /api/orders/:id/reject           # Reject order
GET    /api/orders/restaurant/analytics # Get analytics dashboard
```

### Payment Endpoints

#### User Routes (Authenticated)
```http
POST /api/payments/create          # Create payment
POST /api/payments/verify          # Verify payment
GET  /api/payments/:orderId        # Get payment status
POST /api/payments/:orderId/refund # Request refund
```

#### Webhook (Public)
```http
POST /api/payments/webhook         # Razorpay webhook
```

## 🏗️ Architecture

### Database Models

#### User Model
```javascript
{
  name: String,
  email: String (unique),
  phone: String (unique),
  password: String (hashed),
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: [Number]
  },
  fcmTokens: [String],
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Restaurant Model
```javascript
{
  name: String,
  email: String (unique),
  phone: String (unique),
  password: String (hashed),
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: [Number]
  },
  cuisine: [String],
  rating: {
    average: Number,
    count: Number
  },
  businessHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    // ... other days
  },
  isActive: Boolean,
  isVerified: Boolean,
  fcmTokens: [String],
  createdAt: Date,
  updatedAt: Date
}
```

#### Order Model
```javascript
{
  userId: ObjectId,
  restaurantId: ObjectId,
  items: [{
    foodItemId: ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    customizations: [String]
  }],
  status: String, // pending, confirmed, preparing, ready, picked_up, delivered, cancelled
  totalAmount: Number,
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: [Number]
  },
  paymentMethod: String,
  paymentStatus: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  statusHistory: [{
    status: String,
    timestamp: Date,
    updatedBy: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Event System
The application uses an event-driven architecture with Redis pub/sub:

```javascript
// Event Types
- order:created
- order:updated
- order:confirmed
- order:cancelled
- payment:completed
- payment:failed
- notification:sent
```

### Real-time Features
Socket.IO namespaces and rooms:
- `/users` namespace for user app
- `/restaurants` namespace for restaurant app
- Room-based communication for targeted updates

## 🔧 Development

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Code Quality
```bash
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format code with Prettier
```

### Database Operations
```bash
npm run db:seed       # Seed database with sample data
npm run db:migrate    # Run database migrations
npm run db:reset      # Reset database
```

## 🚀 Deployment

### Production Environment
1. Set `NODE_ENV=production` in environment variables
2. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

3. Set up MongoDB replica set for production
4. Configure Redis cluster for high availability
5. Set up load balancer (NGINX)
6. Enable SSL/TLS certificates

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale app=3
```

## 📊 Monitoring & Logging

### Health Checks
- `/health` endpoint for basic health monitoring
- Database connection status
- Redis connection status
- Memory and CPU usage

### Logging
- Development: Console logging with colors
- Production: JSON formatted logs
- Error tracking with stack traces
- Request/response logging

## � Security Considerations

1. **Rate Limiting**: Implemented per IP and route
2. **Input Validation**: All inputs validated and sanitized
3. **Authentication**: JWT tokens with expiration
4. **Password Security**: Bcrypt hashing with salt
5. **CORS**: Configured for specific origins
6. **Headers**: Security headers via Helmet.js
7. **File Upload**: Size and type restrictions
8. **Database**: Parameterized queries to prevent injection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

Built with ❤️ for Meal Monkey Food Delivery Platform
