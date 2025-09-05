class FoodItem {
  final String? id;
  final String restaurantId;
  final String name;
  final String? description;
  final String category;
  final double price;
  final double? originalPrice;
  final List<String> images;
  final String? imageUrl; // For backward compatibility
  final List<String>? ingredients;
  final List<String>? allergens;
  final NutritionalInfo? nutritionalInfo;
  final List<String>? tags;
  final int? preparationTime;
  final int? stock;
  final List<Customization>? customizations;
  final bool isAvailable;
  final FoodRating? rating;
  final int soldCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  FoodItem({
    this.id,
    required this.restaurantId,
    required this.name,
    this.description,
    required this.category,
    required this.price,
    this.originalPrice,
    this.images = const [],
    this.imageUrl,
    this.ingredients,
    this.allergens,
    this.nutritionalInfo,
    this.tags,
    this.preparationTime,
    this.stock,
    this.customizations,
    this.isAvailable = true,
    this.rating,
    this.soldCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  factory FoodItem.fromJson(Map<String, dynamic> json) {
    return FoodItem(
      id: json['_id'] ?? json['id'],
      restaurantId: json['restaurantId'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      category: json['category'] ?? '',
      price: (json['price'] ?? 0.0).toDouble(),
      originalPrice: json['originalPrice']?.toDouble(),
      images: List<String>.from(json['images'] ?? []),
      imageUrl: json['imageUrl'],
      ingredients: json['ingredients'] != null
          ? List<String>.from(json['ingredients'])
          : null,
      allergens: json['allergens'] != null
          ? List<String>.from(json['allergens'])
          : null,
      nutritionalInfo: json['nutritionalInfo'] != null
          ? NutritionalInfo.fromJson(json['nutritionalInfo'])
          : null,
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      preparationTime: json['preparationTime'],
      stock: json['stock'],
      customizations: json['customizations'] != null
          ? (json['customizations'] as List)
                .map((c) => Customization.fromJson(c))
                .toList()
          : null,
      isAvailable: json['isAvailable'] ?? true,
      rating: json['rating'] != null
          ? FoodRating.fromJson(json['rating'])
          : null,
      soldCount: json['soldCount'] ?? 0,
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
      'restaurantId': restaurantId,
      'name': name,
      if (description != null) 'description': description,
      'category': category,
      'price': price,
      if (originalPrice != null) 'originalPrice': originalPrice,
      'images': images,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (ingredients != null) 'ingredients': ingredients,
      if (allergens != null) 'allergens': allergens,
      if (nutritionalInfo != null) 'nutritionalInfo': nutritionalInfo!.toJson(),
      if (tags != null) 'tags': tags,
      if (preparationTime != null) 'preparationTime': preparationTime,
      if (stock != null) 'stock': stock,
      if (customizations != null)
        'customizations': customizations!.map((c) => c.toJson()).toList(),
      'isAvailable': isAvailable,
      if (rating != null) 'rating': rating!.toJson(),
      'soldCount': soldCount,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  FoodItem copyWith({
    String? id,
    String? restaurantId,
    String? name,
    String? description,
    String? category,
    double? price,
    double? originalPrice,
    List<String>? images,
    String? imageUrl,
    List<String>? ingredients,
    List<String>? allergens,
    NutritionalInfo? nutritionalInfo,
    List<String>? tags,
    int? preparationTime,
    int? stock,
    List<Customization>? customizations,
    bool? isAvailable,
    FoodRating? rating,
    int? soldCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return FoodItem(
      id: id ?? this.id,
      restaurantId: restaurantId ?? this.restaurantId,
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      price: price ?? this.price,
      originalPrice: originalPrice ?? this.originalPrice,
      images: images ?? this.images,
      imageUrl: imageUrl ?? this.imageUrl,
      ingredients: ingredients ?? this.ingredients,
      allergens: allergens ?? this.allergens,
      nutritionalInfo: nutritionalInfo ?? this.nutritionalInfo,
      tags: tags ?? this.tags,
      preparationTime: preparationTime ?? this.preparationTime,
      stock: stock ?? this.stock,
      customizations: customizations ?? this.customizations,
      isAvailable: isAvailable ?? this.isAvailable,
      rating: rating ?? this.rating,
      soldCount: soldCount ?? this.soldCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  double get discountPercentage {
    if (originalPrice == null || originalPrice! <= price) return 0.0;
    return ((originalPrice! - price) / originalPrice!) * 100;
  }

  bool get hasDiscount => discountPercentage > 0;

  String get mainImage {
    if (images.isNotEmpty) return images.first;
    if (imageUrl != null) return imageUrl!;
    return 'https://via.placeholder.com/300x200?text=No+Image';
  }

  bool get isInStock => stock == null || stock! > 0;
}

class NutritionalInfo {
  final int? calories;
  final double? protein;
  final double? carbs;
  final double? fat;
  final double? fiber;
  final double? sugar;
  final double? sodium;

  NutritionalInfo({
    this.calories,
    this.protein,
    this.carbs,
    this.fat,
    this.fiber,
    this.sugar,
    this.sodium,
  });

  factory NutritionalInfo.fromJson(Map<String, dynamic> json) {
    return NutritionalInfo(
      calories: json['calories'],
      protein: json['protein']?.toDouble(),
      carbs: json['carbs']?.toDouble(),
      fat: json['fat']?.toDouble(),
      fiber: json['fiber']?.toDouble(),
      sugar: json['sugar']?.toDouble(),
      sodium: json['sodium']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (calories != null) 'calories': calories,
      if (protein != null) 'protein': protein,
      if (carbs != null) 'carbs': carbs,
      if (fat != null) 'fat': fat,
      if (fiber != null) 'fiber': fiber,
      if (sugar != null) 'sugar': sugar,
      if (sodium != null) 'sodium': sodium,
    };
  }
}

class Customization {
  final String name;
  final List<CustomizationOption> options;
  final bool isRequired;
  final int? maxSelections;

  Customization({
    required this.name,
    required this.options,
    this.isRequired = false,
    this.maxSelections,
  });

  factory Customization.fromJson(Map<String, dynamic> json) {
    return Customization(
      name: json['name'] ?? '',
      options: (json['options'] as List? ?? [])
          .map((o) => CustomizationOption.fromJson(o))
          .toList(),
      isRequired: json['isRequired'] ?? false,
      maxSelections: json['maxSelections'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'options': options.map((o) => o.toJson()).toList(),
      'isRequired': isRequired,
      if (maxSelections != null) 'maxSelections': maxSelections,
    };
  }
}

class CustomizationOption {
  final String name;
  final double? additionalPrice;

  CustomizationOption({required this.name, this.additionalPrice});

  factory CustomizationOption.fromJson(Map<String, dynamic> json) {
    return CustomizationOption(
      name: json['name'] ?? '',
      additionalPrice: json['additionalPrice']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (additionalPrice != null) 'additionalPrice': additionalPrice,
    };
  }
}

class FoodRating {
  final double average;
  final int count;

  FoodRating({required this.average, required this.count});

  factory FoodRating.fromJson(Map<String, dynamic> json) {
    return FoodRating(
      average: (json['average'] ?? 0.0).toDouble(),
      count: json['count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'average': average, 'count': count};
  }
}

// Food creation/update request models
class CreateFoodItemRequest {
  final String name;
  final String? description;
  final String category;
  final double price;
  final double? originalPrice;
  final List<String> images;
  final String? imageUrl;
  final List<String>? ingredients;
  final List<String>? allergens;
  final NutritionalInfo? nutritionalInfo;
  final List<String>? tags;
  final int? preparationTime;
  final int? stock;
  final List<Customization>? customizations;

  CreateFoodItemRequest({
    required this.name,
    this.description,
    required this.category,
    required this.price,
    this.originalPrice,
    this.images = const [],
    this.imageUrl,
    this.ingredients,
    this.allergens,
    this.nutritionalInfo,
    this.tags,
    this.preparationTime,
    this.stock,
    this.customizations,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (description != null) 'description': description,
      'category': category,
      'price': price,
      if (originalPrice != null) 'originalPrice': originalPrice,
      'images': images,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (ingredients != null) 'ingredients': ingredients,
      if (allergens != null) 'allergens': allergens,
      if (nutritionalInfo != null) 'nutritionalInfo': nutritionalInfo!.toJson(),
      if (tags != null) 'tags': tags,
      if (preparationTime != null) 'preparationTime': preparationTime,
      if (stock != null) 'stock': stock,
      if (customizations != null)
        'customizations': customizations!.map((c) => c.toJson()).toList(),
    };
  }
}
