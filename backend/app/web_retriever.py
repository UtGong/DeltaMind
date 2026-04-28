from typing import List, Dict
from urllib.parse import urlparse

import tldextract
from ddgs import DDGS


TRUSTED_REGULATORY_DOMAINS = [
    "gov.mo",
    "macaubusiness.gov",
    "sec.gov",
    "hkexnews.hk",
]

HIGH_QUALITY_NEWS_DOMAINS = [
    "reuters.com",
    "bloomberg.com",
    "apnews.com",
    "wsj.com",
    "ft.com",
    "cnbc.com",
]

GAMING_INDUSTRY_DOMAINS = [
    "insideasian gaming.com",
    "asia gaming brief.com",
    "igamingbusiness.com",
    "yogonet.com",
    "gamblinginsider.com",
]


def normalize_domain(url: str) -> str:
    parsed = tldextract.extract(url)
    if parsed.suffix:
        return f"{parsed.domain}.{parsed.suffix}".lower()
    return urlparse(url).netloc.lower()


def classify_source_from_url(url: str) -> Dict:
    domain = normalize_domain(url)

    if any(domain.endswith(d) for d in TRUSTED_REGULATORY_DOMAINS):
        return {
            "source_tier": 0,
            "source_type": "regulatory_source",
            "source_role": "Regulatory / legal authority",
            "authority_score": 95,
            "credibility_score": 94,
        }

    if any(domain.endswith(d) for d in HIGH_QUALITY_NEWS_DOMAINS):
        return {
            "source_tier": 2,
            "source_type": "independent_news",
            "source_role": "Independent high-quality news",
            "authority_score": 82,
            "credibility_score": 84,
        }

    if any(d.replace(" ", "") in domain.replace(" ", "") for d in GAMING_INDUSTRY_DOMAINS):
        return {
            "source_tier": 3,
            "source_type": "industry_press",
            "source_role": "Specialized gaming industry press",
            "authority_score": 72,
            "credibility_score": 74,
        }

    if domain:
        return {
            "source_tier": 4,
            "source_type": "general_web_source",
            "source_role": "General web source",
            "authority_score": 50,
            "credibility_score": 55,
        }

    return {
        "source_tier": 5,
        "source_type": "unknown_source",
        "source_role": "Unknown source",
        "authority_score": 35,
        "credibility_score": 40,
    }


def search_public_web(query: str, max_results: int = 8) -> List[Dict]:
    results: List[Dict] = []

    with DDGS(timeout=20) as ddgs:
        for item in ddgs.text(
            query,
            region="wt-wt",
            safesearch="moderate",
            max_results=max_results,
        ):
            url = item.get("href") or item.get("url") or ""
            title = item.get("title") or "Untitled source"
            body = item.get("body") or item.get("snippet") or ""

            if not url:
                continue

            source_profile = classify_source_from_url(url)

            results.append(
                {
                    "title": title,
                    "url": url,
                    "snippet": body,
                    "domain": normalize_domain(url),
                    **source_profile,
                }
            )

    return results
