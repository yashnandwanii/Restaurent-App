import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/order.dart';
import 'auth_service.dart';
import 'api_client.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  final AuthService _authService = AuthService();

  // Stream controllers for different events
  final StreamController<Order> _newOrderController =
      StreamController<Order>.broadcast();
  final StreamController<Order> _orderUpdateController =
      StreamController<Order>.broadcast();
  final StreamController<Map<String, dynamic>> _notificationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<bool> _connectionController =
      StreamController<bool>.broadcast();

  // Getters for streams
  Stream<Order> get newOrderStream => _newOrderController.stream;
  Stream<Order> get orderUpdateStream => _orderUpdateController.stream;
  Stream<Map<String, dynamic>> get notificationStream =>
      _notificationController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;

  bool get isConnected => _socket?.connected ?? false;

  // Initialize socket connection
  Future<void> connect() async {
    if (_socket?.connected == true) {
      return; // Already connected
    }

    try {
      final token = _authService.token;
      if (token == null) {
        print('No auth token available for socket connection');
        return;
      }

      _socket = io.io(
        '${ApiConfig.socketUrl}/restaurants',
        io.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .setAuth({'token': token})
            .setExtraHeaders({'Authorization': 'Bearer $token'})
            .build(),
      );

      _setupEventListeners();

      _socket!.connect();

      print('Socket.IO connection initiated');
    } catch (e) {
      print('Failed to connect to socket: $e');
    }
  }

  // Disconnect socket
  void disconnect() {
    try {
      _socket?.disconnect();
      _socket?.dispose();
      _socket = null;
      _connectionController.add(false);
      print('Socket.IO disconnected');
    } catch (e) {
      print('Error disconnecting socket: $e');
    }
  }

  // Setup event listeners
  void _setupEventListeners() {
    if (_socket == null) return;

    // Connection events
    _socket!.onConnect((_) {
      print('Socket.IO connected');
      _connectionController.add(true);
      _joinRestaurantRoom();
    });

    _socket!.onDisconnect((_) {
      print('Socket.IO disconnected');
      _connectionController.add(false);
    });

    _socket!.onConnectError((data) {
      print('Socket.IO connection error: $data');
      _connectionController.add(false);
    });

    _socket!.onError((data) {
      print('Socket.IO error: $data');
    });

    // Order events
    _socket!.on('new_order', (data) {
      try {
        print('New order received: $data');
        final order = Order.fromJson(data);
        _newOrderController.add(order);
      } catch (e) {
        print('Error parsing new order: $e');
      }
    });

    _socket!.on('order_updated', (data) {
      try {
        print('Order updated: $data');
        final order = Order.fromJson(data);
        _orderUpdateController.add(order);
      } catch (e) {
        print('Error parsing order update: $e');
      }
    });

    _socket!.on('order_cancelled', (data) {
      try {
        print('Order cancelled: $data');
        final order = Order.fromJson(data);
        _orderUpdateController.add(order);
      } catch (e) {
        print('Error parsing order cancellation: $e');
      }
    });

    // Notification events
    _socket!.on('notification', (data) {
      try {
        print('Notification received: $data');
        _notificationController.add(Map<String, dynamic>.from(data));
      } catch (e) {
        print('Error parsing notification: $e');
      }
    });

    // Payment events
    _socket!.on('payment_completed', (data) {
      try {
        print('Payment completed: $data');
        final order = Order.fromJson(data['order']);
        _orderUpdateController.add(order);

        _notificationController.add({
          'type': 'payment_completed',
          'title': 'Payment Received',
          'message': 'Payment completed for order #${order.id}',
          'data': data,
        });
      } catch (e) {
        print('Error parsing payment completion: $e');
      }
    });

    _socket!.on('payment_failed', (data) {
      try {
        print('Payment failed: $data');
        _notificationController.add({
          'type': 'payment_failed',
          'title': 'Payment Failed',
          'message': 'Payment failed for order #${data['orderId']}',
          'data': data,
        });
      } catch (e) {
        print('Error parsing payment failure: $e');
      }
    });

    // Restaurant specific events
    _socket!.on('restaurant_status_update', (data) {
      try {
        print('Restaurant status update: $data');
        _notificationController.add({
          'type': 'restaurant_status',
          'title': 'Status Update',
          'message': data['message'] ?? 'Restaurant status updated',
          'data': data,
        });
      } catch (e) {
        print('Error parsing restaurant status update: $e');
      }
    });
  }

  // Join restaurant-specific room
  void _joinRestaurantRoom() {
    final restaurant = _authService.currentRestaurant;
    if (restaurant?.id != null && _socket?.connected == true) {
      _socket!.emit('join_restaurant', {'restaurantId': restaurant!.id});
      print('Joined restaurant room: ${restaurant.id}');
    }
  }

  // Emit order status update
  void emitOrderStatusUpdate(
    String orderId,
    OrderStatus status, {
    String? reason,
  }) {
    if (_socket?.connected == true) {
      _socket!.emit('order_status_update', {
        'orderId': orderId,
        'status': status.value,
        if (reason != null) 'reason': reason,
        'timestamp': DateTime.now().toIso8601String(),
      });
      print('Emitted order status update: $orderId -> ${status.value}');
    }
  }

  // Emit order confirmation
  void emitOrderConfirmation(String orderId, int estimatedTime) {
    if (_socket?.connected == true) {
      _socket!.emit('order_confirmed', {
        'orderId': orderId,
        'estimatedTime': estimatedTime,
        'timestamp': DateTime.now().toIso8601String(),
      });
      print('Emitted order confirmation: $orderId');
    }
  }

  // Emit order rejection
  void emitOrderRejection(String orderId, String reason) {
    if (_socket?.connected == true) {
      _socket!.emit('order_rejected', {
        'orderId': orderId,
        'reason': reason,
        'timestamp': DateTime.now().toIso8601String(),
      });
      print('Emitted order rejection: $orderId');
    }
  }

  // Emit restaurant online status
  void emitRestaurantOnline() {
    if (_socket?.connected == true) {
      _socket!.emit('restaurant_online', {
        'restaurantId': _authService.currentRestaurant?.id,
        'timestamp': DateTime.now().toIso8601String(),
      });
      print('Emitted restaurant online status');
    }
  }

  // Emit restaurant offline status
  void emitRestaurantOffline() {
    if (_socket?.connected == true) {
      _socket!.emit('restaurant_offline', {
        'restaurantId': _authService.currentRestaurant?.id,
        'timestamp': DateTime.now().toIso8601String(),
      });
      print('Emitted restaurant offline status');
    }
  }

  // Update restaurant availability
  void updateRestaurantAvailability(bool isAvailable) {
    if (_socket?.connected == true) {
      _socket!.emit('restaurant_availability', {
        'restaurantId': _authService.currentRestaurant?.id,
        'isAvailable': isAvailable,
        'timestamp': DateTime.now().toIso8601String(),
      });
      print('Updated restaurant availability: $isAvailable');
    }
  }

  // Send typing indicator for order updates
  void sendTypingIndicator(String orderId, bool isTyping) {
    if (_socket?.connected == true) {
      _socket!.emit('typing', {
        'orderId': orderId,
        'isTyping': isTyping,
        'restaurantId': _authService.currentRestaurant?.id,
      });
    }
  }

  // Request reconnection
  void reconnect() {
    if (_socket?.disconnected == true) {
      print('Attempting to reconnect socket...');
      _socket!.connect();
    }
  }

  // Check connection and auto-reconnect
  void checkConnection() {
    if (_authService.isAuthenticated && (_socket?.disconnected ?? true)) {
      print('Auto-reconnecting socket...');
      connect();
    }
  }

  // Dispose resources
  void dispose() {
    disconnect();
    _newOrderController.close();
    _orderUpdateController.close();
    _notificationController.close();
    _connectionController.close();
  }

  // Get socket connection status
  Map<String, dynamic> getConnectionInfo() {
    return {
      'connected': isConnected,
      'socketId': _socket?.id,
      'transport': _socket?.connected == true ? 'websocket' : null,
      'restaurantId': _authService.currentRestaurant?.id,
    };
  }

  // Manual emit for custom events
  void emit(String event, dynamic data) {
    if (_socket?.connected == true) {
      _socket!.emit(event, data);
      print('Emitted custom event: $event');
    } else {
      print('Cannot emit event - socket not connected');
    }
  }

  // Listen to custom events
  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  // Remove listener for specific event
  void off(String event) {
    _socket?.off(event);
  }
}
