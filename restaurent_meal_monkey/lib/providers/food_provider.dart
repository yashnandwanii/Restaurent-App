import 'package:flutter/material.dart';
import '../models/food_item.dart';
import '../services/food_service.dart';

class FoodProvider extends ChangeNotifier {
  final FoodService _foodService = FoodService();
  List<FoodItem> _items = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<FoodItem> get items => _items;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadFoodItems() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _items = await _foodService.getRestaurantFoodItems();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<void> addFood(CreateFoodItemRequest request) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final newItem = await _foodService.createFoodItem(request);
      _items.add(newItem);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<void> editFood(String id, Map<String, dynamic> updates) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final updatedItem = await _foodService.updateFoodItem(id, updates);
      final index = _items.indexWhere((item) => item.id == id);
      if (index != -1) {
        _items[index] = updatedItem;
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<void> deleteFood(String id) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _foodService.deleteFoodItem(id);
      _items.removeWhere((item) => item.id == id);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }
}
