import 'package:flutter/material.dart';
import '../models/menu_item.dart';

class CartItem {
  final MenuItem item;
  int qty;
  final String? option;
  final double price;

  CartItem({required this.item, this.qty = 1, this.option, required this.price});

  String get key => option != null ? '${item.id}_$option' : '${item.id}';
}

class CartProvider extends ChangeNotifier {
  final Map<String, CartItem> _items = {};

  Map<String, CartItem> get items => _items;
  int get totalCount => _items.values.fold(0, (sum, i) => sum + i.qty);
  double get totalPrice => _items.values.fold(0, (sum, i) => sum + (i.price * i.qty));

  void addItem(MenuItem item, {String? option, double? customPrice}) {
    final key = option != null ? '${item.id}_$option' : '${item.id}';
    if (_items.containsKey(key)) {
      _items[key]!.qty++;
    } else {
      _items[key] = CartItem(
        item: item,
        qty: 1,
        option: option,
        price: customPrice ?? item.price,
      );
    }
    notifyListeners();
  }

  void removeItem(String key) {
    if (_items.containsKey(key)) {
      if (_items[key]!.qty > 1) {
        _items[key]!.qty--;
      } else {
        _items.remove(key);
      }
      notifyListeners();
    }
  }

  void deleteItem(String key) {
    _items.remove(key);
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}
