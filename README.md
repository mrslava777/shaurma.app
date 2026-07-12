# Шаурма на Левкова — Render.com

## Что изменилось v2
- Меню на русском
- Только самовывоз
- Пиво с модалкой выбора сорта и объема (исправлено)
- Без базы данных

## Deploy
1. Загрузите на GitHub
2. render.com → New + → Web Service
3. Выберите репозиторий

Настройки вручную:
- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app`
