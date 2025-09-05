import 'package:flutter/material.dart';
import '../models/restaurant.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';

enum AuthState { initial, loading, authenticated, unauthenticated, error }

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final SocketService _socketService = SocketService();

  AuthState _state = AuthState.initial;
  Restaurant? _restaurant;
  String? _token;
  String? _errorMessage;

  // Getters
  AuthState get state => _state;
  Restaurant? get restaurant => _restaurant;
  String? get token => _token;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _state == AuthState.authenticated;
  bool get isLoading => _state == AuthState.loading;

  // Initialize provider
  Future<void> init() async {
    try {
      await _authService.init();
      if (_authService.isAuthenticated) {
        _restaurant = _authService.currentRestaurant;
        _token = _authService.token;
        _state = AuthState.authenticated;
        await _socketService.connect();
      } else {
        _state = AuthState.unauthenticated;
      }
    } catch (e) {
      _state = AuthState.unauthenticated;
      _errorMessage = e.toString();
    }
    notifyListeners();
  }

  // Set authentication data
  void setAuthData(Restaurant restaurant, String token) {
    _restaurant = restaurant;
    _token = token;
    _state = AuthState.authenticated;
    _errorMessage = null;
    notifyListeners();
  }

  // Register restaurant
  Future<bool> register({
    required String name,
    required String ownerName,
    required String email,
    required String password,
    required String phone,
    required String street,
    required String city,
    required String state,
    required String zipCode,
    required List<String> cuisine,
    double? lat,
    double? lng,
  }) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();

      // Use provided coordinates or default to (0, 0)
      final coordinates = RestaurantCoordinates(
        lat: lat ?? 0.0,
        lng: lng ?? 0.0,
      );

      final address = RestaurantAddress(
        street: street,
        city: city,
        state: state,
        zipCode: zipCode,
        coordinates: coordinates,
      );

      final request = RestaurantRegisterRequest(
        name: name,
        ownerName: ownerName,
        email: email,
        password: password,
        phone: phone,
        address: address,
        cuisine: cuisine,
      );

      final authResult = await _authService.register(request);

      _restaurant = authResult.restaurant;
      _token = authResult.token;
      _state = AuthState.authenticated;

      notifyListeners();
      return true;
    } catch (e) {
      _state = AuthState.error;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Login restaurant
  Future<bool> login({required String email, required String password}) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();

      final request = RestaurantLoginRequest(email: email, password: password);

      final authResult = await _authService.login(request);

      _restaurant = authResult.restaurant;
      _token = authResult.token;
      _state = AuthState.authenticated;

      // Connect to socket
      await _socketService.connect();

      notifyListeners();
      return true;
    } catch (e) {
      _state = AuthState.error;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      _state = AuthState.loading;
      notifyListeners();

      // Disconnect socket
      _socketService.disconnect();

      // Clear auth data
      await _authService.logout();

      _restaurant = null;
      _token = null;
      _state = AuthState.unauthenticated;
      _errorMessage = null;

      notifyListeners();
    } catch (e) {
      _state = AuthState.error;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  // Update profile
  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();

      final updatedRestaurant = await _authService.updateProfile(updates);

      _restaurant = updatedRestaurant;
      _state = AuthState.authenticated;

      notifyListeners();
      return true;
    } catch (e) {
      _state = AuthState.error;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Update FCM token
  Future<void> updateFCMToken(String fcmToken) async {
    try {
      await _authService.updateFCMToken(fcmToken);
    } catch (e) {
      // Silently fail for FCM token updates
      print('Failed to update FCM token: $e');
    }
  }

  // Clear error
  void clearError() {
    _errorMessage = null;
    if (_state == AuthState.error) {
      _state = _restaurant != null
          ? AuthState.authenticated
          : AuthState.unauthenticated;
    }
    notifyListeners();
  }

  // Check if token needs refresh
  Future<void> checkTokenStatus() async {
    if (_state == AuthState.authenticated) {
      try {
        final refreshed = await _authService.refreshToken();
        if (refreshed) {
          _token = _authService.token;
          notifyListeners();
        }
      } catch (e) {
        // Token refresh failed, logout user
        await logout();
      }
    }
  }

  // Get restaurant details
  String get restaurantName => _restaurant?.name ?? '';
  String get restaurantEmail => _restaurant?.email ?? '';
  String get restaurantPhone => _restaurant?.phone ?? '';
  String get restaurantAddress => _restaurant?.address.fullAddress ?? '';
  List<String> get restaurantCuisine => _restaurant?.cuisine ?? [];
  bool get isRestaurantActive => _restaurant?.isActive ?? false;
  bool get isRestaurantVerified => _restaurant?.isVerified ?? false;
  double get restaurantRating => _restaurant?.rating?.average ?? 0.0;
  int get restaurantRatingCount => _restaurant?.rating?.count ?? 0;

  // Validation helpers
  String? validateEmail(String? email) => _authService.validateEmail(email);
  String? validatePassword(String? password) =>
      _authService.validatePassword(password);
  String? validatePhone(String? phone) => _authService.validatePhone(phone);
  String? validateRequired(String? value, String fieldName) =>
      _authService.validateRequired(value, fieldName);

  @override
  void dispose() {
    _socketService.dispose();
    super.dispose();
  }
}
