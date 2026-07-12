#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from flask import Flask, render_template, request, jsonify
import json
from datetime import datetime
import requests

app = Flask(__name__)

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")

MENU_ITEMS = [
    {"id": 1, "name": "Shaurma Classic", "description": "Chicken, cabbage, cucumbers, tomatoes, garlic sauce, lavash", "price": 9.00, "category": "shaurma", "emoji": "\U0001F32F", "badge": None},
    {"id": 2, "name": "Shaurma Spicy", "description": "Chicken, cabbage, cucumbers, tomatoes, spicy sauce, chili pepper", "price": 10.00, "category": "shaurma", "emoji": "\U0001F336\U0000FE0F", "badge": "Hit"},
    {"id": 3, "name": "Shaurma Cheese", "description": "Chicken, mozzarella, cabbage, cucumbers, cheese sauce", "price": 12.00, "category": "shaurma", "emoji": "\U0001F9C0", "badge": None},
    {"id": 4, "name": "Falafel", "description": "Falafel balls, vegetables, tahini, pita", "price": 8.00, "category": "vegan", "emoji": "\U0001F959", "badge": None},
    {"id": 5, "name": "Classic Burger", "description": "Beef patty, cheese, lettuce, tomatoes, sauce", "price": 11.00, "category": "burger", "emoji": "\U0001F354", "badge": None},
    {"id": 6, "name": "Hot Dog", "description": "Sausage, cabbage, cucumbers, ketchup, mustard", "price": 8.00, "category": "fast", "emoji": "\U0001F32D", "badge": None},
    {"id": 7, "name": "Pancakes with Meat", "description": "Homemade pancakes with chicken filling", "price": 7.00, "category": "fast", "emoji": "\U0001F95E", "badge": None},
    {"id": 8, "name": "Draft Beer 0.5L", "description": "Bavarian / Irish Ale / Mead", "price": 10.00, "category": "drink", "emoji": "\U0001F37A", "badge": None},
    {"id": 9, "name": "Draft Beer 1L", "description": "Bavarian / Irish Ale / Mead", "price": 18.00, "category": "drink", "emoji": "\U0001F37A", "badge": None},
    {"id": 10, "name": "Coca-Cola 0.5L", "description": "Cold soda", "price": 4.00, "category": "drink", "emoji": "\U0001F964", "badge": None},
    {"id": 11, "name": "Cabbage Pie", "description": "Homemade pie, 2 pcs", "price": 5.00, "category": "fast", "emoji": "\U0001F95F", "badge": None},
    {"id": 12, "name": "Fries", "description": "French fries, 150g", "price": 6.00, "category": "fast", "emoji": "\U0001F35F", "badge": None},
]

orders = []
next_order_id = 1

def send_telegram(message):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"}
        requests.post(url, json=payload, timeout=10)
        return True
    except Exception as e:
        print(f"Telegram error: {e}")
        return False

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/menu")
def get_menu():
    return jsonify(MENU_ITEMS)

@app.route("/api/orders", methods=["POST"])
def create_order():
    global next_order_id
    data = request.get_json()
    if not data.get("customer_name") or not data.get("phone"):
        return jsonify({"error": "Please provide name and phone"}), 400
    if data.get("order_type") == "delivery" and not data.get("address"):
        return jsonify({"error": "Please provide delivery address"}), 400
    if not data.get("items"):
        return jsonify({"error": "Cart is empty"}), 400
    order_number = f"SL-{datetime.now().strftime('%y%m%d')}-{next_order_id:03d}"
    next_order_id += 1
    order = {
        "id": len(orders) + 1,
        "order_number": order_number,
        "customer_name": data["customer_name"],
        "phone": data["phone"],
        "order_type": data["order_type"],
        "address": data.get("address", ""),
        "comment": data.get("comment", ""),
        "items": data["items"],
        "total": data["total"],
        "status": "new",
        "created_at": datetime.now().isoformat(),
        "updated_at": None
    }
    orders.append(order)
    items_text = "\n".join([f"- {i['name']} x {i['qty']} = {i['price'] * i['qty']} BYN" for i in data["items"]])
    delivery_type = "Delivery" if data["order_type"] == "delivery" else "Pickup"
    address_text = f"\nAddress: {data.get('address', 'Levkova st., 9')}" if data.get("address") else ""
    comment_text = f"\nComment: {data['comment']}" if data.get("comment") else ""
    telegram_msg = f"NEW ORDER #{order_number}\n\nCustomer: {data['customer_name']}\nPhone: {data['phone']}\nType: {delivery_type}{address_text}{comment_text}\n\nItems:\n{items_text}\n\nTotal: {data['total']} BYN"
    send_telegram(telegram_msg)
    return jsonify({"success": True, "order_id": order["id"], "order_number": order_number})

@app.route("/api/orders")
def get_orders():
    return jsonify(list(reversed(orders)))

@app.route("/api/orders/<int:order_id>/status", methods=["PUT"])
def update_status(order_id):
    data = request.get_json()
    new_status = data.get("status")
    if new_status not in ["new", "cooking", "ready", "done"]:
        return jsonify({"error": "Invalid status"}), 400
    for order in orders:
        if order["id"] == order_id:
            order["status"] = new_status
            order["updated_at"] = datetime.now().isoformat()
            send_telegram(f"Order #{order['order_number']}\nStatus: {new_status}")
            return jsonify({"success": True})
    return jsonify({"error": "Order not found"}), 404

@app.route("/api/orders/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    global orders
    orders = [o for o in orders if o["id"] != order_id]
    return jsonify({"success": True})

@app.route("/api/stats")
def get_stats():
    total = len(orders)
    revenue = sum(o["total"] for o in orders)
    active = len([o for o in orders if o["status"] in ["new", "cooking", "ready"]])
    by_status = {}
    for o in orders:
        by_status[o["status"]] = by_status.get(o["status"], 0) + 1
    return jsonify({"total_orders": total, "total_revenue": round(revenue, 2), "active_orders": active, "by_status": by_status})

@app.route("/admin")
def admin():
    return render_template("admin.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)