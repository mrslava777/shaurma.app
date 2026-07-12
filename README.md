# Shaurma na Levkova - Render.com (Simple Version)

No database needed - menu is hardcoded, orders stored in memory.

## Deploy to Render.com

1. Upload this folder to GitHub as a new repo
2. Go to https://render.com and sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Render will auto-detect settings from render.yaml
6. Click "Create Web Service"

## Settings (if render.yaml not detected)

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`

## URLs

- Client: `https://your-service.onrender.com`
- Admin: `https://your-service.onrender.com/admin`

## Optional: Telegram notifications

In Render Dashboard → Environment, add:
- `TELEGRAM_BOT_TOKEN` = your token from @BotFather
- `TELEGRAM_CHAT_ID` = your ID from @userinfobot
