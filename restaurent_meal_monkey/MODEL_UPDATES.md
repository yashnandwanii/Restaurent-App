# Updated Flutter Models - MongoDB Backend Integration

## Models Updated for Backend Compatibility

Your Flutter models have been updated to match your MongoDB schemas. Here's what changed:

### 🍕 FoodItem Model (`lib/models/food_item.dart`)

**New Properties (matching your MongoDB food schema):**
```dart
class FoodItem {
  final String? id;                              // MongoDB _id
  final String title;                            // name -> title
  final String time;                             // cooking/prep time
  final List<String> foodTags;                   // tags for categorization
  final List<String> imageUrl;                   // multiple images support
  final String category;                         // food category
  final List<String> foodType;                   // dietary restrictions, etc.
  final String code;                             // unique food code
  final bool isAvailable;                        // availability status
  final String restaurent;                       // restaurant ID reference
  final double price;                            // price (unchanged)
  final String description;                      // description (unchanged)
  final double rating;                           // customer rating
  final int ratingCount;                         // number of ratings
  final List<Map<String, dynamic>> additives;   // extra options/toppings
  
  // Backward compatibility helpers
  String get name => title;                      // UI still uses 'name'
  String get firstImageUrl => imageUrl.isNotEmpty ? imageUrl.first : '';
}
```

### 📋 Order Model (`lib/models/order.dart`)

**New Properties (matching your MongoDB order schema):**
```dart
class DeliveryAddress {
  final String line1;                            // customer name + address
  final String postalCode;                       // postal/zip code
}

class Order {
  final String? id;                              // MongoDB _id
  final String? paymentId;                       // payment transaction ID
  final String? orderId;                         // order reference ID
  final double amount;                           // total amount
  final String restaurantId;                     // restaurant ID
  final String restaurantName;                   // restaurant name
  final String foodId;                           // food item ID
  final String foodName;                         // food item name
  final List<String> additives;                  // selected add-ons
  final DeliveryAddress deliveryAddress;         // delivery info
  final DateTime createdAt;                      // order timestamp
  
  // Backward compatibility helpers
  String get customerName => deliveryAddress.line1.split(' ').first;
  String get itemOrdered => foodName;
  int get quantity => 1;                         // default (not in schema)
  double get totalPrice => amount;
}
```

### 🏪 New Restaurant Model (`lib/models/restaurant.dart`)

**New Model (matching your MongoDB restaurant schema):**
```dart
class Coordinates {
  final String? id;
  final double latitude;
  final double longitude;
  final double latitudeDelta;
  final double longitudeDelta;
  final String address;
  final String title;
}

class Restaurant {
  final String? id;
  final String title;                            // restaurant name
  final String time;                             // operating hours
  final String imageUrl;                         // restaurant image
  final List<String> foods;                      // food item IDs
  final bool pickup;                             // pickup available
  final bool delivery;                           // delivery available
  final bool isAvailable;                        // restaurant status
  final String owner;                            // owner ID
  final String code;                             // restaurant code
  final String logoUrl;                          // restaurant logo
  final double rating;                           // restaurant rating
  final String ratingCount;                      // number of ratings
  final String verification;                     // approval status
  final String verificationMessage;              // status message
  final Coordinates coords;                      // location data
}
```

### 👤 Updated User Model (`lib/models/user.dart`)

**Enhanced for restaurant owners:**
```dart
class User {
  final String? id;                              // user ID
  final String restaurantName;                   // restaurant name
  final String email;                            // email address
  final String contactNumber;                    // phone number
  final String? restaurantId;                    // reference to restaurant
}
```

## 🔄 JSON Serialization Ready

All models now include:
- `fromJson()` factory constructors for API responses
- `toJson()` methods for API requests
- Null safety with optional fields
- Backward compatibility helpers for existing UI

## 🛠 Backend Integration

**Ready for your Node.js + Express + MongoDB backend:**

```dart
// Example API call pattern
Future<List<FoodItem>> fetchFoodItems() async {
  final response = await http.get(Uri.parse('$baseUrl/food-items'));
  final List<dynamic> jsonList = json.decode(response.body);
  return jsonList.map((json) => FoodItem.fromJson(json)).toList();
}

Future<void> createFoodItem(FoodItem item) async {
  await http.post(
    Uri.parse('$baseUrl/food-items'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode(item.toJson()),
  );
}
```

## 🎯 What Works Now

✅ **Existing UI Compatibility** - All screens work with backward compatibility helpers  
✅ **Mock Data Updated** - Sample data uses new structure  
✅ **Type Safety** - Full null safety support  
✅ **JSON Ready** - Serialization for API integration  
✅ **Schema Matching** - Perfectly matches your MongoDB models  

## 🚀 Next Steps for Backend Integration

1. **Replace Provider mock methods** with HTTP calls
2. **Add authentication tokens** to API requests
3. **Implement error handling** for network failures
4. **Add loading states** during API calls
5. **File upload integration** for images

Your Flutter app is now perfectly aligned with your backend schema and ready for MongoDB integration!
