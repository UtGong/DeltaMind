import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def fetch_page_text(url: str, timeout: int = 10) -> Optional[str]:
    """
    Fetches and extracts readable text from a public web page.
    This is a lightweight extractor for prototype use.
    """

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0 Safari/537.36"
        )
    }

    try:
        with httpx.Client(
            timeout=timeout,
            follow_redirects=True,
            headers=headers,
        ) as client:
            response = client.get(url)

        if response.status_code >= 400:
            return None

        content_type = response.headers.get("content-type", "")
        if "text/html" not in content_type:
            return None

        soup = BeautifulSoup(response.text, "lxml")

        for tag in soup(["script", "style", "noscript", "svg", "iframe", "header", "footer", "nav"]):
            tag.decompose()

        title = soup.title.get_text(" ", strip=True) if soup.title else ""

        main_candidates = soup.find_all(["article", "main"])
        if main_candidates:
            body_text = " ".join(
                candidate.get_text(" ", strip=True)
                for candidate in main_candidates
            )
        else:
            paragraphs = soup.find_all("p")
            body_text = " ".join(p.get_text(" ", strip=True) for p in paragraphs)

        text = clean_text(f"{title}. {body_text}")

        if len(text) < 100:
            fallback = clean_text(soup.get_text(" ", strip=True))
            return fallback[:8000] if fallback else None

        return text[:12000]

    except Exception:
        return None
