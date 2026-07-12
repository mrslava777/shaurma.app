import 'package:flutter/material.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<Order> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    try {
      final orders = await ApiService.getOrders();
      setState(() {
        _orders = orders.where((o) => o.status != 'done').toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Мои заказы', style: TextStyle(fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        color: const Color(0xFFE31E24),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFE31E24)))
            : _orders.isEmpty
                ? _buildEmpty()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orders.length,
                    itemBuilder: (context, index) {
                      final order = _orders[index];
                      return _OrderCard(order: order);
                    },
                  ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.receipt_long_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text('Нет активных заказов', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;

  const _OrderCard({required this.order});

  Color get _statusColor {
    switch (order.status) {
      case 'new': return Colors.orange;
      case 'cooking': return Colors.blue;
      case 'ready': return Colors.green;
      default: return Colors.grey;
    }
  }

  String get _statusText {
    switch (order.status) {
      case 'new': return 'Новый';
      case 'cooking': return 'Готовится';
      case 'ready': return 'Готов';
      default: return order.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        decoration: BoxDecoration(
          border: Border(left: BorderSide(color: _statusColor, width: 4)),
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Заказ #${order.orderNumber}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _statusText,
                    style: TextStyle(color: _statusColor, fontWeight: FontWeight.w600, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              DateFormat('dd.MM HH:mm').format(DateTime.parse(order.createdAt)),
              style: TextStyle(color: Colors.grey[500], fontSize: 13),
            ),
            const SizedBox(height: 8),
            Text(
              order.items.map((i) => '${i.name}${i.option != null ? " (${i.option})" : ""} × ${i.qty}').join(', '),
              style: TextStyle(color: Colors.grey[600], fontSize: 13),
            ),
            const SizedBox(height: 8),
            Text(
              '${order.total.toStringAsFixed(0)} BYN · 🏃 Самовывоз',
              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFE31E24)),
            ),
          ],
        ),
      ),
    );
  }
}
