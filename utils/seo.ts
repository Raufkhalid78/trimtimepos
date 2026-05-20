/**
 * Lightweight SEO utility for dynamic page title and meta tag management.
 * No external dependencies required — uses native DOM APIs.
 */

const SITE_NAME = 'TrimTime POS';
const BASE_URL = 'https://trimtimepos.com';

/**
 * Sets the page title, meta description, canonical URL, and OG tags
 * for the current page. Call this in a useEffect on each page component.
 */
export function setPageMeta(title: string, description?: string): void {
  // Update document title
  document.title = `${title} | ${SITE_NAME}`;

  // Update meta description
  if (description) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }
  }

  // Update canonical URL for current page
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', `${BASE_URL}${window.location.pathname}`);
  }

  // Update OG URL
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) {
    ogUrl.setAttribute('content', `${BASE_URL}${window.location.pathname}`);
  }

  // Update OG title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', `${title} | ${SITE_NAME}`);
  }

  // Update OG description
  if (description) {
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description);
    }
  }

  // Update Twitter title
  const twTitle = document.querySelector('meta[property="twitter:title"]');
  if (twTitle) {
    twTitle.setAttribute('content', `${title} | ${SITE_NAME}`);
  }

  // Update Twitter description
  if (description) {
    const twDesc = document.querySelector('meta[property="twitter:description"]');
    if (twDesc) {
      twDesc.setAttribute('content', description);
    }
  }
}
