# Web Mention Scraper (MERN)

* A list of recent public mentions across the web (via Google search results)
* An approximate count of LinkedIn mentions during the past 7 days

The backend performs headless-style scraping of Google search result pages (using `node-fetch` + `cheerio`). The frontend is a minimal React UI.

---

## Quick Start

### 1. Clone & install

```bash
# clone your fork / the repo
$ git clone https://github.com/<your-user>/web-mention-scraper.git
$ cd web-mention-scraper

# install backend deps
$ cd server && npm install
```

(Frontend is dependency-free – it just uses the React CDN.)

### 2. Run the backend

```bash
# still inside /server
$ npm run dev
# → server available on http://localhost:5000
```

### 3. Open the UI

Simply open `client/index.html` in your browser, or serve the `client` folder with any static file server:


Enter a search term and hit "Crawl". Results will appear in seconds.

---

---

## Environment variables

None are required. The scraper hits public Google search result pages, so heavy usage may be rate-limited.

---

## Notes & Limitations

* LinkedIn requires login for full access. As a proxy, we count Google results restricted to `site:linkedin.com` and limited to the last 7 days.
* For production usage consider rotating proxies, proper headless browsers (Puppeteer/Playwright), and persistent storage (MongoDB).
* This repo is intended as a proof-of-concept delivered within 24 hours.

---

