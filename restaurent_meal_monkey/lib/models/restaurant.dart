class Coordinates {
  final String? id;
  final double latitude;
  final double longitude;
  final double latitudeDelta;
  final double longitudeDelta;
  final String address;
  final String title;

  Coordinates({
    this.id,
    required this.latitude,
    required this.longitude,
    this.latitudeDelta = 0.0122,
    this.longitudeDelta = 0.0122,
    required this.address,
    required this.title,
  });

  factory Coordinates.fromJson(Map<String, dynamic> json) {
    return Coordinates(
      id: json['id'],
      latitude: json['latitude']?.toDouble() ?? 0.0,
      longitude: json['longitude']?.toDouble() ?? 0.0,
      latitudeDelta: json['latitudeDelta']?.toDouble() ?? 0.0122,
      longitudeDelta: json['longitudeDelta']?.toDouble() ?? 0.0122,
      address: json['address'] ?? '',
      title: json['title'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'latitude': latitude,
      'longitude': longitude,
      'latitudeDelta': latitudeDelta,
      'longitudeDelta': longitudeDelta,
      'address': address,
      'title': title,
    };
  }
}

class Restaurant {
  final String? id;
  final String name;
  final String email;
  final String phone;
  final RestaurantAddress address;
  final List<String> cuisine;
  final RestaurantRating? rating;
  final Map<String, BusinessHours>? businessHours;
  final bool isActive;
  final bool isVerified;
  final List<String> fcmTokens;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Restaurant({
    this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.address,
    required this.cuisine,
    this.rating,
    this.businessHours,
    this.isActive = true,
    this.isVerified = false,
    this.fcmTokens = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    // Handle rating field - backend returns it as a number, but we need an object
    RestaurantRating? parsedRating;
    if (json['rating'] != null) {
      if (json['rating'] is Map<String, dynamic>) {
        // Already in correct format
        parsedRating = RestaurantRating.fromJson(json['rating']);
      } else {
        // Backend format: rating is a number, ratingCount is a string/number
        final ratingValue = (json['rating'] is int) 
            ? (json['rating'] as int).toDouble() 
            : (json['rating'] as double);
        final countValue = json['ratingCount'] != null
            ? (json['ratingCount'] is String 
                ? int.tryParse(json['ratingCount']) ?? 0
                : json['ratingCount'] as int)
            : 0;
        parsedRating = RestaurantRating(average: ratingValue, count: countValue);
      }
    }

    // Handle businessHours field - backend can return it as a string or Map
    Map<String, BusinessHours>? parsedBusinessHours;
    if (json['businessHours'] != null) {
      if (json['businessHours'] is Map<String, dynamic>) {
        // Already in correct format
        parsedBusinessHours = Map<String, BusinessHours>.from(
          (json['businessHours'] as Map<String, dynamic>).map(
            (key, value) => MapEntry(key, BusinessHours.fromJson(value)),
          ),
        );
      } else if (json['businessHours'] is String) {
        // Backend format: businessHours is a simple string like "24/7"
        // We'll just ignore it for now or could convert to a default structure
        parsedBusinessHours = null;
      }
    }

    // Handle address field - backend might have 'coords' instead
    RestaurantAddress parsedAddress;
    if (json['address'] != null && json['address'] is Map<String, dynamic>) {
      parsedAddress = RestaurantAddress.fromJson(json['address']);
    } else if (json['coords'] != null && json['coords'] is Map<String, dynamic>) {
      // Backend returns coords with a different structure
      final coords = json['coords'];
      final addressText = coords['address'] ?? '';
      // Try to parse the address text (e.g., "123 Admin Street, San Francisco, CA 94102")
      final parts = addressText.split(',').map((s) => s.trim()).toList();
      parsedAddress = RestaurantAddress(
        street: parts.isNotEmpty ? parts[0] : '',
        city: parts.length > 1 ? parts[1] : '',
        state: parts.length > 2 ? parts[2].split(' ').first : '',
        zipCode: parts.length > 2 ? parts[2].split(' ').skip(1).join(' ') : '',
        coordinates: RestaurantCoordinates(
          lat: (coords['latitude'] ?? 0.0).toDouble(),
          lng: (coords['longitude'] ?? 0.0).toDouble(),
        ),
      );
    } else {
      // Default empty address
      parsedAddress = RestaurantAddress(
        street: '',
        city: '',
        state: '',
        zipCode: '',
      );
    }

    return Restaurant(
      id: json['_id'] ?? json['id'],
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      address: parsedAddress,
      cuisine: List<String>.from(json['cuisine'] ?? []),
      rating: parsedRating,
      businessHours: parsedBusinessHours,
      isActive: json['isActive'] ?? true,
      isVerified: json['isVerified'] ?? false,
      fcmTokens: List<String>.from(json['fcmTokens'] ?? []),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) '_id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'address': address.toJson(),
      'cuisine': cuisine,
      if (rating != null) 'rating': rating!.toJson(),
      if (businessHours != null)
        'businessHours': businessHours!.map(
          (key, value) => MapEntry(key, value.toJson()),
        ),
      'isActive': isActive,
      'isVerified': isVerified,
      'fcmTokens': fcmTokens,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  Restaurant copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    RestaurantAddress? address,
    List<String>? cuisine,
    RestaurantRating? rating,
    Map<String, BusinessHours>? businessHours,
    bool? isActive,
    bool? isVerified,
    List<String>? fcmTokens,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Restaurant(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      cuisine: cuisine ?? this.cuisine,
      rating: rating ?? this.rating,
      businessHours: businessHours ?? this.businessHours,
      isActive: isActive ?? this.isActive,
      isVerified: isVerified ?? this.isVerified,
      fcmTokens: fcmTokens ?? this.fcmTokens,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class RestaurantAddress {
  final String street;
  final String city;
  final String state;
  final String zipCode;
  final RestaurantCoordinates? coordinates;

  RestaurantAddress({
    required this.street,
    required this.city,
    required this.state,
    required this.zipCode,
    this.coordinates,
  });

  factory RestaurantAddress.fromJson(Map<String, dynamic> json) {
    return RestaurantAddress(
      street: json['street'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      zipCode: json['zipCode'] ?? '',
      coordinates: json['coordinates'] != null
          ? RestaurantCoordinates.fromJson(json['coordinates'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'street': street,
      'city': city,
      'state': state,
      'zipCode': zipCode,
      if (coordinates != null) 'coordinates': coordinates!.toJson(),
    };
  }

  String get fullAddress => '$street, $city, $state $zipCode';
}

class RestaurantCoordinates {
  final double lat;
  final double lng;

  RestaurantCoordinates({required this.lat, required this.lng});

  factory RestaurantCoordinates.fromJson(Map<String, dynamic> json) {
    return RestaurantCoordinates(
      lat: (json['lat'] ?? 0.0).toDouble(),
      lng: (json['lng'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'lat': lat, 'lng': lng};
  }
}

class RestaurantRating {
  final double average;
  final int count;

  RestaurantRating({required this.average, required this.count});

  factory RestaurantRating.fromJson(Map<String, dynamic> json) {
    return RestaurantRating(
      average: (json['average'] ?? 0.0).toDouble(),
      count: json['count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'average': average, 'count': count};
  }
}

class BusinessHours {
  final String? open;
  final String? close;
  final bool isOpen;

  BusinessHours({this.open, this.close, this.isOpen = false});

  factory BusinessHours.fromJson(Map<String, dynamic> json) {
    return BusinessHours(
      open: json['open'],
      close: json['close'],
      isOpen: json['isOpen'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (open != null) 'open': open,
      if (close != null) 'close': close,
      'isOpen': isOpen,
    };
  }
}

// Auth models
class RestaurantAuth {
  final Restaurant restaurant;
  final String token;

  RestaurantAuth({required this.restaurant, required this.token});

  factory RestaurantAuth.fromJson(Map<String, dynamic> json) {
    return RestaurantAuth(
      restaurant: Restaurant.fromJson(json['restaurant'] ?? json['data']),
      token: json['token'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {'restaurant': restaurant.toJson(), 'token': token};
  }
}

class RestaurantRegisterRequest {
  final String name;
  final String email;
  final String password;
  final String phone;
  final String ownerName;
  final RestaurantAddress address;
  final List<String> cuisine;

  RestaurantRegisterRequest({
    required this.name,
    required this.email,
    required this.password,
    required this.phone,
    required this.ownerName,
    required this.address,
    required this.cuisine,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'email': email,
      'password': password,
      'phone': phone,
      'ownerName': ownerName,
      'address': address.toJson(),
      'cuisine': cuisine,
    };
  }
}

class RestaurantLoginRequest {
  final String email;
  final String password;

  RestaurantLoginRequest({required this.email, required this.password});

  Map<String, dynamic> toJson() {
    return {'email': email, 'password': password};
  }
}
