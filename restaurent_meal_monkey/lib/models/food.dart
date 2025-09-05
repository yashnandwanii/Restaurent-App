class Food {
  final String? id;
  final String title;
  final String time;
  final List<String> foodTags;
  final List<String> imageUrl;
  final String category;
  final List<String> foodType;
  final String code;
  final bool isAvailable;
  final String restaurentId;
  final double price;
  final String description;
  final double rating;
  final int ratingCount;
  final List<String> additives;

  Food({
    this.id,
    required this.title,
    required this.time,
    required this.foodTags,
    required this.imageUrl,
    required this.category,
    required this.foodType,
    required this.code,
    this.isAvailable = true,
    required this.restaurentId,
    required this.price,
    required this.description,
    this.rating = 0,
    this.ratingCount = 0,
    required this.additives,
  });

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'time': time,
      'foodTags': foodTags,
      'imageUrl': imageUrl,
      'category': category,
      'foodType': foodType,
      'code': code,
      'isAvailable': isAvailable,
      'restaurent': restaurentId, // Note: backend expects 'restaurent' field
      'price': price,
      'description': description,
      'additives': additives,
    };
  }

  factory Food.fromJson(Map<String, dynamic> json) {
    return Food(
      id: json['_id'],
      title: json['title'],
      time: json['time'],
      foodTags: List<String>.from(json['foodTags']),
      imageUrl: List<String>.from(json['imageUrl']),
      category: json['category'],
      foodType: List<String>.from(json['foodType']),
      code: json['code'],
      isAvailable: json['isAvailable'] ?? true,
      restaurentId: json['restaurent'],
      price: json['price'].toDouble(),
      description: json['description'],
      rating: (json['rating'] ?? 0).toDouble(),
      ratingCount: json['ratingCount'] ?? 0,
      additives: List<String>.from(json['additives'] ?? []),
    );
  }
}
