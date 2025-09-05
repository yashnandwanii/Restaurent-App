class DeliveryAddress {
  final String line1;
  final String postalCode;

  DeliveryAddress({required this.line1, required this.postalCode});

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) {
    return DeliveryAddress(
      line1: json['line1'] ?? '',
      postalCode: json['postalCode'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {'line1': line1, 'postalCode': postalCode};
  }
}

class Order {
  final String? id;
  final String userId;
  final String restaurantId;
  final List<OrderItem> items;
  final OrderStatus status;
  final double totalAmount;
  final OrderAddress deliveryAddress;
  final String paymentMethod;
  final PaymentStatus paymentStatus;
  final String? razorpayOrderId;
  final String? razorpayPaymentId;
  final DateTime? estimatedDeliveryTime;
  final DateTime? actualDeliveryTime;
  final List<StatusHistory> statusHistory;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Order({
    this.id,
    required this.userId,
    required this.restaurantId,
    required this.items,
    required this.status,
    required this.totalAmount,
    required this.deliveryAddress,
    required this.paymentMethod,
    required this.paymentStatus,
    this.razorpayOrderId,
    this.razorpayPaymentId,
    this.estimatedDeliveryTime,
    this.actualDeliveryTime,
    this.statusHistory = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['_id'] ?? json['id'],
      userId: json['userId'] ?? '',
      restaurantId: json['restaurantId'] ?? '',
      items: (json['items'] as List? ?? [])
          .map((item) => OrderItem.fromJson(item))
          .toList(),
      status: OrderStatusExtension.fromString(json['status'] ?? 'pending'),
      totalAmount: (json['totalAmount'] ?? 0.0).toDouble(),
      deliveryAddress: OrderAddress.fromJson(json['deliveryAddress'] ?? {}),
      paymentMethod: json['paymentMethod'] ?? '',
      paymentStatus: PaymentStatusExtension.fromString(
        json['paymentStatus'] ?? 'pending',
      ),
      razorpayOrderId: json['razorpayOrderId'],
      razorpayPaymentId: json['razorpayPaymentId'],
      estimatedDeliveryTime: json['estimatedDeliveryTime'] != null
          ? DateTime.parse(json['estimatedDeliveryTime'])
          : null,
      actualDeliveryTime: json['actualDeliveryTime'] != null
          ? DateTime.parse(json['actualDeliveryTime'])
          : null,
      statusHistory: (json['statusHistory'] as List? ?? [])
          .map((history) => StatusHistory.fromJson(history))
          .toList(),
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
      'userId': userId,
      'restaurantId': restaurantId,
      'items': items.map((item) => item.toJson()).toList(),
      'status': status.value,
      'totalAmount': totalAmount,
      'deliveryAddress': deliveryAddress.toJson(),
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus.value,
      if (razorpayOrderId != null) 'razorpayOrderId': razorpayOrderId,
      if (razorpayPaymentId != null) 'razorpayPaymentId': razorpayPaymentId,
      if (estimatedDeliveryTime != null)
        'estimatedDeliveryTime': estimatedDeliveryTime!.toIso8601String(),
      if (actualDeliveryTime != null)
        'actualDeliveryTime': actualDeliveryTime!.toIso8601String(),
      'statusHistory': statusHistory
          .map((history) => history.toJson())
          .toList(),
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  Order copyWith({
    String? id,
    String? userId,
    String? restaurantId,
    List<OrderItem>? items,
    OrderStatus? status,
    double? totalAmount,
    OrderAddress? deliveryAddress,
    String? paymentMethod,
    PaymentStatus? paymentStatus,
    String? razorpayOrderId,
    String? razorpayPaymentId,
    DateTime? estimatedDeliveryTime,
    DateTime? actualDeliveryTime,
    List<StatusHistory>? statusHistory,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Order(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      restaurantId: restaurantId ?? this.restaurantId,
      items: items ?? this.items,
      status: status ?? this.status,
      totalAmount: totalAmount ?? this.totalAmount,
      deliveryAddress: deliveryAddress ?? this.deliveryAddress,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      razorpayOrderId: razorpayOrderId ?? this.razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId ?? this.razorpayPaymentId,
      estimatedDeliveryTime:
          estimatedDeliveryTime ?? this.estimatedDeliveryTime,
      actualDeliveryTime: actualDeliveryTime ?? this.actualDeliveryTime,
      statusHistory: statusHistory ?? this.statusHistory,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);

  bool get canBeCancelled =>
      status == OrderStatus.pending || status == OrderStatus.confirmed;

  bool get canBeModified => status == OrderStatus.pending;

  String get formattedTotal => '₹${totalAmount.toStringAsFixed(2)}';
}

class OrderItem {
  final String foodItemId;
  final String name;
  final double price;
  final int quantity;
  final List<String>? customizations;

  OrderItem({
    required this.foodItemId,
    required this.name,
    required this.price,
    required this.quantity,
    this.customizations,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      foodItemId: json['foodItemId'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] ?? 0.0).toDouble(),
      quantity: json['quantity'] ?? 1,
      customizations: json['customizations'] != null
          ? List<String>.from(json['customizations'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'foodItemId': foodItemId,
      'name': name,
      'price': price,
      'quantity': quantity,
      if (customizations != null) 'customizations': customizations,
    };
  }

  double get subtotal => price * quantity;
  String get formattedSubtotal => '₹${subtotal.toStringAsFixed(2)}';
  String get formattedPrice => '₹${price.toStringAsFixed(2)}';
}

class OrderAddress {
  final String street;
  final String city;
  final String state;
  final String zipCode;
  final List<double>? coordinates;

  OrderAddress({
    required this.street,
    required this.city,
    required this.state,
    required this.zipCode,
    this.coordinates,
  });

  factory OrderAddress.fromJson(Map<String, dynamic> json) {
    return OrderAddress(
      street: json['street'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      zipCode: json['zipCode'] ?? '',
      coordinates: json['coordinates'] != null
          ? List<double>.from(json['coordinates'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'street': street,
      'city': city,
      'state': state,
      'zipCode': zipCode,
      if (coordinates != null) 'coordinates': coordinates,
    };
  }

  String get fullAddress => '$street, $city, $state $zipCode';
}

class StatusHistory {
  final OrderStatus status;
  final DateTime timestamp;
  final String? updatedBy;
  final String? reason;

  StatusHistory({
    required this.status,
    required this.timestamp,
    this.updatedBy,
    this.reason,
  });

  factory StatusHistory.fromJson(Map<String, dynamic> json) {
    return StatusHistory(
      status: OrderStatusExtension.fromString(json['status'] ?? 'pending'),
      timestamp: DateTime.parse(json['timestamp']),
      updatedBy: json['updatedBy'],
      reason: json['reason'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status.value,
      'timestamp': timestamp.toIso8601String(),
      if (updatedBy != null) 'updatedBy': updatedBy,
      if (reason != null) 'reason': reason,
    };
  }
}

enum OrderStatus {
  pending,
  confirmed,
  preparing,
  ready,
  pickedUp,
  delivered,
  cancelled,
}

extension OrderStatusExtension on OrderStatus {
  String get value {
    switch (this) {
      case OrderStatus.pending:
        return 'pending';
      case OrderStatus.confirmed:
        return 'confirmed';
      case OrderStatus.preparing:
        return 'preparing';
      case OrderStatus.ready:
        return 'ready';
      case OrderStatus.pickedUp:
        return 'picked_up';
      case OrderStatus.delivered:
        return 'delivered';
      case OrderStatus.cancelled:
        return 'cancelled';
    }
  }

  String get displayName {
    switch (this) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.preparing:
        return 'Preparing';
      case OrderStatus.ready:
        return 'Ready';
      case OrderStatus.pickedUp:
        return 'Picked Up';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }

  static OrderStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return OrderStatus.pending;
      case 'confirmed':
        return OrderStatus.confirmed;
      case 'preparing':
        return OrderStatus.preparing;
      case 'ready':
        return OrderStatus.ready;
      case 'picked_up':
        return OrderStatus.pickedUp;
      case 'delivered':
        return OrderStatus.delivered;
      case 'cancelled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.pending;
    }
  }
}

enum PaymentStatus { pending, processing, completed, failed, refunded }

extension PaymentStatusExtension on PaymentStatus {
  String get value {
    switch (this) {
      case PaymentStatus.pending:
        return 'pending';
      case PaymentStatus.processing:
        return 'processing';
      case PaymentStatus.completed:
        return 'completed';
      case PaymentStatus.failed:
        return 'failed';
      case PaymentStatus.refunded:
        return 'refunded';
    }
  }

  String get displayName {
    switch (this) {
      case PaymentStatus.pending:
        return 'Pending';
      case PaymentStatus.processing:
        return 'Processing';
      case PaymentStatus.completed:
        return 'Completed';
      case PaymentStatus.failed:
        return 'Failed';
      case PaymentStatus.refunded:
        return 'Refunded';
    }
  }

  static PaymentStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return PaymentStatus.pending;
      case 'processing':
        return PaymentStatus.processing;
      case 'completed':
        return PaymentStatus.completed;
      case 'failed':
        return PaymentStatus.failed;
      case 'refunded':
        return PaymentStatus.refunded;
      default:
        return PaymentStatus.pending;
    }
  }
}

// Analytics models
class OrderAnalytics {
  final int totalOrders;
  final double totalRevenue;
  final int pendingOrders;
  final int confirmedOrders;
  final int preparingOrders;
  final int readyOrders;
  final int deliveredOrders;
  final int cancelledOrders;
  final double averageOrderValue;
  final List<RevenueData> revenueData;
  final List<PopularItem> popularItems;

  OrderAnalytics({
    required this.totalOrders,
    required this.totalRevenue,
    required this.pendingOrders,
    required this.confirmedOrders,
    required this.preparingOrders,
    required this.readyOrders,
    required this.deliveredOrders,
    required this.cancelledOrders,
    required this.averageOrderValue,
    required this.revenueData,
    required this.popularItems,
  });

  factory OrderAnalytics.fromJson(Map<String, dynamic> json) {
    return OrderAnalytics(
      totalOrders: json['totalOrders'] ?? 0,
      totalRevenue: (json['totalRevenue'] ?? 0.0).toDouble(),
      pendingOrders: json['pendingOrders'] ?? 0,
      confirmedOrders: json['confirmedOrders'] ?? 0,
      preparingOrders: json['preparingOrders'] ?? 0,
      readyOrders: json['readyOrders'] ?? 0,
      deliveredOrders: json['deliveredOrders'] ?? 0,
      cancelledOrders: json['cancelledOrders'] ?? 0,
      averageOrderValue: (json['averageOrderValue'] ?? 0.0).toDouble(),
      revenueData: (json['revenueData'] as List? ?? [])
          .map((data) => RevenueData.fromJson(data))
          .toList(),
      popularItems: (json['popularItems'] as List? ?? [])
          .map((item) => PopularItem.fromJson(item))
          .toList(),
    );
  }
}

class RevenueData {
  final String date;
  final double revenue;
  final int orders;

  RevenueData({
    required this.date,
    required this.revenue,
    required this.orders,
  });

  factory RevenueData.fromJson(Map<String, dynamic> json) {
    return RevenueData(
      date: json['date'] ?? '',
      revenue: (json['revenue'] ?? 0.0).toDouble(),
      orders: json['orders'] ?? 0,
    );
  }
}

class PopularItem {
  final String name;
  final int orderCount;
  final double revenue;

  PopularItem({
    required this.name,
    required this.orderCount,
    required this.revenue,
  });

  factory PopularItem.fromJson(Map<String, dynamic> json) {
    return PopularItem(
      name: json['name'] ?? '',
      orderCount: json['orderCount'] ?? 0,
      revenue: (json['revenue'] ?? 0.0).toDouble(),
    );
  }
}
