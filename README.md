# 🤖 RMA Finance WhatsApp Bot

Professional WhatsApp Chatbot for **RMA Finance** — built with Next.js 16, Prisma, and Maytapi WhatsApp API.

Automatically replies with project step information, bank details, and financial data based on the sender's WhatsApp number.

## ✨ Features

- 📱 **WhatsApp Auto-Reply Bot** — Maytapi-powered chatbot
- 📊 **Google Sheets Sync** — Real-time data from RAW DATA, RAW DATA2, NEW DASH sheets
- 🏗️ **Project Step Tracking** — 19-step pipeline (Checklist → Processing → Disbursement)
- 🏦 **Bank-wise Details** — Multiple banks per project with loan amounts
- 👤 **Role-based Access** — Client & Team Leader views
- 💬 **Bot Simulator** — Test conversations before going live
- 🌙 **Dark Mode** — Professional dashboard with light/dark themes

## 🚀 Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/rma-finance-whatsapp-bot)

### Quick Setup

1. **Fork/Clone** this repo
2. **Create PostgreSQL** database at [neon.tech](https://neon.tech) (free)
3. **Set Environment Variables** in Vercel:
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/rma_finance?sslmode=require
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
4. **Deploy** → Vercel will auto-build
5. **Run Migration**: `npx prisma db push`
6. **Seed Data**: Click "Reset & Sync" on dashboard
7. **Configure Maytapi Webhook**: `https://your-app.vercel.app/api/webhook/maytapi`

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Next.js API Routes (Serverless)
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **WhatsApp**: Maytapi API
- **Data Source**: Google Sheets (CSV export)

## 📋 WhatsApp Bot Commands

| Command | Description |
|---------|-------------|
| `REGISTER <name> <role>` | Register as client or team_leader |
| `1` or `my projects` | View your assigned projects |
| `2` or `steps` | View step-wise project progress |
| `3` or `banks` | View bank-wise details |
| `4` or `financial` | View financial breakdown |
| `5` or `help` | Show main menu |

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your Vercel app URL |

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma          # PostgreSQL schema
│   └── schema.postgresql.prisma # Backup PostgreSQL schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhook/maytapi/   # Maytapi webhook handler
│   │   │   ├── data-import/       # Google Sheets sync
│   │   │   ├── bot-simulate/      # Bot testing endpoint
│   │   │   ├── clients/           # Client CRUD
│   │   │   ├── projects/          # Project CRUD
│   │   │   └── ...                # More API routes
│   │   └── page.tsx               # Main dashboard
│   ├── components/                # UI components
│   └── lib/
│       ├── maytapi.ts             # Bot logic & WhatsApp messaging
│       ├── db.ts                  # Prisma client
│       └── api.ts                 # Frontend API helpers
├── vercel.json                    # Vercel configuration
└── deploy-vercel.sh               # Deployment helper script
```

## 📄 License

Private — RMA Finance
