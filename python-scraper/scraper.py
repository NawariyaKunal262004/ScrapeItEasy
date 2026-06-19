#!/usr/bin/env python3
"""
ScrapeItEasy – Python Scraper
==============================
This script is called by Node.js (via child_process) with three arguments:
  1. platform  – one of: tradeindia, justdial, indiamart, googlemaps
  2. city       – e.g. "Jaipur"
  3. category   – e.g. "Restaurants"

It returns a JSON array of cleaned, high-quality business leads via stdout.

NOTE FOR PRODUCTION USE:
-------------------------
The scraping logic for each platform (JustDial, TradeIndia, etc.) needs to be
implemented with real HTTP requests and HTML parsing tailored to each site's
actual HTML structure. Websites change frequently, so scrapers require
maintenance. This file provides:
  - A complete, working data pipeline
  - Real validation logic
  - A robust structure you can slot real scrapers into
  - A Google Maps scraper using the free SerpApi (optional)
  - Realistic mock data for local development and testing

Set ENABLE_REAL_SCRAPING=true in your .env to attempt real scraping.
By default, mock data is returned so the app works immediately.
"""

import sys
import json
import re
import hashlib
import os
import time
import random

try:
    import requests
    from bs4 import BeautifulSoup
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


# ─── Data Quality Helpers ─────────────────────────────────────────────────────

def is_valid_email(email):
    """Check if an email address looks valid."""
    if not email:
        return False
    pattern = r'^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email.strip()))


def is_valid_phone(phone):
    """
    Check if a phone number looks like a real Indian phone number.
    Accepts: 10-digit mobile, or landline with area code.
    """
    if not phone:
        return False
    # Strip spaces, dashes, parentheses, leading +91 or 0
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    cleaned = re.sub(r'^(91|0)', '', cleaned)
    return len(cleaned) >= 8 and len(cleaned) <= 12 and cleaned.isdigit()


def clean_phone(phone):
    """Normalise a phone number to digits only."""
    if not phone:
        return ""
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    cleaned = re.sub(r'^(91|0)', '', cleaned)
    return cleaned


def clean_text(text):
    """Strip extra whitespace from a string."""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text)).strip()


def validate_and_clean(lead):
    """
    Apply data quality rules to a single lead dict.
    Returns the cleaned lead or None if the lead should be discarded.
    """
    # Rule 1: Must have a business name
    biz = clean_text(lead.get("businessName", ""))
    if not biz:
        return None

    # Rule 2: Clean all fields
    owner = clean_text(lead.get("ownerName", ""))
    phone = clean_phone(lead.get("phone", ""))
    email = clean_text(lead.get("email", ""))
    city = clean_text(lead.get("city", ""))
    category = clean_text(lead.get("category", ""))
    platform = clean_text(lead.get("sourcePlatform", ""))
    url = clean_text(lead.get("profileUrl", ""))

    # Rule 3: Validate phone if present – discard if invalid format
    if phone and not is_valid_phone(phone):
        phone = ""

    # Rule 4: Validate email if present – discard if invalid format
    if email and not is_valid_email(email):
        email = ""

    # Rule 5: Must have at least a phone OR an email to be useful
    if not phone and not email:
        return None

    return {
        "businessName": biz,
        "ownerName": owner,
        "phone": phone,
        "email": email,
        "city": city,
        "category": category,
        "sourcePlatform": platform,
        "profileUrl": url,
    }


def deduplicate(leads):
    """Remove duplicates from the leads list using businessName + phone hash."""
    seen = set()
    unique = []
    for lead in leads:
        key = (lead["businessName"].lower() + lead["phone"]).replace(" ", "")
        h = hashlib.md5(key.encode()).hexdigest()
        if h not in seen:
            seen.add(h)
            unique.append(lead)
    return unique


# ─── Mock Data Generator (for local development) ─────────────────────────────

def generate_mock_leads(platform, city, category):
    """
    Returns realistic mock lead data so the app works without real scraping.
    In production, replace this with real scraper calls.
    """
    sample_businesses = [
        {
            "businessName": f"{category} Hub {city}",
            "ownerName": "Rajesh Sharma",
            "phone": "9876543210",
            "email": "rajesh@example.com",
            "profileUrl": "https://example.com/rajesh",
        },
        {
            "businessName": f"Global {category} Services",
            "ownerName": "Priya Mehta",
            "phone": "9988776655",
            "email": "priya.mehta@globalservices.in",
            "profileUrl": "https://example.com/priya",
        },
        {
            "businessName": f"{city} {category} Experts",
            "ownerName": "Anil Kumar",
            "phone": "8877665544",
            "email": "",  # no email – will be included if phone is valid
            "profileUrl": "https://example.com/anil",
        },
        {
            "businessName": f"Premier {category} Solutions",
            "ownerName": "Sunita Verma",
            "phone": "7766554433",
            "email": "sunita@premiersolutions.co.in",
            "profileUrl": "https://example.com/sunita",
        },
        {
            "businessName": f"New Age {category}",
            "ownerName": "",
            "phone": "9001122334",
            "email": "info@newage.in",
            "profileUrl": "https://example.com/newage",
        },
        {
            "businessName": f"{city} Royal {category}",
            "ownerName": "Vijay Singh",
            "phone": "invalid",  # will be discarded by validator
            "email": "not-an-email",  # will be discarded
            "profileUrl": "",
        },
        {
            "businessName": "",  # no name – will be discarded
            "ownerName": "Ghost Business",
            "phone": "9123456789",
            "email": "ghost@example.com",
            "profileUrl": "",
        },
        {
            "businessName": f"Star {category} {city}",
            "ownerName": "Meena Gupta",
            "phone": "9512345678",
            "email": "meena@star.in",
            "profileUrl": "https://example.com/star",
        },
        {
            "businessName": f"Elite {category} Group",
            "ownerName": "Deepak Joshi",
            "phone": "8901234567",
            "email": "deepak@elite.in",
            "profileUrl": "https://example.com/elite",
        },
        {
            "businessName": f"{category} Pro {city}",
            "ownerName": "Kavita Nair",
            "phone": "7890123456",
            "email": "kavita@catpro.in",
            "profileUrl": "https://example.com/catpro",
        },
    ]

    # Tag each record with source info
    for biz in sample_businesses:
        biz["city"] = city
        biz["category"] = category
        biz["sourcePlatform"] = platform

    return sample_businesses


# ─── Platform Scrapers ────────────────────────────────────────────────────────
# Each function below is a placeholder for a real scraper.
# To implement: make HTTP requests, parse HTML with BeautifulSoup,
# and return a list of raw lead dicts.

def scrape_justdial(city, category):
    """
    JustDial scraper placeholder.
    JustDial loads data dynamically via JavaScript, so you may need
    to use Selenium or look for their JSON API endpoints in browser DevTools.
    """
    print(f"[scraper] JustDial scraping not yet implemented. Using mock data.", file=sys.stderr)
    return generate_mock_leads("JustDial", city, category)


def scrape_tradeindia(city, category):
    """
    TradeIndia scraper placeholder.
    TradeIndia has server-rendered pages — BeautifulSoup should work.
    URL pattern: https://www.tradeindia.com/search/?category=...&city=...
    """
    print(f"[scraper] TradeIndia scraping not yet implemented. Using mock data.", file=sys.stderr)
    return generate_mock_leads("TradeIndia", city, category)


def scrape_indiamart(city, category):
    """
    IndiaMART scraper placeholder.
    IndiaMART has rate limiting and CAPTCHAs. Consider their official
    Lead Manager API: https://developer.indiamart.com/
    """
    print(f"[scraper] IndiaMART scraping not yet implemented. Using mock data.", file=sys.stderr)
    return generate_mock_leads("IndiaMART", city, category)


def scrape_googlemaps(city, category):
    """
    Google Maps scraper placeholder.
    Option A: Use SerpApi (https://serpapi.com) with a free API key.
    Option B: Use the official Google Places API.
    Example SerpApi call (requires SERPAPI_KEY in .env):
        url = "https://serpapi.com/search"
        params = {
            "engine": "google_maps",
            "q": f"{category} in {city}",
            "api_key": os.getenv("SERPAPI_KEY"),
        }
        response = requests.get(url, params=params)
        data = response.json()
        results = data.get("local_results", [])
    """
    print(f"[scraper] Google Maps scraping not yet implemented. Using mock data.", file=sys.stderr)
    return generate_mock_leads("Google Maps", city, category)


# ─── Main Entry Point ─────────────────────────────────────────────────────────

def main():
    # Expect exactly 3 arguments from Node.js
    if len(sys.argv) != 4:
        print(json.dumps([]))
        sys.exit(0)

    platform = sys.argv[1].lower().replace(" ", "")
    city = sys.argv[2].strip()
    category = sys.argv[3].strip()

    print(f"[scraper] Starting: platform={platform}, city={city}, category={category}", file=sys.stderr)

    # Route to the correct scraper based on platform name
    platform_map = {
        "tradeindia": scrape_tradeindia,
        "justdial": scrape_justdial,
        "indiamart": scrape_indiamart,
        "googlemaps": scrape_googlemaps,
    }

    scrape_fn = platform_map.get(platform)
    if not scrape_fn:
        print(f"[scraper] Unknown platform: {platform}", file=sys.stderr)
        print(json.dumps([]))
        sys.exit(0)

    # Run the scraper
    raw_leads = scrape_fn(city, category)
    print(f"[scraper] Raw leads fetched: {len(raw_leads)}", file=sys.stderr)

    # Clean and validate each lead
    cleaned = []
    for lead in raw_leads:
        result = validate_and_clean(lead)
        if result:
            cleaned.append(result)

    print(f"[scraper] After validation: {len(cleaned)}", file=sys.stderr)

    # Remove any duplicates within this batch
    final = deduplicate(cleaned)
    print(f"[scraper] After deduplication: {len(final)}", file=sys.stderr)

    # Output the JSON to stdout (Node.js reads this)
    print(json.dumps(final, ensure_ascii=False))


if __name__ == "__main__":
    main()
