# ChronoFi Frontend — Quantitative Wealth & AI Financial Engine

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpiyushx502%2FChronoFi-UI&env=GEMINI_API_KEY,GEMINI_MODEL,NEXT_PUBLIC_DEMO_MODE)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%203.5%20%7C%203.6%20%7C%203.8-4285F4?style=flat-square&logo=google)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)

**ChronoFi UI** is a state-of-the-art wealth intelligence platform designed to replace static spreadsheets with probabilistic, institutional-grade financial decision modeling. Powered by **Next.js 14 App Router**, **Google Gemini AI**, and a **1,000-path Monte Carlo scenario engine**, ChronoFi delivers real-time simulations for loan stress, retirement runways, debt amortization, and tax optimization.

---

## 🚀 1-Click Deploy on Vercel

You can deploy your own production instance of ChronoFi directly to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpiyushx502%2FChronoFi-UI&env=GEMINI_API_KEY,GEMINI_MODEL,NEXT_PUBLIC_DEMO_MODE)

### Required Environment Variables on Vercel:
| Variable | Description | Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) | `AIzaSy...` |
| `GEMINI_MODEL` | Preferred model with automated fallback | `gemini-3.5-flash` |
| `NEXT_PUBLIC_DEMO_MODE` | Enable standalone demo persona mode | `true` |
| `NEXT_PUBLIC_API_URL` | Optional backend FastAPI URL | `http://127.0.0.1:8000` |

---

## 💡 Key Features

### 1. Intelligent AI Advisor (Google Gemini)
- Integrated streaming Server-Sent Events (SSE) chat with low-latency token generation.
- **Resilient Multi-Model Architecture**: Automatically routes requests through `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`, and `gemini-3.8-flash` to safeguard against temporary 503 high-demand capacity spikes.
- Context-aware advisory: Injects user balance sheet metrics (Net Worth, Monthly Surplus, Runway, Asset Breakdown, Risk Profile) directly into the AI prompt.

### 2. 1,000-Path Monte Carlo Scenario Simulator
- Evaluates big-ticket purchase decisions (e.g., buying a car, taking a home loan, taking a sabbatical).
- Computes real-time amortization schedules, EMI calculations, interest drag, and down-payment alternatives.
- Real-time trajectory projection charting baseline vs. modified 30-year wealth corpus curves.

### 3. Tax Optimization Engine (Finance Act 2024)
- Full modeling of the Indian **New Tax Regime** vs. **Old Tax Regime**.
- Standard deduction (₹75,000) and Section 87A rebate adjustments up to ₹12 Lakhs.
- Equity LTCG harvesting optimization taking advantage of the ₹1.25L annual exemption threshold.

### 4. Zero-Downtime Deterministic Fallback
- Operates in full standalone mode when the Python backend is offline or during client demo presentations.
- Pre-seeded with institutional user personas (Arjun Patel, Priya Sharma) for instant testing.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components, API Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Visualizations**: [Recharts](https://recharts.org/) for interactive financial trajectory graphs
- **Icons**: [Lucide React](https://lucide.dev/)
- **Streaming**: Native Fetch & ReadableStream Server-Sent Events (SSE)

---

## 📦 Local Setup & Development

### 1. Clone Repository
```bash
git clone https://github.com/piyushx502/ChronoFi-UI.git
cd ChronoFi-UI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Gemini API key:
```ini
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_DEMO_MODE=true
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 🚢 Deploying with Vercel CLI

If you prefer using the Vercel CLI:

```bash
# 1. Install or run Vercel CLI
npx vercel

# 2. Deploy directly to production
npx vercel --prod
```

Or provide a personal access token for automated non-interactive deployment:
```bash
npx vercel deploy --prod --token <YOUR_VERCEL_TOKEN> --yes
```

---

## 📄 License
MIT License. Built for institutional-grade wealth planning.
