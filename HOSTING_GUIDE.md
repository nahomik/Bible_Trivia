# 🌐 Bible Trivia: Online Multiplayer Hosting Guide

This guide explains how to host your Bible Trivia game so you and your friends can play together online from anywhere in the world.

---

## ⚡ Option 1: Instant Online Tunnel (Play in 30 Seconds — No Signup Needed!)

If your computer is already running the game and you want to play with friends immediately without setting up accounts or configuring routers:

1. **Start the Unified Server**:
   ```bash
   npm start
   ```
   *(Or in development: `npm run dev` in `server/`)*

2. **Open an Instant Public Tunnel**:
   In a separate terminal, run:
   ```bash
   npx localtunnel --port 3001
   ```
   Or use Cloudflare's free tunnel:
   ```bash
   npx untun tunnel --port 3001
   ```

3. **Share the Link with Friends**:
   - The command outputs a secure public URL, e.g.:
     `https://ancient-cross-42.loca.lt` or `https://....trycloudflare.com`
   - Send this link to your friends via WhatsApp, Discord, or SMS!
   - They click the link on their phone or laptop, tap **Online Fellowship**, create or enter the 6-letter room code, and start playing!

*(Tip for LocalTunnel: The first time a friend opens the link, LocalTunnel asks for a quick confirmation password which is just your public IP displayed on screen).*

---

## ☁️ Option 2: Free 24/7 Cloud Hosting (Render.com)

To keep your game permanently online 24/7 for free so anyone can play anytime:

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Revamped Bible Trivia with shadcn/ui and 5,000+ questions"
   git remote add origin https://github.com/YOUR_USERNAME/bible-trivia.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com) and create a free account.
   - Click **New +** → **Web Service**.
   - Select your GitHub repository.
   - Configure:
     - **Name**: `bible-trivia`
     - **Runtime**: `Node`
     - **Build Command**: `npm run postinstall && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: `Free`
   - Click **Create Web Service**.

Render will automatically build your React client, bundle the SQLite backend, and assign you a free HTTPS domain like:
`https://bible-trivia-xyz.onrender.com`.

WebSockets (Socket.IO real-time multiplayer) work seamlessly out of the box on Render!

---

## 🚂 Option 3: Railway.app / Fly.io

Railway and Fly.io also support one-click deployment using the included [`Dockerfile`](file:///home/nahom/Documents/bible_trivia/Dockerfile):

1. **Railway**:
   - Go to [railway.app](https://railway.app)
   - Click **Deploy from GitHub repo**
   - Railway detects the [`Dockerfile`](file:///home/nahom/Documents/bible_trivia/Dockerfile) and automatically deploys with a public `.up.railway.app` URL.

---

## 🐳 Option 4: Self-Hosted Docker / VPS

If you have a Linux VPS (DigitalOcean, Linode, AWS EC2, or a home server):

```bash
docker compose up -d --build
```

Your trivia game will run on port `3001` with persistent SQLite storage in a Docker volume.

---

## 📶 Option 5: Same Wi-Fi / LAN (Home or Church Group)

If your friends or youth group are on the same Wi-Fi network:
- No internet hosting needed!
- Simply share your local network IP:
  `http://192.168.137.196:3001`
- Any phone or laptop on the Wi-Fi can open that URL in their mobile browser and play together.
