# Restaurant Owner App

A beautiful Flutter frontend for restaurant owners to manage their food items and orders. This app provides a complete interface for authentication, food management, and order tracking, ready for backend integration.

## Features

### 🔐 Authentication
- **Login Screen**: Email & password validation with error handling
- **Signup Screen**: Restaurant name, email, password, and contact number fields
- **State Management**: Provider-based authentication state

### 🏠 Homepage
- **Restaurant Dashboard**: Shows restaurant name in app bar
- **Food Items List**: Displays all posted food items with images, titles, prices, and descriptions
- **Quick Actions**: Edit and delete buttons for each food item
- **Navigation**: Easy access to orders and add food screens

### ➕ Add New Food Item
- **Form Fields**: Name, description, price, and image selection
- **Image Picker**: Choose from gallery or enter image URL
- **Validation**: Comprehensive form validation
- **Local Storage**: Items stored in local state for testing

### 📋 Orders Management
- **Orders List**: Display customer orders with details
- **Order Cards**: Customer name, item ordered, quantity, and total price
- **Mock Notifications**: Simulated new order alerts
- **Actions**: Accept/decline order buttons (mock functionality)

### 🎨 Modern UI Design
- **Google Fonts**: Beautiful Poppins typography
- **Card Layouts**: Attractive cards for items and orders
- **Color Scheme**: Deep orange primary with amber accents
- **Responsive**: Works on various screen sizes
- **Material Design**: Follows Material Design 3 guidelines

## Technical Stack

- **Framework**: Flutter 3.8.1+
- **State Management**: Provider pattern
- **Dependencies**:
  - `provider ^6.0.5` - State management
  - `google_fonts ^6.0.0` - Typography
  - `image_picker ^1.0.7` - Image selection
- **Architecture**: MVVM with Provider
- **Navigation**: Named routes with MaterialApp

## Getting Started

### Prerequisites
- Flutter SDK 3.8.1 or higher
- Dart 3.0+
- VS Code or Android Studio
- iOS Simulator / Android Emulator

### Installation

1. **Install dependencies**
   ```bash
   flutter pub get
   ```

2. **Run the app**
   ```bash
   flutter run
   ```

### Testing the App

1. **Launch the app** - You'll see the login screen
2. **Sign up** - Create a new restaurant account with:
   - Restaurant Name: "Your Restaurant"
   - Email: "test@restaurant.com"
   - Password: "password123"
   - Contact: "1234567890"
3. **Explore Features**:
   - View pre-loaded food items on homepage
   - Add new food items using the + button
   - Check orders screen (orders icon in app bar)
   - Test edit/delete functionality
   - Log out and log back in

## Mock Data

The app includes sample data for testing:

### Food Items
- Margherita Pizza ($8.99)
- Veg Burger ($6.49)

### Orders
- Alice ordered 2x Margherita Pizza ($17.98)
- Bob ordered 1x Veg Burger ($6.49)

## Backend Integration Ready

This frontend is designed for easy backend integration:

### API Endpoints to Implement
```
POST /auth/login
POST /auth/signup
GET /auth/me
POST /auth/logout

GET /food-items
POST /food-items
PUT /food-items/:id
DELETE /food-items/:id

GET /orders
POST /orders
PUT /orders/:id/status
```

### State Management
- All network calls should replace the mock functions in providers
- Add loading states and error handling
- Implement proper authentication token management

### File Uploads
- Replace image picker mock with actual file upload to your server
- Implement image storage (AWS S3, Cloudinary, etc.)

## Built with ❤️ using Flutter
