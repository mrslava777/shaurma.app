# Shaurma na Levkova - Render.com Deployment

## Quick Deploy

1. Fork this repo or upload to GitHub
2. Go to [render.com](https://render.com) and sign up (free)
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Render will auto-detect `render.yaml`
6. Click "Create Web Service"

## Environment Variables (in Render Dashboard)

Go to your service → Environment → Add:

| Key | Value | Description |
|-----|-------|-------------|
| `TELEGRAM_BOT_TOKEN` | your_token | From @BotFather |
| `TELEGRAM_CHAT_ID` | your_chat_id | From @userinfobot |

## URLs after deploy

- Client: `https://your-service-name.onrender.com`
- Admin: `https://your-service-name.onrender.com/admin`

## Local testing

```bash
pip install -r requirements.txt
python app.py
# Open http://localhost:5000
```
