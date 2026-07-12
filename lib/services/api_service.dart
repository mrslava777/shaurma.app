import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/menu_item.dart';
import '../models/order.dart';

class ApiService {
  // Замените на ваш URL после деплоя на Render
  static const String baseUrl = 'https://your-render-url.onrender.com';
  // Для локального тестирования:
  // static const String baseUrl = 'http://10.0.2.2:5000';

  static Future<List<MenuItem>> getMenu() async {
    final response = await http.get(Uri.parse('$baseUrl/api/menu'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => MenuItem.fromJson(json)).toList();
    }
    throw Exception('Failed to load menu');
  }

  static Future<Map<String, dynamic>> createOrder({
    required String name,
    required String phone,
    required List<Map<String, dynamic>> items,
    required double total,
    String? comment,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/orders'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'customer_name': name,
        'phone': phone,
        'items': items,
        'total': total,
        'comment': comment,
      }),
    );
    return json.decode(response.body);
  }

  static Future<List<Order>> getOrders() async {
    final response = await http.get(Uri.parse('$baseUrl/api/orders'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Order.fromJson(json)).toList();
    }
    throw Exception('Failed to load orders');
  }
}
