class Order {
  final int id;
  final String orderNumber;
  final String customerName;
  final String phone;
  final List<OrderItem> items;
  final double total;
  final String status;
  final String createdAt;
  final String? comment;

  Order({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    required this.phone,
    required this.items,
    required this.total,
    required this.status,
    required this.createdAt,
    this.comment,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      orderNumber: json['order_number'],
      customerName: json['customer_name'],
      phone: json['phone'],
      items: (json['items'] as List).map((i) => OrderItem.fromJson(i)).toList(),
      total: (json['total'] as num).toDouble(),
      status: json['status'],
      createdAt: json['created_at'],
      comment: json['comment'],
    );
  }
}

class OrderItem {
  final String name;
  final int qty;
  final double price;
  final String? option;

  OrderItem({required this.name, required this.qty, required this.price, this.option});

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      name: json['name'],
      qty: json['qty'],
      price: (json['price'] as num).toDouble(),
      option: json['option'],
    );
  }
}
