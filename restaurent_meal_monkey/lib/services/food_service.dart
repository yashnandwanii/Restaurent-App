import 'dart:io';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:http/http.dart' as http;
import '../models/food_item.dart';
import 'api_client.dart';

class FoodService {
  static final FoodService _instance = FoodService._internal();
  factory FoodService() => _instance;
  FoodService._internal();

  final ApiClient _apiClient = ApiClient.instance;

  // Get restaurant's food items
  Future<List<FoodItem>> getRestaurantFoodItems({
    String? category,
    bool? isAvailable,
    int page = 1,
    int limit = 20,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
        'sortBy': sortBy,
        'sortOrder': sortOrder,
      };

      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }

      if (isAvailable != null) {
        queryParams['isAvailable'] = isAvailable.toString();
      }

      final response = await _apiClient.get<Map<String, dynamic>>(
        '${ApiConfig.food}/restaurant',
        queryParameters: queryParams,
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<Map<String, dynamic>>.fromJson(
          response.data!,
          (data) => data,
        );

        if (apiResponse.success && apiResponse.data != null) {
          final foodItemsData = apiResponse.data!['foodItems'] as List? ?? [];
          return foodItemsData.map((item) => FoodItem.fromJson(item)).toList();
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to fetch food items',
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
        'Failed to fetch food items. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Add new food item
  Future<FoodItem> addFood(FoodItem foodItem) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiConfig.food,
        data: foodItem.toJson(),
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<FoodItem>.fromJson(
          response.data!,
          (data) => FoodItem.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to add food item',
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
        'Failed to add food item. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Get food item by ID
  Future<FoodItem> getFoodItem(String foodItemId) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        '${ApiConfig.food}/$foodItemId',
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<FoodItem>.fromJson(
          response.data!,
          (data) => FoodItem.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Food item not found',
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
        'Failed to fetch food item. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Create food item
  Future<FoodItem> createFoodItem(CreateFoodItemRequest request) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiConfig.food,
        data: request.toJson(),
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<FoodItem>.fromJson(
          response.data!,
          (data) => FoodItem.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to create food item',
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
        'Failed to create food item. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Update food item
  Future<FoodItem> updateFoodItem(
    String foodItemId,
    Map<String, dynamic> updates,
  ) async {
    try {
      final response = await _apiClient.put<Map<String, dynamic>>(
        '${ApiConfig.food}/$foodItemId',
        data: updates,
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<FoodItem>.fromJson(
          response.data!,
          (data) => FoodItem.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to update food item',
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
        'Failed to update food item. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Delete food item
  Future<void> deleteFoodItem(String foodItemId) async {
    try {
      final response = await _apiClient.delete<Map<String, dynamic>>(
        '${ApiConfig.food}/$foodItemId',
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<Map<String, dynamic>>.fromJson(
          response.data!,
          (data) => data,
        );

        if (!apiResponse.success) {
          throw ApiException(
            apiResponse.message ?? 'Failed to delete food item',
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
        'Failed to delete food item. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Toggle food item availability
  Future<FoodItem> toggleAvailability(String foodItemId) async {
    try {
      final response = await _apiClient.patch<Map<String, dynamic>>(
        '${ApiConfig.food}/$foodItemId/availability',
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<FoodItem>.fromJson(
          response.data!,
          (data) => FoodItem.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to toggle availability',
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
        'Failed to toggle availability. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Update stock
  Future<FoodItem> updateStock(String foodItemId, int stock) async {
    try {
      final response = await _apiClient.patch<Map<String, dynamic>>(
        '${ApiConfig.food}/$foodItemId/stock',
        data: {'stock': stock},
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<FoodItem>.fromJson(
          response.data!,
          (data) => FoodItem.fromJson(data),
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!;
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to update stock',
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
        'Failed to update stock. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Upload food image to Cloudinary
  Future<String> uploadImage(File imageFile) async {
    try {
      const String cloudinaryUrl =
          'https://api.cloudinary.com/v1_1/damn70nxv/image/upload';
      const String uploadPreset = 'restaurent-app';

      var request = http.MultipartRequest('POST', Uri.parse(cloudinaryUrl));
      request.fields['upload_preset'] = uploadPreset;
      request.fields['folder'] = 'meal-monkey/food-items';

      request.files.add(
        await http.MultipartFile.fromPath('file', imageFile.path),
      );

      var response = await request.send();

      if (response.statusCode == 200) {
        final responseBody = await response.stream.bytesToString();
        final responseData = json.decode(responseBody);
        return responseData['secure_url'] as String;
      } else {
        throw Exception('Failed to upload image to Cloudinary');
      }
    } catch (e) {
      throw const ApiException(
        'Failed to upload image. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Add food item using main backend schema
  Future<Map<String, dynamic>> addFoodMainBackend(
    Map<String, dynamic> foodData,
  ) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/food',
        data: foodData,
      );

      if (response.data != null) {
        return response.data!;
      } else {
        throw const ApiException(
          'Invalid response from server',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw const ApiException(
        'Failed to add food item. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Get food categories
  Future<List<String>> getCategories() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        '/categories',
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<List<dynamic>>.fromJson(
          response.data!,
          (data) => data as List<dynamic>,
        );

        if (apiResponse.success && apiResponse.data != null) {
          return apiResponse.data!.cast<String>();
        } else {
          // Return default categories if API fails
          return _getDefaultCategories();
        }
      } else {
        return _getDefaultCategories();
      }
    } catch (e) {
      // Return default categories if API fails
      return _getDefaultCategories();
    }
  }

  // Search food items (public API)
  Future<List<FoodItem>> searchFoodItems({
    String? query,
    String? category,
    double? minPrice,
    double? maxPrice,
    List<String>? tags,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{'page': page, 'limit': limit};

      if (query != null && query.isNotEmpty) {
        queryParams['query'] = query;
      }
      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }
      if (minPrice != null) {
        queryParams['minPrice'] = minPrice;
      }
      if (maxPrice != null) {
        queryParams['maxPrice'] = maxPrice;
      }
      if (tags != null && tags.isNotEmpty) {
        queryParams['tags'] = tags;
      }

      final response = await _apiClient.get<Map<String, dynamic>>(
        '${ApiConfig.food}/search',
        queryParameters: queryParams,
      );

      if (response.data != null) {
        final apiResponse = ApiResponse<Map<String, dynamic>>.fromJson(
          response.data!,
          (data) => data,
        );

        if (apiResponse.success && apiResponse.data != null) {
          final foodItemsData = apiResponse.data!['foodItems'] as List? ?? [];
          return foodItemsData.map((item) => FoodItem.fromJson(item)).toList();
        } else {
          throw ApiException(
            apiResponse.message ?? 'Failed to search food items',
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
        'Failed to search food items. Please try again.',
        type: ApiExceptionType.unknown,
      );
    }
  }

  // Private helper methods
  List<String> _getDefaultCategories() {
    return [
      'Appetizers',
      'Main Course',
      'Desserts',
      'Beverages',
      'Snacks',
      'Salads',
      'Soups',
      'Pasta',
      'Pizza',
      'Burgers',
      'Sandwiches',
      'Seafood',
      'Vegetarian',
      'Vegan',
      'Gluten-Free',
    ];
  }

  // Validation methods
  String? validateFoodName(String? name) {
    if (name == null || name.trim().isEmpty) {
      return 'Food name is required';
    }
    if (name.trim().length < 2) {
      return 'Food name must be at least 2 characters';
    }
    if (name.trim().length > 100) {
      return 'Food name must not exceed 100 characters';
    }
    return null;
  }

  String? validateCategory(String? category) {
    if (category == null || category.trim().isEmpty) {
      return 'Category is required';
    }
    return null;
  }

  String? validatePrice(String? price) {
    if (price == null || price.trim().isEmpty) {
      return 'Price is required';
    }
    final parsedPrice = double.tryParse(price);
    if (parsedPrice == null) {
      return 'Please enter a valid price';
    }
    if (parsedPrice <= 0) {
      return 'Price must be greater than 0';
    }
    return null;
  }

  String? validateStock(String? stock) {
    if (stock != null && stock.trim().isNotEmpty) {
      final parsedStock = int.tryParse(stock);
      if (parsedStock == null) {
        return 'Please enter a valid stock quantity';
      }
      if (parsedStock < 0) {
        return 'Stock cannot be negative';
      }
    }
    return null;
  }

  String? validatePreparationTime(String? time) {
    if (time != null && time.trim().isNotEmpty) {
      final parsedTime = int.tryParse(time);
      if (parsedTime == null) {
        return 'Please enter a valid preparation time';
      }
      if (parsedTime <= 0) {
        return 'Preparation time must be greater than 0';
      }
      if (parsedTime > 180) {
        return 'Preparation time cannot exceed 180 minutes';
      }
    }
    return null;
  }
}
