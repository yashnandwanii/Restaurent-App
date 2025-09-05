// import 'dart:io';
// import 'package:dio/dio.dart';
// import 'api_client.dart';

// class ImageService {
//   static final ImageService _instance = ImageService._internal();
//   factory ImageService() => _instance;
//   ImageService._internal();

//   final ApiClient _apiClient = ApiClient.instance;

//   // Future<String> uploadImage(File image) async {
//   //   try {
//   //     String fileName = image.path.split('/').last;
//   //     FormData formData = FormData.fromMap({
//   //       'image': await MultipartFile.fromFile(image.path, filename: fileName),
//   //     });

//   //     // final response = await _apiClient.post<Map<String, dynamic>>(
//   //     //   '${ApiConfig.image}/upload',
//   //     //   data: formData,
//   //     // );

//   //     // if (response.data != null) {
//   //     //   final apiResponse = ApiResponse<String>.fromJson(
//   //     //     response.data!,
//   //     //     (data) => data.toString(),
//   //     //   );

//   //     //   if (apiResponse.success && apiResponse.data != null) {
//   //     //     return apiResponse.data!;
//   //     //   } else {
//   //     //     throw ApiException(
//   //     //       apiResponse.message ?? 'Failed to upload image',
//   //     //       type: ApiExceptionType.serverError,
//   //     //       errors: apiResponse.errors,
//   //     //     );
//   //     //   }
//   //     // } else {
//   //     //   throw const ApiException(
//   //     //     'Invalid response from server',
//   //     //     type: ApiExceptionType.serverError,
//   //     //   );
//   //     // }
//   //   } catch (e) {
//   //     if (e is ApiException) rethrow;
//   //     throw const ApiException(
//   //       'Failed to upload image. Please try again.',
//   //       type: ApiExceptionType.unknown,
//   //     );
//   //   }
//   // }

//   Future<List<String>> uploadImages(List<File> images) async {
//     try {
//       List<String> uploadedUrls = [];
//       for (var image in images) {
//         String url = await uploadImage(image);
//         uploadedUrls.add(url);
//       }
//       return uploadedUrls;
//     } catch (e) {
//       if (e is ApiException) rethrow;
//       throw const ApiException(
//         'Failed to upload images. Please try again.',
//         type: ApiExceptionType.unknown,
//       );
//     }
//   }
// }
