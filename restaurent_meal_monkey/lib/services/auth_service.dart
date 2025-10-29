import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/restaurant.dart';
import 'api_client.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final ApiClient _apiClient = ApiClient.instance;
  Restaurant? _currentRestaurant;
  String? _token;

  // Getters
  Restaurant? get currentRestaurant => _currentRestaurant;
  String? get token => _token;
  bool get isAuthenticated => _token != null && _currentRestaurant != null;

  // Initialize auth state from storage
  Future<void> init() async {
    // Initialize API client with best server URL
    await _apiClient.initializeWithBestUrl();
    await _loadAuthState();
  }

  // Register restaurant
  Future<RestaurantAuth> register(RestaurantRegisterRequest request) async {
    try {
      print('🚀 Starting restaurant registration...');
      print('📤 Request data: ${request.toJson()}');

      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiConfig.authRegister,
        data: request.toJson(),
      );

      print('📥 Response received: ${response.statusCode}');
      print('📥 Response data: ${response.data}');

      if (response.data != null) {
        final apiResponse = ApiResponse<RestaurantAuth>.fromJson(
          response.data!,
          (data) => RestaurantAuth.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          await _saveAuthState(apiResponse.data!);
          print('✅ Registration successful!');
          return apiResponse.data!;
        } else {
          print('❌ Registration failed: ${apiResponse.message}');
          throw ApiException(
            apiResponse.message ?? 'Registration failed',
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
      print('💥 Registration error: $e');
      if (e is DioException) {
        print('🔍 DioException details:');
        print('  - Type: ${e.type}');
        print('  - Message: ${e.message}');
        print('  - Response: ${e.response?.data}');
        print('  - Status Code: ${e.response?.statusCode}');

        if (e.response?.data != null) {
          // Try to parse server error response
          try {
            final errorData = e.response!.data;
            if (errorData is Map<String, dynamic>) {
              throw ApiException(
                errorData['message'] ?? 'Registration failed',
                type: ApiExceptionType.serverError,
              );
            }
          } catch (_) {
            // Fall through to generic error
          }
        }

        throw ApiException(
          'Network error: ${e.message ?? 'Please check your connection'}',
          type: ApiExceptionType.timeout,
        );
      }

      if (e is ApiException) rethrow;
      throw const ApiException(
        'Registration failed. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Login restaurant
  Future<RestaurantAuth> login(RestaurantLoginRequest request) async {
    try {
      print('🚀 Starting restaurant login...');
      print('📤 Request data: ${request.toJson()}');
      
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiConfig.authLogin,
        data: request.toJson(),
      );

      print('📥 Response received: ${response.statusCode}');
      print('📥 Response data: ${response.data}');

      if (response.data != null) {
        final apiResponse = ApiResponse<RestaurantAuth>.fromJson(
          response.data!,
          (data) {
            print('🔍 Parsing RestaurantAuth from data: $data');
            return RestaurantAuth.fromJson(data);
          },
        );

        print('✅ API Response success: ${apiResponse.success}');
        print('✅ API Response data: ${apiResponse.data}');
        print('✅ API Response message: ${apiResponse.message}');

        if (apiResponse.success && apiResponse.data != null) {
          await _saveAuthState(apiResponse.data!);
          print('✅ Login successful! Token saved.');
          return apiResponse.data!;
        } else {
          print('❌ Login failed: ${apiResponse.message}');
          throw ApiException(
            apiResponse.message ?? 'Login failed',
            type: ApiExceptionType.unauthorized,
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
      print('💥 Login error: $e');
      if (e is DioException) {
        print('🔍 DioException details:');
        print('  - Type: ${e.type}');
        print('  - Message: ${e.message}');
        print('  - Response: ${e.response?.data}');
        print('  - Status Code: ${e.response?.statusCode}');
      }
      if (e is ApiException) rethrow;
      throw const ApiException(
        'Login failed. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Logout
  Future<void> logout() async {
    await _clearAuthState();
  }

  // Update restaurant profile
  Future<Restaurant> updateProfile(Map<String, dynamic> updates) async {
    try {
      if (!isAuthenticated) {
        throw const ApiException(
          'Not authenticated',
          type: ApiExceptionType.unauthorized,
        );
      }

      final response = await _apiClient.put<Map<String, dynamic>>(
        '/restaurant/profile',
        data: updates,
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<Restaurant>.fromJson(
          response.data!,
          (data) => Restaurant.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          _currentRestaurant = apiResponse.data;
          await _saveRestaurantState(apiResponse.data!);
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Profile update failed',
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
        'Profile update failed. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Update FCM token
  Future<void> updateFCMToken(String fcmToken) async {
    try {
      if (!isAuthenticated) return;

      await _apiClient.post<Map<String, dynamic>>(
        '/restaurant/fcm-token',
        data: {'fcmToken': fcmToken},
      );
    } catch (e) {
      // Silently fail for FCM token updates
      print('Failed to update FCM token: $e');
    }
  }

  // Refresh token (if needed)
  Future<bool> refreshToken() async {
    try {
      if (_token == null) return false;

      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'token': _token},
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<Map<String, dynamic>>.fromJson(
          response.data!,
          (data) => data,
        );

        if (apiResponse.success && apiResponse.data != null) {
          final newToken = apiResponse.data!['token'] as String?;
          if (newToken != null) {
            _token = newToken;
            await _saveTokenState(newToken);
            return true;
          }
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Private methods
  Future<void> _saveAuthState(RestaurantAuth auth) async {
    _currentRestaurant = auth.restaurant;
    _token = auth.token;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConfig.tokenKey, auth.token);
    await prefs.setString(
      ApiConfig.userKey,
      jsonEncode(auth.restaurant.toJson()),
    );
  }

  Future<void> _saveRestaurantState(Restaurant restaurant) async {
    _currentRestaurant = restaurant;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConfig.userKey, jsonEncode(restaurant.toJson()));
  }

  Future<void> _saveTokenState(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConfig.tokenKey, token);
  }

  Future<void> _loadAuthState() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      _token = prefs.getString(ApiConfig.tokenKey);

      final restaurantJson = prefs.getString(ApiConfig.userKey);
      if (restaurantJson != null) {
        final restaurantData =
            jsonDecode(restaurantJson) as Map<String, dynamic>;
        _currentRestaurant = Restaurant.fromJson(restaurantData);
      }
    } catch (e) {
      print('Error loading auth state: $e');
      await _clearAuthState();
    }
  }

  Future<void> _clearAuthState() async {
    _currentRestaurant = null;
    _token = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiConfig.tokenKey);
    await prefs.remove(ApiConfig.userKey);
  }

  // Validation methods
  bool isValidEmail(String email) {
    return RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(email);
  }

  bool isValidPassword(String password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    return RegExp(
      r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
    ).hasMatch(password);
  }

  bool isValidPhone(String phone) {
    return RegExp(r'^\+?[1-9]\d{1,14}$').hasMatch(phone);
  }

  String? validateEmail(String? email) {
    if (email == null || email.trim().isEmpty) {
      return 'Email is required';
    }
    if (!isValidEmail(email.trim())) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  String? validatePassword(String? password) {
    if (password == null || password.isEmpty) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!isValidPassword(password)) {
      return 'Password must contain uppercase, lowercase, number and special character';
    }
    return null;
  }

  String? validatePhone(String? phone) {
    if (phone == null || phone.trim().isEmpty) {
      return 'Phone number is required';
    }
    if (!isValidPhone(phone.trim())) {
      return 'Please enter a valid phone number';
    }
    return null;
  }

  String? validateRequired(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }
}
