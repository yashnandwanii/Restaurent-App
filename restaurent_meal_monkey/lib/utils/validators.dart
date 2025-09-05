class Validators {
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required.';
    }
    final emailRegex = RegExp(r'^[^@]+@[^@]+\.[^@]+');
    if (!emailRegex.hasMatch(value)) {
      return 'Enter a valid email.';
    }
    return null;
  }

  static String? validatePassword(String? value) {
    if (value == null || value.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return null;
  }

  static String? validateRequired(String? value, String field) {
    if (value == null || value.isEmpty) {
      return '$field is required.';
    }
    return null;
  }

  static String? validateNumber(String? value, String field) {
    if (value == null || double.tryParse(value) == null) {
      return 'Enter a valid number for $field.';
    }
    return null;
  }
}
