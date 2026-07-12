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
    {"id": 1, "name": "Шаурма классическая", "description": "Курица, капуста, огурцы, томаты, чесночный соус, лаваш", "price": 9.00, "category": "shaurma", "emoji": "\U0001F32F", "badge": None, "options": None},
    {"id": 2, "name": "Шаурма острая", "description": "Курица, капуста, огурцы, томаты, острый соус, перец чили", "price": 10.00, "category": "shaurma", "emoji": "\U0001F336\U0000FE0F", "badge": "Хит", "options": None},
    {"id": 3, "name": "Шаурма сырная", "description": "Курица, моцарелла, капуста, огурцы, сырный соус", "price": 12.00, "category": "shaurma", "emoji": "\U0001F9C0", "badge": None, "options": None},
    {"id": 4, "name": "Фалафель", "description": "Фалафельные шарики, овощи, тахини, пита", "price": 8.00, "category": "vegan", "emoji": "\U0001F959", "badge": None, "options": None},
    {"id": 5, "name": "Бургер классический", "description": "Говяжья котлета, сыр, салат, томаты, соус", "price": 11.00, "category": "burger", "emoji": "\U0001F354", "badge": None, "options": None},
    {"id": 6, "name": "Хот-дог", "description": "Сосиска, капуста, огурцы, кетчуп, горчица", "price": 8.00, "category": "fast", "emoji": "\U0001F32D", "badge": None, "options": None},
    {"id": 7, "name": "Блины с мясом", "description": "Домашние блины с куриным фаршем", "price": 7.00, "category": "fast", "emoji": "\U0001F95E", "badge": None, "options": None},
    {"id": 8, "name": "Пирожок с капустой", "description": "Домашний пирожок, 2 шт", "price": 5.00, "category": "fast", "emoji": "\U0001F95F", "badge": None, "options": None},
    {"id": 9, "name": "Фри", "description": "Картофель фри, 150г", "price": 6.00, "category": "fast", "emoji": "\U0001F35F", "badge": None, "options": None},
    {"id": 10, "name": "Кока-кола 0.5л", "description": "Холодная газировка", "price": 4.00, "category": "drink", "emoji": "\U0001F964", "badge": None, "options": None},
    {"id": 11, "name": "Пиво разливное", "description": "Выберите сорт и объем", "price": 0, "category": "drink", "emoji": "\U0001F37A", "badge": None, "options": {
        "sorts": ["Баварское", "Ирландский эль", "Медовуха"],
        "volumes": [
            {"label": "0.5 л", "price": 10.00},
            {"label": "1 л", "price": 18.00}
        ]
    }},
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
        return jsonify({"error": "Укажите имя и телефон"}), 400
    if not data.get("items"):
        return jsonify({"error": "Корзина пуста"}), 400
    order_number = f"SL-{datetime.now().strftime('%y%m%d')}-{next_order_id:03d}"
    next_order_id += 1
    order = {
        "id": len(orders) + 1,
        "order_number": order_number,
        "customer_name": data["customer_name"],
        "phone": data["phone"],
        "order_type": "pickup",
        "address": "ул. Левкова, 9",
        "comment": data.get("comment", ""),
        "items": data["items"],
        "total": data["total"],
        "status": "new",
        "created_at": datetime.now().isoformat(),
        "updated_at": None
    }
    orders.append(order)
    items_text = "\n".join([f"- {i['name']}" + (f" ({i.get('option','')})" if i.get("option") else "") + f" x {i['qty']} = {i['price'] * i['qty']} BYN" for i in data["items"]])
    comment_text = f"\nКомментарий: {data['comment']}" if data.get("comment") else ""
    telegram_msg = f"НОВЫЙ ЗАКАЗ #{order_number}\n\nКлиент: {data['customer_name']}\nТелефон: {data['phone']}\nСамовывоз: ул. Левкова, 9{comment_text}\n\nСостав:\n{items_text}\n\nИтого: {data['total']} BYN"
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
        return jsonify({"error": "Неверный статус"}), 400
    for order in orders:
        if order["id"] == order_id:
            order["status"] = new_status
            order["updated_at"] = datetime.now().isoformat()
            status_ru = {"new": "Новый", "cooking": "Готовится", "ready": "Готов", "done": "Выдан"}
            send_telegram(f"Заказ #{order['order_number']}\nСтатус: {status_ru.get(new_status, new_status)}")
            return jsonify({"success": True})
    return jsonify({"error": "Заказ не найден"}), 404

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