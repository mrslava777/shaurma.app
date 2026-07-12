#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from flask import Flask, render_template, request, jsonify
import sqlite3
import json
from datetime import datetime
import requests

app = Flask(__name__)
DATABASE = os.environ.get("DATABASE_URL", "shaurma.db")
if DATABASE.startswith("sqlite:///"):
    DATABASE = DATABASE.replace("sqlite:///", "")

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS menu (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT, price REAL NOT NULL, category TEXT, emoji TEXT, badge TEXT, available INTEGER DEFAULT 1)")
    cursor.execute("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT UNIQUE NOT NULL, customer_name TEXT NOT NULL, phone TEXT NOT NULL, order_type TEXT NOT NULL, address TEXT, comment TEXT, items TEXT NOT NULL, total REAL NOT NULL, status TEXT DEFAULT 'new', created_at TEXT NOT NULL, updated_at TEXT)")
    cursor.execute("SELECT COUNT(*) FROM menu")
    if cursor.fetchone()[0] == 0:
        menu_items = [
            (1, "Shaurma Classic", "Chicken, cabbage, cucumbers, tomatoes, garlic sauce, lavash", 9.00, "shaurma", "\U0001F32F", None),
            (2, "Shaurma Spicy", "Chicken, cabbage, cucumbers, tomatoes, spicy sauce, chili pepper", 10.00, "shaurma", "\U0001F336\U0000FE0F", "Hit"),
            (3, "Shaurma Cheese", "Chicken, mozzarella, cabbage, cucumbers, cheese sauce", 12.00, "shaurma", "\U0001F9C0", None),
            (4, "Falafel", "Falafel balls, vegetables, tahini, pita", 8.00, "vegan", "\U0001F959", None),
            (5, "Classic Burger", "Beef patty, cheese, lettuce, tomatoes, sauce", 11.00, "burger", "\U0001F354", None),
            (6, "Hot Dog", "Sausage, cabbage, cucumbers, ketchup, mustard", 8.00, "fast", "\U0001F32D", None),
            (7, "Pancakes with Meat", "Homemade pancakes with chicken filling", 7.00, "fast", "\U0001F95E", None),
            (8, "Draft Beer 0.5L", "Bavarian / Irish Ale / Mead", 10.00, "drink", "\U0001F37A", None),
            (9, "Draft Beer 1L", "Bavarian / Irish Ale / Mead", 18.00, "drink", "\U0001F37A", None),
            (10, "Coca-Cola 0.5L", "Cold soda", 4.00, "drink", "\U0001F964", None),
            (11, "Cabbage Pie", "Homemade pie, 2 pcs", 5.00, "fast", "\U0001F95F", None),
            (12, "Fries", "French fries, 150g", 6.00, "fast", "\U0001F35F", None),
        ]
        cursor.executemany("INSERT OR IGNORE INTO menu (id, name, description, price, category, emoji, badge) VALUES (?, ?, ?, ?, ?, ?, ?)", menu_items)
    conn.commit()
    conn.close()
    print("Database initialized")

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
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM menu WHERE available = 1 ORDER BY category, id")
    items = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(items)

@app.route("/api/orders", methods=["POST"])
def create_order():
    data = request.get_json()
    if not data.get("customer_name") or not data.get("phone"):
        return jsonify({"error": "Please provide name and phone"}), 400
    if data.get("order_type") == "delivery" and not data.get("address"):
        return jsonify({"error": "Please provide delivery address"}), 400
    if not data.get("items"):
        return jsonify({"error": "Cart is empty"}), 400
    order_number = f"SL-{datetime.now().strftime('%y%m%d')}-{get_next_order_num()}"
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO orders (order_number, customer_name, phone, order_type, address, comment, items, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (order_number, data["customer_name"], data["phone"], data["order_type"],
         data.get("address", ""), data.get("comment", ""),
         json.dumps(data["items"], ensure_ascii=False), data["total"], "new", datetime.now().isoformat()))
    order_id = cursor.lastrowid
    conn.commit()
    conn.close()
    items_text = "\n".join([f"- {i['name']} x {i['qty']} = {i['price'] * i['qty']} BYN" for i in data["items"]])
    delivery_type = "Delivery" if data["order_type"] == "delivery" else "Pickup"
    address_text = f"\nAddress: {data.get('address', 'Levkova st., 9')}" if data.get("address") else ""
    comment_text = f"\nComment: {data['comment']}" if data.get("comment") else ""
    telegram_msg = f"NEW ORDER #{order_number}\n\nCustomer: {data['customer_name']}\nPhone: {data['phone']}\nType: {delivery_type}{address_text}{comment_text}\n\nItems:\n{items_text}\n\nTotal: {data['total']} BYN"
    send_telegram(telegram_msg)
    return jsonify({"success": True, "order_id": order_id, "order_number": order_number})

def get_next_order_num():
    today = datetime.now().strftime("%Y-%m-%d")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM orders WHERE created_at LIKE ?", (f"{today}%",))
    count = cursor.fetchone()[0] + 1
    conn.close()
    return str(count).zfill(3)

@app.route("/api/orders")
def get_orders():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
    orders = []
    for row in cursor.fetchall():
        order = dict(row)
        order["items"] = json.loads(order["items"])
        orders.append(order)
    conn.close()
    return jsonify(orders)

@app.route("/api/orders/<int:order_id>/status", methods=["PUT"])
def update_status(order_id):
    data = request.get_json()
    new_status = data.get("status")
    if new_status not in ["new", "cooking", "ready", "done"]:
        return jsonify({"error": "Invalid status"}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
                   (new_status, datetime.now().isoformat(), order_id))
    conn.commit()
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    order = dict(cursor.fetchone())
    conn.close()
    status_text = {"new": "New", "cooking": "Cooking", "ready": "Ready", "done": "Done"}[new_status]
    send_telegram(f"Order #{order['order_number']}\nStatus: {status_text}")
    return jsonify({"success": True})

@app.route("/api/orders/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/stats")
def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM orders")
    total = cursor.fetchone()[0]
    cursor.execute('SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != "cancelled"')
    revenue = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM orders WHERE status IN ("new", "cooking", "ready")')
    active = cursor.fetchone()[0]
    cursor.execute("SELECT status, COUNT(*) as count FROM orders GROUP BY status")
    by_status = {row["status"]: row["count"] for row in cursor.fetchall()}
    conn.close()
    return jsonify({"total_orders": total, "total_revenue": round(revenue, 2),
                    "active_orders": active, "by_status": by_status})

@app.route("/admin")
def admin():
    return render_template("admin.html")

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)