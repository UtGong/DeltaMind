from urllib.parse import urlparse
from typing import Dict, List

import tldextract

from app.models import SourceItem


def normalize_domain(url: str) -> str:
    extracted = tldextract.extract(url)
    if extracted.domain and extracted.suffix:
        return f"{extracted.domain}.{extracted.suffix}".lower()
    return urlparse(url).netloc.lower()


SOURCE_PROFILES: Dict[str, Dict] = {
    # Official / regulatory
    "gov.mo": {
        "source_tier": 0,
        "source_type": "regulatory_source",
        "source_role": "Regulatory / legal authority",
        "authority_score": 98,
        "credibility_score": 95,
        "reliability_prior": 0.95,
        "bias_risk": "low",
        "reason": "Macau government or regulatory source; strongest for licensing, compliance, and official records.",
    },
    "mgm.mo": {
        "source_tier": 1,
        "source_type": "official_company_source",
        "source_role": "Official MGM Macau source",
        "authority_score": 86,
        "credibility_score": 84,
        "reliability_prior": 0.80,
        "bias_risk": "medium",
        "reason": "Official MGM Macau website; strong for current offerings and official property information, but may carry self-reporting bias.",
    },
    "mgmchinaholdings.com": {
        "source_tier": 1,
        "source_type": "official_company_source",
        "source_role": "Official company source",
        "authority_score": 88,
        "credibility_score": 86,
        "reliability_prior": 0.82,
        "bias_risk": "medium",
        "reason": "Official company source; strong for company announcements, but may carry self-reporting bias.",
    },
    "mgmresorts.com": {
        "source_tier": 1,
        "source_type": "official_company_source",
        "source_role": "Official company source",
        "authority_score": 88,
        "credibility_score": 86,
        "reliability_prior": 0.82,
        "bias_risk": "medium",
        "reason": "Official company source; strong for announcements, weak for independent evaluation.",
    },

    # High-quality / business news
    "reuters.com": {
        "source_tier": 2,
        "source_type": "independent_news",
        "source_role": "High-quality independent news",
        "authority_score": 88,
        "credibility_score": 88,
        "reliability_prior": 0.86,
        "bias_risk": "low",
        "reason": "High-quality independent news source.",
    },
    "bloomberg.com": {
        "source_tier": 2,
        "source_type": "independent_news",
        "source_role": "High-quality business news",
        "authority_score": 86,
        "credibility_score": 86,
        "reliability_prior": 0.84,
        "bias_risk": "low",
        "reason": "High-quality business news source.",
    },
    "businesstimes.com.sg": {
        "source_tier": 2,
        "source_type": "business_news",
        "source_role": "Business news",
        "authority_score": 76,
        "credibility_score": 76,
        "reliability_prior": 0.72,
        "bias_risk": "low-medium",
        "reason": "Business news outlet; useful for market and company reporting.",
    },
    "finance.yahoo.com": {
        "source_tier": 4,
        "source_type": "syndicated_news",
        "source_role": "Syndicated / aggregated finance news",
        "authority_score": 52,
        "credibility_score": 58,
        "reliability_prior": 0.50,
        "bias_risk": "medium",
        "reason": "Often syndicates third-party reports; useful but should be traced to origin.",
    },

    # Gaming / hospitality industry press
    "agbrief.com": {
        "source_tier": 3,
        "source_type": "gaming_industry_press",
        "source_role": "Specialized gaming industry press",
        "authority_score": 74,
        "credibility_score": 74,
        "reliability_prior": 0.70,
        "bias_risk": "medium",
        "reason": "Specialized gaming industry source; useful for domain-specific reporting.",
    },
    "hotelmanagement-network.com": {
        "source_tier": 3,
        "source_type": "hospitality_industry_press",
        "source_role": "Hospitality industry press",
        "authority_score": 68,
        "credibility_score": 68,
        "reliability_prior": 0.64,
        "bias_risk": "medium",
        "reason": "Industry source; useful for hospitality development context.",
    },
    "blooloop.com": {
        "source_tier": 3,
        "source_type": "industry_press",
        "source_role": "Attractions / experience industry press",
        "authority_score": 64,
        "credibility_score": 64,
        "reliability_prior": 0.60,
        "bias_risk": "medium",
        "reason": "Industry source; useful for venue, resort, and visitor-experience reporting.",
    },

    # Reference / lower-priority sources
    "wikipedia.org": {
        "source_tier": 4,
        "source_type": "reference_source",
        "source_role": "Reference source",
        "authority_score": 48,
        "credibility_score": 55,
        "reliability_prior": 0.45,
        "bias_risk": "medium",
        "reason": "Useful for background, but not primary verification evidence.",
    },
    "substack.com": {
        "source_tier": 4,
        "source_type": "commentary_blog",
        "source_role": "Commentary / blog",
        "authority_score": 38,
        "credibility_score": 45,
        "reliability_prior": 0.35,
        "bias_risk": "medium-high",
        "reason": "Individual commentary; weak verification source unless independently corroborated.",
    },
}


def default_profile(domain: str) -> Dict:
    return {
        "source_tier": 4,
        "source_type": "general_web_source",
        "source_role": "General web source",
        "authority_score": 50,
        "credibility_score": 55,
        "reliability_prior": 0.45,
        "bias_risk": "unknown",
        "reason": f"No specific source profile found for {domain}; assigned default general-web prior.",
    }


def profile_for_source(source: SourceItem) -> Dict:
    domain = normalize_domain(source.url)

    for known_domain, profile in SOURCE_PROFILES.items():
        if domain.endswith(known_domain):
            return {"domain": domain, **profile}

    return {"domain": domain, **default_profile(domain)}


def apply_source_authority_profiles(sources: List[SourceItem]) -> List[SourceItem]:
    for source in sources:
        profile = profile_for_source(source)

        source.normalized_domain = profile["domain"]
        source.source_tier = profile["source_tier"]
        source.source_type = profile["source_type"]
        source.source_role = profile["source_role"]
        source.authority_score = profile["authority_score"]
        source.credibility_score = profile["credibility_score"]
        source.reliability_prior = profile["reliability_prior"]
        source.bias_risk = profile["bias_risk"]
        source.authority_reason = profile["reason"]

    return sources
