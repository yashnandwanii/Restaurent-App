import 'package:dio/dio.dart';

class NetworkService {
  static final NetworkService _instance = NetworkService._internal();
  factory NetworkService() => _instance;
  NetworkService._internal();

  final Dio _dio = Dio();

  // Test server connectivity
  Future<bool> canReachServer({String? customUrl}) async {
    try {
      final urls = customUrl != null
          ? [customUrl]
          : [
              'http://localhost:3001/health',
              'http://10.0.2.2:3001/health', // Android emulator
              'http://172.25.252.81:3001/health', // Your machine IP
            ];

      for (final url in urls) {
        try {
          print('Testing server connectivity: $url');
          final response = await _dio.get(
            url,
            options: Options(
              sendTimeout: const Duration(seconds: 5),
              receiveTimeout: const Duration(seconds: 5),
              validateStatus: (status) => status != null && status < 500,
            ),
          );

          if (response.statusCode! < 400) {
            print('✅ Server reachable at: $url');
            return true;
          }
        } catch (e) {
          print('❌ Failed to reach server at $url: $e');
          continue;
        }
      }

      return false;
    } catch (e) {
      print('❌ Network test failed: $e');
      return false;
    }
  }

  // Get the best server URL for current environment
  Future<String?> getBestServerUrl() async {
    final urls = [
      'http://localhost:3001/api',
      'http://10.0.2.2:3001/api', // Android emulator
      'http://172.25.252.81:3001/api', // Your machine IP
    ];

    for (final url in urls) {
      try {
        final healthUrl = url.replaceAll('/api', '/health');
        final response = await _dio.get(
          healthUrl,
          options: Options(
            sendTimeout: const Duration(seconds: 3),
            receiveTimeout: const Duration(seconds: 3),
          ),
        );

        if (response.statusCode == 200) {
          print('✅ Best server URL found: $url');
          return url;
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  }
}
