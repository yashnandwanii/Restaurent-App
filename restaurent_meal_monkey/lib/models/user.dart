class User {
  final String? id;
  final String restaurantName;
  final String email;
  final String contactNumber;
  final String? restaurantId; // Reference to the restaurant document

  User({
    this.id,
    required this.restaurantName,
    required this.email,
    required this.contactNumber,
    this.restaurantId,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'],
      restaurantName: json['restaurantName'] ?? json['title'] ?? '',
      email: json['email'] ?? '',
      contactNumber: json['contactNumber'] ?? '',
      restaurantId: json['restaurantId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'restaurantName': restaurantName,
      'email': email,
      'contactNumber': contactNumber,
      'restaurantId': restaurantId,
    };
  }
}
