import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'network_service.dart';

class ApiConfig {
  // Use localhost for iOS Simulator, your machine IP for Android Emulator
  // If you're testing on iOS Simulator, use localhost
  // If you're testing on Android Emulator, use 10.0.2.2 (Android's localhost mapping)
  // If you're testing on physical device, use your machine's IP (172.25.252.81)
  static const String baseUrl = 'http://localhost:6013/api';
  static const String socketUrl = 'http://localhost:6013';

  // Alternative URLs for different environments
  static const String androidEmulatorUrl = 'http://10.0.2.2:6013/api';
  static const String physicalDeviceUrl = 'http://172.25.252.81:6013/api';

  // API Endpoints
  static const String authRegister = '/auth/restaurant/register';
  static const String authLogin = '/auth/restaurant/login';
  static const String food = '/food';
  static const String orders = '/orders';
  static const String payments = '/payments';

  // Storage Keys
  static const String tokenKey = 'restaurant_token';
  static const String userKey = 'restaurant_user';
  static const String fcmTokenKey = 'fcm_token';
}

class ApiClient {
  late Dio _dio;
  static ApiClient? _instance;
  final NetworkService _networkService = NetworkService();
  String? _currentBaseUrl;

  ApiClient._internal() {
    _initializeDio();
  }

  void _initializeDio([String? baseUrl]) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? ApiConfig.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _setupInterceptors();
  }

  static ApiClient get instance {
    _instance ??= ApiClient._internal();
    return _instance!;
  }

  Dio get dio => _dio;

  // Initialize with best available server URL
  Future<void> initializeWithBestUrl() async {
    print('🔍 Finding best server URL...');
    final bestUrl = await _networkService.getBestServerUrl();

    if (bestUrl != null && bestUrl != _currentBaseUrl) {
      print('🔄 Switching to best server URL: $bestUrl');
      _currentBaseUrl = bestUrl;
      _initializeDio(bestUrl);
    } else if (bestUrl == null) {
      print('⚠️ No server URL reachable, using default');
    }
  }

  void _setupInterceptors() {
    // Request interceptor to add auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString(ApiConfig.tokenKey);

          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          handler.next(options);
        },
        onResponse: (response, handler) {
          handler.next(response);
        },
        onError: (error, handler) async {
          // Handle token expiration
          if (error.response?.statusCode == 401) {
            await _clearAuthData();
            // You might want to navigate to login screen here
          }

          handler.next(error);
        },
      ),
    );

    // Logging interceptor for development
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (obj) => print('[API] $obj'),
      ),
    );
  }

  Future<void> _clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiConfig.tokenKey);
    await prefs.remove(ApiConfig.userKey);
  }

  // Generic GET request
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Generic POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Generic PUT request
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Generic PATCH request
  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.patch<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Generic DELETE request
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  ApiException _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          'Connection timeout. Please check your internet connection.',
          type: ApiExceptionType.timeout,
        );
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message =
            error.response?.data?['message'] ?? 'Something went wrong';

        switch (statusCode) {
          case 400:
            return ApiException(
              message,
              type: ApiExceptionType.badRequest,
              errors: error.response?.data?['errors'],
            );
          case 401:
            return ApiException(
              'Unauthorized access. Please login again.',
              type: ApiExceptionType.unauthorized,
            );
          case 403:
            return ApiException(
              'Access forbidden.',
              type: ApiExceptionType.forbidden,
            );
          case 404:
            return ApiException(
              'Resource not found.',
              type: ApiExceptionType.notFound,
            );
          case 422:
            return ApiException(
              message,
              type: ApiExceptionType.validation,
              errors: error.response?.data?['errors'],
            );
          case 500:
            return ApiException(
              'Server error. Please try again later.',
              type: ApiExceptionType.serverError,
            );
          default:
            return ApiException(message, type: ApiExceptionType.unknown);
        }
      case DioExceptionType.cancel:
        return ApiException(
          'Request cancelled.',
          type: ApiExceptionType.cancelled,
        );
      case DioExceptionType.connectionError:
        return ApiException(
          'No internet connection. Please check your network.',
          type: ApiExceptionType.noInternet,
        );
      default:
        return ApiException(
          'Something went wrong. Please try again.',
          type: ApiExceptionType.unknown,
        );
    }
  }
}

class ApiException implements Exception {
  final String message;
  final ApiExceptionType type;
  final List<dynamic>? errors;

  const ApiException(this.message, {required this.type, this.errors});

  @override
  String toString() => message;
}

enum ApiExceptionType {
  timeout,
  noInternet,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  validation,
  serverError,
  cancelled,
  unknown,
}

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final List<dynamic>? errors;
  final String? code;

  const ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.errors,
    this.code,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'],
      message: json['message'],
      errors: json['errors'],
      code: json['code'],
    );
  }
}
