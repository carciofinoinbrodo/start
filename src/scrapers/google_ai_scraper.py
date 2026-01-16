"""
Google AI Mode Scraper

Extracts AI-generated responses and source citations from Google AI Mode (udm=50).
Uses undetected-chromedriver to avoid bot detection.
"""

import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote_plus
from dataclasses import dataclass, asdict
from typing import Optional

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@dataclass
class Source:
    """A source citation from Google AI Mode."""
    title: str
    url: str
    date: Optional[str] = None
    description: Optional[str] = None
    publisher: Optional[str] = None


@dataclass
class ScrapeResult:
    """Result of scraping Google AI Mode."""
    query: str
    timestamp: str
    response_text: str
    sources: list[dict]
    source_count: int
    success: bool
    error: Optional[str] = None


class GoogleAIScraper:
    """Scrapes Google AI Mode using undetected-chromedriver."""

    BASE_URL = "https://www.google.com/search"

    def __init__(self, headless: bool = False):
        self.headless = headless
        self._driver = None

    def __enter__(self):
        self._start_browser()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._close_browser()

    def _start_browser(self):
        """Start undetected Chrome browser."""
        options = uc.ChromeOptions()
        options.add_argument("--window-size=1280,800")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--no-first-run")
        options.add_argument("--no-default-browser-check")

        if self.headless:
            options.add_argument("--headless=new")

        # Use version_main to avoid version mismatch
        self._driver = uc.Chrome(options=options, use_subprocess=True)
        print("Browser started!")
        time.sleep(2)  # Give browser time to stabilize

    def _close_browser(self):
        """Close the browser."""
        if self._driver:
            self._driver.quit()

    def _handle_cookie_consent(self):
        """Accept cookie consent if shown."""
        try:
            # Try multiple selectors for the Accept button
            selectors = [
                "//button[contains(text(), 'Accept all')]",
                "//button[contains(text(), 'Accetta tutto')]",
                "//button[@aria-label='Accept all']",
                "//div[contains(text(), 'Accept all')]/ancestor::button",
            ]

            for selector in selectors:
                try:
                    accept_btn = WebDriverWait(self._driver, 3).until(
                        EC.element_to_be_clickable((By.XPATH, selector))
                    )
                    accept_btn.click()
                    print("Cookie consent accepted!")
                    time.sleep(2)
                    return
                except Exception:
                    continue

            # If no button found by text, try by position (the blue button on the right)
            try:
                buttons = self._driver.find_elements(By.TAG_NAME, "button")
                for btn in buttons:
                    if "Accept" in btn.text or "accept" in btn.text.lower():
                        btn.click()
                        print("Cookie consent accepted (fallback)!")
                        time.sleep(2)
                        return
            except Exception:
                pass

        except Exception as e:
            print(f"Cookie consent handling: {e}")

    def _wait_for_response(self, timeout: int = 60):
        """Wait for AI response to be ready."""
        print("Waiting for AI response to generate...")

        # Wait for "Thinking" to appear and then disappear
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                page_text = self._driver.page_source

                # Check for CAPTCHA
                if "I'm not a robot" in page_text or "unusual traffic" in page_text.lower():
                    print("\n*** CAPTCHA DETECTED - Please solve it manually ***")
                    # Wait for user to solve
                    while "I'm not a robot" in self._driver.page_source:
                        time.sleep(1)
                    print("CAPTCHA solved! Continuing...")
                    time.sleep(2)

                # Check if response is ready (no more "Thinking")
                if "Thinking" not in page_text:
                    # Give extra time for content to render
                    time.sleep(3)
                    return

            except Exception:
                pass

            time.sleep(1)

    def _extract_response_text(self) -> str:
        """Extract the main AI response text."""
        try:
            # Get all text content from the page
            response_parts = []

            # Get headings
            for h in self._driver.find_elements(By.CSS_SELECTOR, "h2, h3"):
                text = h.text.strip()
                if text and len(text) > 3 and len(text) < 200:
                    if not any(skip in text.lower() for skip in ['sign in', 'accessibility', 'filters']):
                        response_parts.append(f"## {text}")

            # Get list items (recommendations)
            for li in self._driver.find_elements(By.TAG_NAME, "li"):
                text = li.text.strip()
                if text and len(text) > 30:
                    if not any(skip in text.lower() for skip in ['sign in', 'accessibility']):
                        response_parts.append(f"- {text}")

            # Get table content
            for table in self._driver.find_elements(By.TAG_NAME, "table"):
                rows = []
                for tr in table.find_elements(By.TAG_NAME, "tr"):
                    cells = [td.text.strip() for td in tr.find_elements(By.CSS_SELECTOR, "th, td")]
                    if cells:
                        rows.append(" | ".join(cells))
                if rows:
                    response_parts.append("\n".join(rows))

            return "\n\n".join(response_parts)
        except Exception as e:
            print(f"Error extracting response: {e}")
            return ""

    def _expand_sources(self):
        """Click button to expand all sources."""
        try:
            # Look for the sources count button (e.g., "22 sites" or "16 sites")
            # This is typically a button with number + "sites" text
            buttons = self._driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                try:
                    text = btn.text.strip()
                    # Match patterns like "22 sites", "16 sites", etc.
                    if text and ('sites' in text.lower() or re.match(r'^\d+\s*$', text)):
                        if btn.is_displayed():
                            btn.click()
                            print(f"Clicked sources button: '{text}'")
                            time.sleep(3)
                            return True
                except:
                    continue

            # Try clicking elements that contain "sites" text
            sites_elements = self._driver.find_elements(By.XPATH, "//*[contains(text(), 'sites')]")
            for elem in sites_elements:
                try:
                    if elem.is_displayed() and elem.is_enabled():
                        elem.click()
                        print(f"Clicked sites element: '{elem.text[:30]}'")
                        time.sleep(3)
                        return True
                except:
                    continue

            # Try "Show all" button
            for selector in [
                "//button[contains(text(), 'Show all')]",
                "//*[contains(text(), 'Show all')]",
            ]:
                try:
                    show_all = self._driver.find_element(By.XPATH, selector)
                    if show_all.is_displayed():
                        show_all.click()
                        print("Clicked 'Show all' button")
                        time.sleep(3)
                        return True
                except:
                    continue

            print("No sources expansion button found")
            return False
        except Exception as e:
            print(f"Could not expand sources: {e}")
            return False

    def _extract_sources(self) -> list[Source]:
        """Extract source citations from the expanded panel."""
        sources = []
        seen_urls = set()

        try:
            # First try to expand sources panel
            expanded = self._expand_sources()
            time.sleep(1)

            # If a dialog/panel opened, look for links inside it
            dialog_links = []
            try:
                # Check for dialog element
                dialogs = self._driver.find_elements(By.CSS_SELECTOR, "dialog, [role='dialog'], [aria-modal='true']")
                for dialog in dialogs:
                    if dialog.is_displayed():
                        # Scroll within the dialog to load all sources
                        for _ in range(5):
                            try:
                                self._driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", dialog)
                                time.sleep(0.5)
                            except:
                                break

                        dialog_links = dialog.find_elements(By.CSS_SELECTOR, "a[href^='http']")
                        print(f"Found {len(dialog_links)} links in dialog")
                        break
            except:
                pass

            # If no dialog, look for the sources panel/list
            if not dialog_links:
                try:
                    # Look for list items that contain source links
                    list_items = self._driver.find_elements(By.CSS_SELECTOR, "li a[href^='http']")
                    dialog_links = list_items
                    print(f"Found {len(dialog_links)} links in lists")
                except:
                    pass

            # If still nothing or found few, also get all page links
            if len(dialog_links) < 20:
                all_links = self._driver.find_elements(By.CSS_SELECTOR, "a[href^='http']")
                # Combine dialog links with page links (dialog first as they're more relevant)
                existing_hrefs = {l.get_attribute("href") for l in dialog_links}
                for link in all_links:
                    href = link.get_attribute("href")
                    if href and href not in existing_hrefs:
                        dialog_links.append(link)
                        existing_hrefs.add(href)
                print(f"Total links after combining: {len(dialog_links)}")

            for link in dialog_links:
                try:
                    url = link.get_attribute("href")

                    # Get title - try multiple ways
                    title = link.text.strip()
                    if not title:
                        # Try getting text from child elements
                        try:
                            title = link.find_element(By.XPATH, ".//div | .//span").text.strip()
                        except:
                            pass
                    if not title:
                        # Try aria-label
                        title = link.get_attribute("aria-label") or ""

                    # Skip Google internal links
                    if not url or url in seen_urls:
                        continue
                    if any(skip in url for skip in ['google.com', 'accounts.google', 'support.google', 'policies.google', 'g.co/', 'gstatic.com']):
                        continue

                    # Be more lenient with title
                    if not title:
                        # Extract title from URL as fallback
                        try:
                            from urllib.parse import urlparse
                            path = urlparse(url).path
                            title = path.split("/")[-1].replace("-", " ").replace("_", " ").title()
                        except:
                            title = url

                    if len(title) < 10:  # Skip very short titles (just company names)
                        continue
                    if any(skip in title.lower() for skip in ['sign in', 'accessibility', 'privacy', 'terms', 'google apps']):
                        continue

                    seen_urls.add(url)

                    # Get metadata from parent
                    date = None
                    description = None

                    try:
                        parent = link
                        for _ in range(4):
                            parent = parent.find_element(By.XPATH, "./..")
                            parent_text = parent.text

                            if not date:
                                date_match = re.search(
                                    r'\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|'
                                    r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}',
                                    parent_text, re.IGNORECASE
                                )
                                if date_match:
                                    date = date_match.group()

                            if not description and len(parent_text) > len(title) + 40:
                                desc = parent_text.replace(title, "")
                                if date:
                                    desc = desc.replace(date, "")
                                desc = re.sub(r'Opens in new tab|About this result', '', desc, flags=re.IGNORECASE).strip()
                                if len(desc) > 20:
                                    description = desc[:300]
                                    break
                    except:
                        pass

                    # Publisher from domain
                    publisher = None
                    try:
                        from urllib.parse import urlparse
                        hostname = urlparse(url).hostname
                        if hostname:
                            publisher = hostname.replace("www.", "").split(".")[0].capitalize()
                    except:
                        pass

                    clean_title = re.sub(r'\.?\s*Opens in new tab\.?', '', title, flags=re.IGNORECASE).strip()

                    if clean_title:
                        sources.append(Source(
                            title=clean_title,
                            url=url,
                            date=date,
                            description=description,
                            publisher=publisher
                        ))
                except:
                    continue

            print(f"Extracted {len(sources)} sources")

        except Exception as e:
            print(f"Error extracting sources: {e}")

        return sources

    def _take_screenshot(self, name: str = "debug"):
        """Take a screenshot for debugging."""
        try:
            screenshot_dir = Path(__file__).parent.parent.parent / "data" / "screenshots"
            screenshot_dir.mkdir(parents=True, exist_ok=True)
            path = screenshot_dir / f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            self._driver.save_screenshot(str(path))
            print(f"Screenshot saved: {path}")
            return path
        except Exception as e:
            print(f"Error taking screenshot: {e}")
            return None

    def scrape(self, query: str, take_screenshot: bool = False) -> ScrapeResult:
        """Scrape Google AI Mode for a query."""
        timestamp = datetime.now(timezone.utc).isoformat()

        try:
            # Build URL with AI Mode parameter
            encoded_query = quote_plus(query)
            url = f"{self.BASE_URL}?udm=50&q={encoded_query}"

            print(f"Navigating to: {url}")
            self._driver.get(url)
            time.sleep(2)

            # Handle cookie consent
            print("Handling cookie consent...")
            self._handle_cookie_consent()

            # Wait for AI response
            self._wait_for_response()

            if take_screenshot:
                self._take_screenshot(f"google_ai_{query[:20]}")

            # Extract response text
            print("Extracting response text...")
            response_text = self._extract_response_text()

            # Extract sources
            print("Extracting sources...")
            sources = self._extract_sources()

            if take_screenshot:
                self._take_screenshot(f"google_ai_final_{query[:20]}")

            return ScrapeResult(
                query=query,
                timestamp=timestamp,
                response_text=response_text,
                sources=[asdict(s) for s in sources],
                source_count=len(sources),
                success=True,
            )

        except Exception as e:
            if take_screenshot:
                self._take_screenshot(f"google_ai_error")
            return ScrapeResult(
                query=query,
                timestamp=timestamp,
                response_text="",
                sources=[],
                source_count=0,
                success=False,
                error=str(e),
            )

    def save_result(self, result: ScrapeResult, output_dir: Path):
        """Save result to JSON file."""
        output_dir.mkdir(parents=True, exist_ok=True)

        # Create filename from query
        filename = re.sub(r'[^\w\s-]', '', result.query.lower())
        filename = re.sub(r'[-\s]+', '_', filename)[:50]
        filename = f"{filename}.json"

        filepath = output_dir / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(asdict(result), f, indent=2, ensure_ascii=False)

        print(f"Saved to: {filepath}")
        return filepath
