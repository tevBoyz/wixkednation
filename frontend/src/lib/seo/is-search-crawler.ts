/**
 * Known search / social crawlers that should see indexable storefront HTML
 * without completing the human age-gate cookie flow.
 */
const CRAWLER_UA_PATTERN =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider/i;

export function isSearchCrawlerUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return false;
  }
  return CRAWLER_UA_PATTERN.test(userAgent);
}
