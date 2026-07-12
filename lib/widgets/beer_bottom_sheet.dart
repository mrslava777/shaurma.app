import 'package:flutter/material.dart';
import '../models/menu_item.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';

class BeerBottomSheet extends StatefulWidget {
  final MenuItem item;

  const BeerBottomSheet({super.key, required this.item});

  @override
  State<BeerBottomSheet> createState() => _BeerBottomSheetState();
}

class _BeerBottomSheetState extends State<BeerBottomSheet> {
  late String _selectedSort;
  late Map<String, dynamic> _selectedVolume;

  @override
  void initState() {
    super.initState();
    _selectedSort = widget.item.options!['sorts'][0];
    _selectedVolume = widget.item.options!['volumes'][0];
  }

  @override
  Widget build(BuildContext context) {
    final sorts = widget.item.options!['sorts'] as List<dynamic>;
    final volumes = widget.item.options!['volumes'] as List<dynamic>;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Text(
                  '🍺 ${widget.item.name}',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Sort
            const Text('Сорт пива', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: sorts.map((sort) {
                final isSelected = _selectedSort == sort;
                return ChoiceChip(
                  label: Text(sort),
                  selected: isSelected,
                  onSelected: (_) => setState(() => _selectedSort = sort),
                  selectedColor: const Color(0xFFE31E24),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.w500,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            // Volume
            const Text('Объем', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            Row(
              children: volumes.map<Widget>((vol) {
                final isSelected = _selectedVolume == vol;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedVolume = vol),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: isSelected ? const Color(0xFFE31E24) : Colors.grey[300]!,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        color: isSelected ? const Color(0xFFFFF0F0) : Colors.white,
                      ),
                      child: Column(
                        children: [
                          Text(
                            vol['label'],
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${vol['price'].toStringAsFixed(0)} BYN',
                            style: const TextStyle(
                              color: Color(0xFFE31E24),
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            // Add button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final option = '$_selectedSort, ${_selectedVolume['label']}';
                  context.read<CartProvider>().addItem(
                    widget.item,
                    option: option,
                    customPrice: (_selectedVolume['price'] as num).toDouble(),
                  );
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${widget.item.name} ($option) добавлено')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE31E24),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  'В корзину · ${_selectedVolume['price'].toStringAsFixed(0)} BYN',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
