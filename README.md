# Шаурма на Левкова — Render.com

## Что изменилось
- Меню на русском
- Только самовывоз (убрана доставка)
- Пиво с выбором сорта и объема через модалку
- Без базы данных — работает гарантированно

## Deploy

1. Загрузите на GitHub
2. render.com → New + → Web Service
3. Выберите репозиторий
4. Render подхватит render.yaml

Настройки вручную:
- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app`

## URLs
- Клиент: `https://your-service.onrender.com`
- Админ: `https://your-service.onrender.com/admin`
