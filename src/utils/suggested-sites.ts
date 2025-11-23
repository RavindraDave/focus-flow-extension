/**
 * Suggested Distracting Sites
 * Pre-populated list of commonly distracting websites that users can add with one click
 */

export interface SuggestedSite {
  domain: string;
  name: string;
  category: string;
}

export interface SiteCategory {
  name: string;
  icon: string;
  sites: SuggestedSite[];
}

/**
 * Comprehensive list of commonly distracting websites organized by category
 */
export const SUGGESTED_SITES: SiteCategory[] = [
  {
    name: 'Social Media',
    icon: '👥',
    sites: [
      { domain: 'facebook.com', name: 'Facebook', category: 'Social Media' },
      { domain: 'instagram.com', name: 'Instagram', category: 'Social Media' },
      { domain: 'twitter.com', name: 'Twitter/X', category: 'Social Media' },
      { domain: 'x.com', name: 'X (Twitter)', category: 'Social Media' },
      { domain: 'tiktok.com', name: 'TikTok', category: 'Social Media' },
      { domain: 'snapchat.com', name: 'Snapchat', category: 'Social Media' },
      { domain: 'linkedin.com', name: 'LinkedIn', category: 'Social Media' },
      { domain: 'pinterest.com', name: 'Pinterest', category: 'Social Media' },
      { domain: 'tumblr.com', name: 'Tumblr', category: 'Social Media' },
      { domain: 'reddit.com', name: 'Reddit', category: 'Social Media' },
      { domain: 'whatsapp.com', name: 'WhatsApp Web', category: 'Social Media' },
      { domain: 'telegram.org', name: 'Telegram Web', category: 'Social Media' },
      { domain: 'discord.com', name: 'Discord', category: 'Social Media' },
      { domain: 'vk.com', name: 'VKontakte', category: 'Social Media' },
      { domain: 'weibo.com', name: 'Weibo', category: 'Social Media' },
    ],
  },
  {
    name: 'Video & Entertainment',
    icon: '🎬',
    sites: [
      { domain: 'youtube.com', name: 'YouTube', category: 'Video & Entertainment' },
      { domain: 'netflix.com', name: 'Netflix', category: 'Video & Entertainment' },
      { domain: 'twitch.tv', name: 'Twitch', category: 'Video & Entertainment' },
      { domain: 'hulu.com', name: 'Hulu', category: 'Video & Entertainment' },
      { domain: 'disneyplus.com', name: 'Disney+', category: 'Video & Entertainment' },
      { domain: 'primevideo.com', name: 'Prime Video', category: 'Video & Entertainment' },
      { domain: 'vimeo.com', name: 'Vimeo', category: 'Video & Entertainment' },
      { domain: 'dailymotion.com', name: 'Dailymotion', category: 'Video & Entertainment' },
      { domain: 'hbomax.com', name: 'HBO Max', category: 'Video & Entertainment' },
      { domain: 'paramountplus.com', name: 'Paramount+', category: 'Video & Entertainment' },
      { domain: 'crunchyroll.com', name: 'Crunchyroll', category: 'Video & Entertainment' },
      { domain: 'funimation.com', name: 'Funimation', category: 'Video & Entertainment' },
    ],
  },
  {
    name: 'News & Media',
    icon: '📰',
    sites: [
      { domain: 'cnn.com', name: 'CNN', category: 'News & Media' },
      { domain: 'bbc.com', name: 'BBC', category: 'News & Media' },
      { domain: 'nytimes.com', name: 'New York Times', category: 'News & Media' },
      { domain: 'theguardian.com', name: 'The Guardian', category: 'News & Media' },
      { domain: 'foxnews.com', name: 'Fox News', category: 'News & Media' },
      { domain: 'reuters.com', name: 'Reuters', category: 'News & Media' },
      { domain: 'wsj.com', name: 'Wall Street Journal', category: 'News & Media' },
      { domain: 'washingtonpost.com', name: 'Washington Post', category: 'News & Media' },
      { domain: 'huffpost.com', name: 'HuffPost', category: 'News & Media' },
      { domain: 'buzzfeed.com', name: 'BuzzFeed', category: 'News & Media' },
      { domain: 'vice.com', name: 'Vice', category: 'News & Media' },
      { domain: 'medium.com', name: 'Medium', category: 'News & Media' },
      { domain: 'yahoo.com', name: 'Yahoo News', category: 'News & Media' },
      { domain: 'msn.com', name: 'MSN', category: 'News & Media' },
    ],
  },
  {
    name: 'Shopping',
    icon: '🛍️',
    sites: [
      { domain: 'amazon.com', name: 'Amazon', category: 'Shopping' },
      { domain: 'ebay.com', name: 'eBay', category: 'Shopping' },
      { domain: 'etsy.com', name: 'Etsy', category: 'Shopping' },
      { domain: 'alibaba.com', name: 'Alibaba', category: 'Shopping' },
      { domain: 'aliexpress.com', name: 'AliExpress', category: 'Shopping' },
      { domain: 'walmart.com', name: 'Walmart', category: 'Shopping' },
      { domain: 'target.com', name: 'Target', category: 'Shopping' },
      { domain: 'bestbuy.com', name: 'Best Buy', category: 'Shopping' },
      { domain: 'newegg.com', name: 'Newegg', category: 'Shopping' },
      { domain: 'wayfair.com', name: 'Wayfair', category: 'Shopping' },
      { domain: 'wish.com', name: 'Wish', category: 'Shopping' },
      { domain: 'shopify.com', name: 'Shopify Stores', category: 'Shopping' },
    ],
  },
  {
    name: 'Gaming',
    icon: '🎮',
    sites: [
      { domain: 'steam.com', name: 'Steam', category: 'Gaming' },
      { domain: 'steampowered.com', name: 'Steam Community', category: 'Gaming' },
      { domain: 'epicgames.com', name: 'Epic Games', category: 'Gaming' },
      { domain: 'origin.com', name: 'Origin', category: 'Gaming' },
      { domain: 'battle.net', name: 'Battle.net', category: 'Gaming' },
      { domain: 'roblox.com', name: 'Roblox', category: 'Gaming' },
      { domain: 'minecraft.net', name: 'Minecraft', category: 'Gaming' },
      { domain: 'leagueoflegends.com', name: 'League of Legends', category: 'Gaming' },
      { domain: 'valorant.com', name: 'Valorant', category: 'Gaming' },
      { domain: 'ign.com', name: 'IGN', category: 'Gaming' },
      { domain: 'gamespot.com', name: 'GameSpot', category: 'Gaming' },
      { domain: 'kotaku.com', name: 'Kotaku', category: 'Gaming' },
      { domain: 'polygon.com', name: 'Polygon', category: 'Gaming' },
    ],
  },
  {
    name: 'Sports',
    icon: '⚽',
    sites: [
      { domain: 'espn.com', name: 'ESPN', category: 'Sports' },
      { domain: 'bleacherreport.com', name: 'Bleacher Report', category: 'Sports' },
      { domain: 'nba.com', name: 'NBA', category: 'Sports' },
      { domain: 'nfl.com', name: 'NFL', category: 'Sports' },
      { domain: 'mlb.com', name: 'MLB', category: 'Sports' },
      { domain: 'nhl.com', name: 'NHL', category: 'Sports' },
      { domain: 'fifa.com', name: 'FIFA', category: 'Sports' },
      { domain: 'skysports.com', name: 'Sky Sports', category: 'Sports' },
      { domain: 'sports.yahoo.com', name: 'Yahoo Sports', category: 'Sports' },
    ],
  },
  {
    name: 'Forums & Communities',
    icon: '💬',
    sites: [
      { domain: '4chan.org', name: '4chan', category: 'Forums & Communities' },
      { domain: '9gag.com', name: '9GAG', category: 'Forums & Communities' },
      { domain: 'imgur.com', name: 'Imgur', category: 'Forums & Communities' },
      { domain: 'quora.com', name: 'Quora', category: 'Forums & Communities' },
      { domain: 'stackexchange.com', name: 'Stack Exchange', category: 'Forums & Communities' },
      { domain: 'stackoverflow.com', name: 'Stack Overflow', category: 'Forums & Communities' },
      { domain: 'hackernews.com', name: 'Hacker News', category: 'Forums & Communities' },
      { domain: 'news.ycombinator.com', name: 'Hacker News', category: 'Forums & Communities' },
      { domain: 'producthunt.com', name: 'Product Hunt', category: 'Forums & Communities' },
    ],
  },
  {
    name: 'Adult Content',
    icon: '🔞',
    sites: [
      { domain: 'pornhub.com', name: 'Pornhub', category: 'Adult Content' },
      { domain: 'xvideos.com', name: 'XVideos', category: 'Adult Content' },
      { domain: 'xnxx.com', name: 'XNXX', category: 'Adult Content' },
      { domain: 'redtube.com', name: 'RedTube', category: 'Adult Content' },
      { domain: 'youporn.com', name: 'YouPorn', category: 'Adult Content' },
      { domain: 'onlyfans.com', name: 'OnlyFans', category: 'Adult Content' },
    ],
  },
];

/**
 * Get all suggested sites as a flat array
 */
export function getAllSuggestedSites(): SuggestedSite[] {
  return SUGGESTED_SITES.flatMap(category => category.sites);
}

/**
 * Get sites by category name
 */
export function getSitesByCategory(categoryName: string): SuggestedSite[] {
  const category = SUGGESTED_SITES.find(cat => cat.name === categoryName);
  return category ? category.sites : [];
}

/**
 * Get all category names
 */
export function getCategoryNames(): string[] {
  return SUGGESTED_SITES.map(cat => cat.name);
}

/**
 * Search suggested sites by name or domain
 */
export function searchSuggestedSites(query: string): SuggestedSite[] {
  const lowerQuery = query.toLowerCase();
  return getAllSuggestedSites().filter(
    site =>
      site.name.toLowerCase().includes(lowerQuery) ||
      site.domain.toLowerCase().includes(lowerQuery)
  );
}
