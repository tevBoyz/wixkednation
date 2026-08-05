/**
 * Known search / social crawlers that should see indexable storefront HTML
 * without completing the human age-gate cookie flow.
 *
 * Includes Google tooling UAs (InspectionTool, GoogleOther, AdsBot) used by
 * Search Console / Rich Results Test — not only classic Googlebot.
 */
const CRAWLER_UA_PATTERN =
  /googlebot|google-inspectiontool|googleother|adsbot-google|storebot-google|google-site-verification|mediapartners-google|bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider/i;

export function isSearchCrawlerUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return false;
  }
  return CRAWLER_UA_PATTERN.test(userAgent);
}
