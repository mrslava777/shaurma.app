import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import '../widgets/order_success_dialog.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _commentController = TextEditingController();
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Корзина', style: TextStyle(fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: cart.items.isEmpty
          ? _buildEmpty()
          : _buildCart(cart),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_cart_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text('Корзина пуста', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
          const SizedBox(height: 8),
          Text('Добавьте что-нибудь из меню', style: TextStyle(color: Colors.grey[400])),
        ],
      ),
    );
  }

  Widget _buildCart(CartProvider cart) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: cart.items.length,
            itemBuilder: (context, index) {
              final entry = cart.items.entries.toList()[index];
              final cartItem = entry.value;
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.network(
                          cartItem.item.image,
                          width: 70,
                          height: 70,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 70,
                            height: 70,
                            color: Colors.grey[200],
                            child: const Icon(Icons.fastfood),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              cartItem.item.name,
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            if (cartItem.option != null)
                              Text(
                                cartItem.option!,
                                style: TextStyle(color: Colors.grey[600], fontSize: 12),
                              ),
                            const SizedBox(height: 4),
                            Text(
                              '${cartItem.price.toStringAsFixed(0)} BYN',
                              style: const TextStyle(
                                color: Color(0xFFE31E24),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Row(
                        children: [
                          _QtyButton(
                            icon: Icons.remove,
                            onTap: () => cart.removeItem(entry.key),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text(
                              '${cartItem.qty}',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                            ),
                          ),
                          _QtyButton(
                            icon: Icons.add,
                            onTap: () => cart.addItem(
                              cartItem.item,
                              option: cartItem.option,
                              customPrice: cartItem.price,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
          ),
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildTextField('Ваше имя', _nameController, Icons.person),
                const SizedBox(height: 10),
                _buildTextField('Телефон', _phoneController, Icons.phone, keyboardType: TextInputType.phone),
                const SizedBox(height: 10),
                _buildTextField('Комментарий', _commentController, Icons.comment),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Итого:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    Text(
                      '${cart.totalPrice.toStringAsFixed(0)} BYN',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFE31E24),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : () => _submitOrder(cart),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE31E24),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text('Оформить заказ', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, {TextInputType? keyboardType}) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.grey),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE31E24)),
        ),
      ),
    );
  }

  Future<void> _submitOrder(CartProvider cart) async {
    if (_nameController.text.trim().isEmpty || _phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Укажите имя и телефон')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final items = cart.items.values.map((ci) => {
        return {
          'name': ci.item.name,
          'qty': ci.qty,
          'price': ci.price,
          'option': ci.option,
        };
      }).toList();

      final result = await ApiService.createOrder(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        items: items,
        total: cart.totalPrice,
        comment: _commentController.text.trim(),
      );

      if (result['success'] == true) {
        cart.clear();
        _nameController.clear();
        _phoneController.clear();
        _commentController.clear();
        if (mounted) {
          showDialog(
            context: context,
            builder: (_) => OrderSuccessDialog(orderNumber: result['order_number']),
          );
        }
      } else {
        throw Exception(result['error'] ?? 'Ошибка');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка: $e')),
        );
      }
    } finally {
      setState(() => _isSubmitting = false);
    }
  }
}

class _QtyButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _QtyButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFE31E24)),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 16, color: const Color(0xFFE31E24)),
      ),
    );
  }
}
