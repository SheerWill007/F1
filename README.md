# 🏎️ Slipstreams — F1 Race Analysis Dashboard

> **Formula 1 lap-by-lap race data, tyre strategy, and session analysis — all in one place.**

Built by **WilliamBenLaw [AmanLaw]** for all the F1 fans out there.
Powered by [FastF1](https://github.com/theOehrly/Fast-F1) · Hosted on [Vercel](https://vercel.com)

🔗 **Live App:** [slipstreams-f1.vercel.app](https://slipstreams-f1.vercel.app)

---

## 📖 What Is Slipstreams?

Slipstreams is a **web-based Formula 1 data analysis dashboard** that lets you explore race sessions visually — no coding or data science experience needed. Whether you want to see how a driver gained positions lap-by-lap, understand tyre strategy, or compare qualifying times, Slipstreams puts the data at your fingertips.

Think of it as your personal F1 data room, powered by the same race telemetry data that teams use.

---

## ✨ Features

- 📊 **Lap-by-lap position charts** — See how every driver moved through the field across a full race
- 🔴🟡⬜ **Tyre strategy visualizer** — Understand each driver's compound choices and pit stop timing
- ⏱️ **Session support** — Analyse Race, Qualifying, Sprint, Sprint Qualifying, FP1, FP2, and FP3
- 🏁 **Full season coverage** — Browse any season and Grand Prix available in the FastF1 dataset
- 🔐 **User accounts** — Sign in / Sign up to save your preferences and sessions
- ⚡ **Fast & clean UI** — Minimal, responsive design that works on desktop and mobile

---

## 🚀 Getting Started (For Non-Technical Users)

No installation needed! Slipstreams runs entirely in your browser.

### Step 1 — Open the App

Go to 👉 **[https://slipstreams-f1.vercel.app](https://slipstreams-f1.vercel.app)**

You'll land on the main dashboard. It looks like this:

```
┌────────────────────────────────────────────┐
│  🏎️  F1 Race Analysis Dashboard  v1.0      │
│  ─────────────────────────────────────── │
│  Season: [  2024  ▼ ]                     │
│  Grand Prix: [ — Select Race — ▼ ]        │
│  Session: [ Race ▼ ]                      │
│                                            │
│       [ Load Session ]                    │
└────────────────────────────────────────────┘
```

---

### Step 2 — (Optional) Create an Account

Click **Sign Up** in the top-right corner to create a free account. This lets you save your analysis history and preferences. Already have one? Click **Sign In**.

---

### Step 3 — Choose Your Race

Use the three dropdowns to pick what you want to analyse:

| Dropdown | What to Select |
|---|---|
| **Season** | The year (e.g. 2024, 2023…) |
| **Grand Prix** | The race weekend (e.g. Monaco, Silverstone…) |
| **Session** | Race, Qualifying, FP1, FP2, FP3, Sprint, or Sprint Q |

---

### Step 4 — Load the Session

Click the **"Load Session"** button. The app will fetch data from FastF1 and render your charts. This may take a few seconds depending on the session size.

---

### Step 5 — Explore the Charts

Once loaded, you'll see:

- **Position Chart** — A line graph showing every driver's race position on each lap. Great for spotting overtakes, Safety Car periods, and strategic battles.
- **Tyre Strategy** — A horizontal bar chart showing which tyre compound each driver ran and when they pitted.

Hover over any line or bar for detailed information on that lap or stint.

---

## 🛠️ For Developers — Local Setup

> **Requirements:** Node.js 18+, Python 3.9+, npm

### 1. Clone the Repository

```bash
git clone https://github.com/AmanLaw/slipstreams-f1.git
cd slipstreams-f1
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend / FastF1 Dependencies

```bash
pip install fastf1 flask flask-cors
```

### 4. Run the Development Server

```bash
# Start the backend API
python app.py

# In a separate terminal, start the frontend
npm run dev
```

### 5. Open in Browser

```
http://localhost:3000
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React / Next.js |
| **Styling** | Tailwind CSS |
| **Hosting** | Vercel |
| **Data Engine** | [FastF1](https://github.com/theOehrly/Fast-F1) (Python) |
| **Charts** | Recharts / D3 |
| **Auth** | Supabase / Firebase (Sign In / Sign Up) |

---

## 📦 Deployment

The app is deployed automatically via **Vercel** on every push to `main`.

To deploy your own fork:

1. Fork this repository on GitHub
2. Go to [vercel.com](https://vercel.com) and click **"New Project"**
3. Import your forked repo
4. Set any required environment variables (API keys, backend URL)
5. Click **Deploy** ✅

---

## 🗺️ Roadmap

- [ ] Driver telemetry comparisons (speed traces, throttle/brake)
- [ ] Lap time delta charts
- [ ] Head-to-head driver comparison mode
- [ ] Dark/light theme toggle
- [ ] Mobile-optimised chart interactions
- [ ] Export charts as PNG/PDF

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Credits

- **Data:** [FastF1](https://github.com/theOehrly/Fast-F1) by Oehrly — the open-source Python library that makes F1 telemetry data accessible
- **Built by:** WilliamBenLaw [AmanLaw]
- **For:** Every F1 fan who wants to go deeper than the broadcast 🏁

---

*© Slipstreams F1 · Made with ❤️ for the F1 community*
