# WealthPulse — Personal Finance Dashboard

A single-page React application for tracking expenses and exploring investment fund options. All data is in-memory; refreshing the page resets to seeded demo state.

## Login Credentials

| Username | Password  |
|----------|-----------|
| `demo`   | `demo123` |

## Features

- **Dashboard** — Monthly overview with KPI cards, spending donut chart, cumulative line chart, monthly comparison bars, and budget alerts
- **Expenses** — Full transaction list with sorting, filtering, search, and an add-expense form
- **Investments** — Fund cards with returns & risk, fund comparison overlay chart, hypothetical growth calculator, portfolio builder with allocation pie chart
- **Budgets** — Per-category budget setting with visual progress bars that turn red over 90%
- **Settings** — Update profile name, email, and currency

## Installation & Running

### Prerequisites
- **Node.js** ≥ 18 (https://nodejs.org)

### Steps

```bash
# 1. Unzip the project
unzip wealthpulse.zip
cd wealthpulse

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The app will open at **http://localhost:5173**

### Production Build

```bash
npm run build
npm run preview
```

## Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool & dev server
- **Tailwind CSS 3** — Utility-first styling
- **Recharts** — Charts & data visualization

## Notes

- All data is in-memory — no API calls, localStorage, or database
- Refresh resets everything to seeded demo state
- 60–80 seeded transactions across 3 months (Jan–Mar 2026)
- 6 sample investment funds with 12-month historical returns
- Seeded monthly income: $6,500

---

*This is a demo application. Not real financial advice.*
