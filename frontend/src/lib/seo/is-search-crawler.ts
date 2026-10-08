/**
 * Known search / social crawlers that should see indexable storefront HTML
 * without completing the human age-gate cookie flow.
 *
 * Includes Google tooling UAs (InspectionTool, GoogleOther, AdsBot) used by
 * Search Console / Rich Results Test — not only classic Googlebot.
 * Also covers PageSpeed/Lighthouse, messaging link previews, and AI search
 * crawlers so shared links and speed tests see the real page.
 */
const CRAWLER_UA_PATTERN =
  /googlebot|google-inspectiontool|googleother|adsbot-google|storebot-google|google-site-verification|mediapartners-google|apis-google|feedfetcher-google|google-read-aloud|chrome-lighthouse|google-pagespeed|bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|facebot|meta-externalagent|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|whatsapp|telegrambot|slackbot|discordbot|skypeuripreview|redditbot|gptbot|oai-searchbot|chatgpt-user|perplexitybot|claudebot|claude-searchbot|claude-user|ccbot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider/i;

export function isSearchCrawlerUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return false;
  }
  return CRAWLER_UA_PATTERN.test(userAgent);
}
