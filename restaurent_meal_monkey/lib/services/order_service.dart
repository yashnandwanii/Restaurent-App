import '../models/order.dart';
import 'api_client.dart';

class OrderService {
  static final OrderService _instance = OrderService._internal();
  factory OrderService() => _instance;
  OrderService._internal();

  final ApiClient _apiClient = ApiClient.instance;

  // Get restaurant orders
  Future<List<Order>> getRestaurantOrders({
    OrderStatus? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{'page': page, 'limit': limit};

      if (status != null) {
        queryParams['status'] = status.value;
      }

      final response = await _apiClient.get<Map<String, dynamic>>(
        '${ApiConfig.orders}/restaurant',
        queryParameters: queryParams,
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<Map<String, dynamic>>.fromJson(
          response.data!,
          (data) => data,
        );

        if (apiResponse.success && apiResponse.data != null) {
          final ordersData = apiResponse.data!['orders'] as List? ?? [];
          return ordersData.map((order) => Order.fromJson(order)).toList();
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to fetch orders',
            type: ApiExceptionType.serverError,
            errors: apiResponse.errors,
          );
        }
      } else {
        throw const ApiException(
          'Invalid response from server',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw const ApiException(
        'Failed to fetch orders. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Get order by ID
  Future<Order> getOrder(String orderId) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        '${ApiConfig.orders}/restaurant/$orderId',
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<Order>.fromJson(
          response.data!,
          (data) => Order.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Order not found',
            type: ApiExceptionType.notFound,
            errors: apiResponse.errors,
          );
        }
      } else {
        throw const ApiException(
          'Invalid response from server',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw const ApiException(
        'Failed to fetch order. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Update order status
  Future<Order> updateOrderStatus(
    String orderId,
    OrderStatus status, {
    String? reason,
  }) async {
    try {
      final data = <String, dynamic>{'status': status.value};

      if (reason != null && reason.isNotEmpty) {
        data['reason'] = reason;
      }

      final response = await _apiClient.patch<Map<String, dynamic>>(
        '${ApiConfig.orders}/$orderId/status',
        data: data,
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<Order>.fromJson(
          response.data!,
          (data) => Order.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to update order status',
            type: ApiExceptionType.serverError,
            errors: apiResponse.errors,
          );
        }
      } else {
        throw const ApiException(
          'Invalid response from server',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw const ApiException(
        'Failed to update order status. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Confirm order
  Future<Order> confirmOrder(String orderId) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '${ApiConfig.orders}/$orderId/confirm',
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<Order>.fromJson(
          response.data!,
          (data) => Order.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to confirm order',
            type: ApiExceptionType.serverError,
            errors: apiResponse.errors,
          );
        }
      } else {
        throw const ApiException(
          'Invalid response from server',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw const ApiException(
        'Failed to confirm order. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Reject order
  Future<Order> rejectOrder(String orderId, String reason) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '${ApiConfig.orders}/$orderId/reject',
        data: {'reason': reason},
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<Order>.fromJson(
          response.data!,
          (data) => Order.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to reject order',
            type: ApiExceptionType.serverError,
            errors: apiResponse.errors,
          );
        }
      } else {
        throw const ApiException(
          'Invalid response from server',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw const ApiException(
        'Failed to reject order. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Get restaurant analytics
  Future<OrderAnalytics> getRestaurantAnalytics({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};

      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }

      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }

      final response = await _apiClient.get<Map<String, dynamic>>(
        '${ApiConfig.orders}/restaurant/analytics/dashboard',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<OrderAnalytics>.fromJson(
          response.data!,
          (data) => OrderAnalytics.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to fetch analytics',
            type: ApiExceptionType.serverError,
            errors: apiResponse.errors,
          );
        }
      } else {
        throw const ApiException(
          'Invalid response from server',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw const ApiException(
        'Failed to fetch analytics. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Get orders count by status
  Future<Map<OrderStatus, int>> getOrdersCountByStatus() async {
    try {
      final orders = await getRestaurantOrders(limit: 1000); // Get all orders
      final counts = <OrderStatus, int>{};

      // Initialize all statuses with 0
      for (final status in OrderStatus.values) {
        counts[status] = 0;
      }

      // Count orders by status
      for (final order in orders) {
        counts[order.status] = (counts[order.status] ?? 0) + 1;
      }

      return counts;
    } catch (e) {
      // Return empty counts if error
      final counts = <OrderStatus, int>{};
      for (final status in OrderStatus.values) {
        counts[status] = 0;
      }
      return counts;
    }
  }

  // Get recent orders
  Future<List<Order>> getRecentOrders({int limit = 10}) async {
    return getRestaurantOrders(limit: limit);
  }

  // Get pending orders
  Future<List<Order>> getPendingOrders() async {
    return getRestaurantOrders(status: OrderStatus.pending);
  }

  // Get today's orders
  Future<List<Order>> getTodaysOrders() async {
    try {
      final now = DateTime.now();
      final startOfDay = DateTime(now.year, now.month, now.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));

      // Note: This would require additional backend support for date filtering
      // For now, we'll get all orders and filter client-side
      final allOrders = await getRestaurantOrders(limit: 1000);

      return allOrders.where((order) {
        if (order.createdAt == null) return false;
        return order.createdAt!.isAfter(startOfDay) &&
            order.createdAt!.isBefore(endOfDay);
      }).toList();
    } catch (e) {
      if (e is ApiException) rethrow;
      throw const ApiException(
        'Failed to fetch today\'s orders. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Calculate order metrics
  OrderMetrics calculateOrderMetrics(List<Order> orders) {
    if (orders.isEmpty) {
      return OrderMetrics(
        totalOrders: 0,
        totalRevenue: 0.0,
        averageOrderValue: 0.0,
        completedOrders: 0,
        cancelledOrders: 0,
        completionRate: 0.0,
        cancellationRate: 0.0,
      );
    }

    final totalOrders = orders.length;
    final totalRevenue = orders.fold<double>(
      0.0,
      (sum, order) => sum + order.totalAmount,
    );
    final averageOrderValue = totalRevenue / totalOrders;

    final completedOrders = orders
        .where((order) => order.status == OrderStatus.delivered)
        .length;
    final cancelledOrders = orders
        .where((order) => order.status == OrderStatus.cancelled)
        .length;

    final completionRate = (completedOrders / totalOrders) * 100;
    final cancellationRate = (cancelledOrders / totalOrders) * 100;

    return OrderMetrics(
      totalOrders: totalOrders,
      totalRevenue: totalRevenue,
      averageOrderValue: averageOrderValue,
      completedOrders: completedOrders,
      cancelledOrders: cancelledOrders,
      completionRate: completionRate,
      cancellationRate: cancellationRate,
    );
  }

  // Helper methods for order status transitions
  bool canTransitionTo(OrderStatus currentStatus, OrderStatus newStatus) {
    switch (currentStatus) {
      case OrderStatus.pending:
        return [
          OrderStatus.confirmed,
          OrderStatus.cancelled,
        ].contains(newStatus);
      case OrderStatus.confirmed:
        return [
          OrderStatus.preparing,
          OrderStatus.cancelled,
        ].contains(newStatus);
      case OrderStatus.preparing:
        return [OrderStatus.ready].contains(newStatus);
      case OrderStatus.ready:
        return [OrderStatus.pickedUp].contains(newStatus);
      case OrderStatus.pickedUp:
        return [OrderStatus.delivered].contains(newStatus);
      case OrderStatus.delivered:
      case OrderStatus.cancelled:
        return false; // Terminal states
    }
  }

  List<OrderStatus> getValidNextStatuses(OrderStatus currentStatus) {
    switch (currentStatus) {
      case OrderStatus.pending:
        return [OrderStatus.confirmed, OrderStatus.cancelled];
      case OrderStatus.confirmed:
        return [OrderStatus.preparing, OrderStatus.cancelled];
      case OrderStatus.preparing:
        return [OrderStatus.ready];
      case OrderStatus.ready:
        return [OrderStatus.pickedUp];
      case OrderStatus.pickedUp:
        return [OrderStatus.delivered];
      case OrderStatus.delivered:
      case OrderStatus.cancelled:
        return []; // Terminal states
    }
  }

  // Validation methods
  String? validateRejectionReason(String? reason) {
    if (reason == null || reason.trim().isEmpty) {
      return 'Rejection reason is required';
    }
    if (reason.trim().length < 5) {
      return 'Reason must be at least 5 characters';
    }
    if (reason.trim().length > 200) {
      return 'Reason must not exceed 200 characters';
    }
    return null;
  }
}

// Order metrics helper class
class OrderMetrics {
  final int totalOrders;
  final double totalRevenue;
  final double averageOrderValue;
  final int completedOrders;
  final int cancelledOrders;
  final double completionRate;
  final double cancellationRate;

  OrderMetrics({
    required this.totalOrders,
    required this.totalRevenue,
    required this.averageOrderValue,
    required this.completedOrders,
    required this.cancelledOrders,
    required this.completionRate,
    required this.cancellationRate,
  });

  String get formattedTotalRevenue => '₹${totalRevenue.toStringAsFixed(2)}';
  String get formattedAverageOrderValue =>
      '₹${averageOrderValue.toStringAsFixed(2)}';
  String get formattedCompletionRate => '${completionRate.toStringAsFixed(1)}%';
  String get formattedCancellationRate =>
      '${cancellationRate.toStringAsFixed(1)}%';
}
