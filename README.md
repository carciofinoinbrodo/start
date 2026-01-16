# AISEO Scraper

Google AI Mode scraper - extracts AI-generated responses and source citations from Google Search AI Mode (`udm=50`).

## Features

- Scrapes Google AI Mode responses (no login required)
- Extracts AI-generated text (paragraphs, lists, tables)
- Extracts all source citations with metadata (title, URL, date, description, publisher)
- Uses undetected-chromedriver to avoid bot detection
- Outputs structured JSON

## Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Copy environment config
cp .env.example .env
```

## Usage

```bash
# Basic usage
python scripts/scrape_google_ai.py "what is the best crm"

# With headless mode (no browser window)
python scripts/scrape_google_ai.py "best project management software" --headless

# With screenshot capture
python scripts/scrape_google_ai.py "top email marketing tools" --screenshot
```

## Output

Results are saved to `data/results/google/` as JSON files:

```json
{
  "query": "what is the best crm",
  "timestamp": "2026-01-16T14:43:43.295743+00:00",
  "response_text": "- Zoho CRM: Best Overall...",
  "sources": [
    {
      "title": "The Best CRM Software We've Tested for 2026 | PCMag",
      "url": "https://www.pcmag.com/picks/the-best-crm-software",
      "date": "5 Jan 2026",
      "description": "Customer relationship management (CRM) systems...",
      "publisher": "Pcmag"
    }
  ],
  "source_count": 15,
  "success": true
}
```

## Project Structure

```
AiSEO/
├── src/
│   ├── config/
│   │   └── settings.py      # Configuration
│   ├── scrapers/
│   │   └── google_ai_scraper.py  # Main scraper
│   └── utils/
│       ├── exceptions.py    # Custom exceptions
│       └── logger.py        # Logging setup
├── scripts/
│   └── scrape_google_ai.py  # CLI entry point
├── data/
│   ├── results/
│   │   └── google/          # Google AI Mode results
│   └── screenshots/         # Debug screenshots
├── pyproject.toml
└── .env.example
```

## Requirements

- Python 3.11+
- Google Chrome browser installed
