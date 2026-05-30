F1 - Race Analysis Dashboard

Formula 1 lap-by-lap race data, tyre strategy, and session analysis — all in one place.

Built by **William Law II** · Powered by [FastF1](https://github.com/theOehrly/Fast-F1) · [f1.willx.tech](https://f1.willx.tech)

---

## Overview

Slipstreams is a web-based Formula 1 data analysis dashboard that lets you explore race sessions visually — no coding or data science experience required. Whether you want to trace how a driver gained positions lap-by-lap, break down tyre strategy, or review qualifying times, Slipstreams puts the data at your fingertips.

---

## Features

- **Lap-by-lap position charts** — Visualise every driver's movement through the field across a full race distance
- **Tyre strategy visualiser** — Understand compound choices and pit stop timing for every driver
- **Full session support** — Race, Qualifying, Sprint, Sprint Qualifying, FP1, FP2, and FP3
- **Full season coverage** — Browse any season and Grand Prix available in the FastF1 dataset
- **User accounts** — Sign in to save preferences and session history
- **Responsive UI** — Clean, minimal design optimised for both desktop and mobile

---

## Usage

No installation required. The app runs entirely in your browser at [f1.willx.tech](https://f1.willx.tech).

### 1. Select a Session

Use the three dropdowns on the main dashboard to choose a season, Grand Prix, and session type (Race, Qualifying, FP1, etc.).

### 2. Load the Data

Click **Load Session**. The app fetches and processes data from FastF1. Initial loads may take several seconds depending on session size.

### 3. Explore the Charts

**Position Chart** — A line graph showing each driver's race position per lap. Useful for identifying overtakes, Safety Car periods, and strategy plays.

**Tyre Strategy** — A horizontal bar chart showing compound choices and pit windows for every driver. Hover over any element for lap-level detail.

---

## Local Development

**Requirements:** Node.js 18+, Python 3.9+

### Setup

```bash
# Clone the repository
git clone https://github.com/sheerwill007/slipstreams-f1.git
cd slipstreams-f1

# Install frontend dependencies
npm install

# Install backend dependencies
pip install fastf1 fastapi uvicorn

# Start the backend
uvicorn backend.main:app --reload --port 8000

# In a separate terminal, start the frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js / React |
| Styling | Tailwind CSS |
| Frontend Hosting | Vercel |
| Backend | FastAPI (Python) |
| Data Engine | FastF1 |
| Charts | Recharts / D3 |
| Auth | Clerk |
| Backend Hosting | Render |

---

## Deployment

The frontend deploys automatically via Vercel on every push to `main`.

To deploy your own instance:

1. Fork this repository
2. Import the fork into [Vercel](https://vercel.com)
3. Set the required environment variable: `NEXT_PUBLIC_API_URL` pointing to your backend
4. Deploy the backend to Render by connecting the same repository and setting the start command to `uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 1`

---

## Roadmap

- Driver telemetry comparisons (speed traces, throttle and brake inputs)
- Lap time delta charts
- Head-to-head driver comparison mode
- Mobile-optimised chart interactions
- Export charts as PNG or PDF

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss the proposed approach.

```bash
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
# Then open a Pull Request
```

---

## Credits

Race and telemetry data provided by [FastF1](https://github.com/theOehrly/Fast-F1), the open-source Python library by Oehrly that makes F1 timing data accessible.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

*Built by William Law II for every F1 fan who wants to go deeper than the broadcast.*
