class MenuItem {
  final int id;
  final String name;
  final String description;
  final double price;
  final String category;
  final String emoji;
  final String? badge;
  final Map<String, dynamic>? options;
  final String image;

  MenuItem({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    required this.emoji,
    this.badge,
    this.options,
    required this.image,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      price: (json['price'] as num).toDouble(),
      category: json['category'],
      emoji: json['emoji'],
      badge: json['badge'],
      options: json['options'],
      image: json['image'] ?? '',
    );
  }

  bool get hasOptions => options != null;
}
