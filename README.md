# ScrapeItEasy

An internal business lead scraping tool built for quality over quantity. Returns 10–20 highly accurate, validated, deduplicated records per run.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Scraper | Python 3 + BeautifulSoup |
| Communication | Node `child_process` → Python |

---

## Project Structure

```
ScrapeItEasy/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Scraper form
│   │   │   ├── Leads.jsx       # View & export leads
│   │   │   └── History.jsx     # Scrape run log
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                  # Express backend
│   ├── models/
│   │   ├── Lead.js
│   │   └── ScrapeHistory.js
│   ├── routes/
│   │   ├── scrape.js        # Calls Python, saves to DB
│   │   ├── leads.js         # Fetch / delete leads
│   │   ├── export.js        # CSV and Excel download
│   │   └── history.js       # Scrape run log
│   ├── index.js
│   └── package.json
│
├── python-scraper/
│   ├── scraper.py           # Scraper + data quality pipeline
│   └── requirements.txt
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Node.js v18+
- Python 3.9+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com) — free tier)

---

### Step 1 — Clone and configure environment

```bash
git clone https://github.com/yourname/ScrapeItEasy.git
cd ScrapeItEasy

# Copy the example env file and fill in your MongoDB URI
cp .env.example .env
```

Edit `.env`:
```
MONGODB_URI=mongodb://localhost:27017/scrapeiteasy
PORT=5000
CLIENT_URL=http://localhost:5173
```

---

### Step 2 — Install server dependencies

```bash
cd server
npm install
```

---

### Step 3 — Install Python dependencies

```bash
cd ../python-scraper

# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate      # Mac/Linux
# or: venv\Scripts\activate   # Windows

pip install -r requirements.txt
```

> **Windows users:** In `server/routes/scrape.js`, change `"python3"` to `"python"` on line 40.

---

### Step 4 — Install frontend dependencies

```bash
cd ../client
npm install
```

---

### Step 5 — Start the app

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App opens at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Features

### Dashboard (Scraper)
- Select platform: Google Maps, JustDial, TradeIndia, IndiaMART
- Enter city and business category
- Click "Run Scraper" to start a scraping job
- View real-time results: total fetched, newly saved, skipped

### Leads Page
- Filter leads by city, category, or platform
- Delete individual records
- Export all leads as **CSV** or **Excel (.xlsx)**

### History Page
- Log of every scrape run
- Shows: platform, city, category, total fetched, newly saved, status

---

## Data Quality Rules

Every record passes through a validation pipeline in `python-scraper/scraper.py`:

1. Records without a business name are discarded
2. Phone numbers are cleaned and validated (Indian format)
3. Email addresses are validated with a regex
4. Records with no phone AND no email are discarded
5. Duplicates within a batch are removed by `md5(name + phone)`
6. Node.js checks `uniqueHash` before inserting — previously saved businesses are never re-imported

---

## Implementing Real Scrapers

The Python scraper currently returns **mock data** so the app works immediately without any configuration.

To implement real scraping:

1. Open `python-scraper/scraper.py`
2. Find the function for your target platform (e.g., `scrape_justdial`)
3. Replace the `generate_mock_leads(...)` call with real HTTP requests and BeautifulSoup parsing
4. Return a list of dicts with keys: `businessName`, `ownerName`, `phone`, `email`, `city`, `category`, `sourcePlatform`, `profileUrl`

**Tips:**
- Use browser DevTools (Network tab) to find JSON API endpoints
- JustDial and IndiaMART use JavaScript rendering — consider Selenium or Playwright
- Google Maps: use [SerpApi](https://serpapi.com) (free tier) or the [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- Always add delays (`time.sleep(1-3)`) between requests to avoid being blocked
- Rotate User-Agent headers

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scrape` | Start a scrape job |
| GET | `/api/leads` | Get all leads (supports `?city=`, `?category=`, `?platform=`) |
| DELETE | `/api/leads/:id` | Delete a lead |
| GET | `/api/export/csv` | Download leads as CSV |
| GET | `/api/export/excel` | Download leads as Excel |
| GET | `/api/history` | Get scrape run history |
| GET | `/api/health` | Server health check |

---

## Deploying to GitHub

```bash
cd ScrapeItEasy
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourname/ScrapeItEasy.git
git push -u origin main
```

---

## Deploying Frontend to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. Set **Root Directory** to `client`
4. Vercel auto-detects Vite — click Deploy
5. Update `VITE_API_URL` environment variable in Vercel to point to your deployed backend URL

> For the backend, deploy to [Render](https://render.com) (free tier available). Set all `.env` variables in Render's environment settings.

---

## License

MIT — free to use for internal company tooling.
# ScrapeItEasy
