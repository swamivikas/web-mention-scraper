// server/crawler.js
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Helper to build Google search URL with optional site filter
function buildSearchUrl(query, { site, lastNDays = 7, num = 20 } = {}) {
  const tbs = `qdr:d`; // default last 24h; we will handle 7 days with qdr:w (week)
  const timeRange = lastNDays >= 7 ? 'w' : 'd';
  const encodedQuery = encodeURIComponent(site ? `${query} site:${site}` : query);
  return `https://www.google.com/search?q=${encodedQuery}&tbs=qdr:${timeRange}&num=${num}`;
}

// Parses Google results page to extract result objects and stats
function parseGoogleResults(html) {
  const $ = cheerio.load(html);
  const results = [];
  
  // Try multiple selectors for Google results
  $('div.g, div[data-hveid]').each((_, elem) => {
    const title = $(elem).find('h3').text() || $(elem).find('[role="heading"]').text();
    const link = $(elem).find('a').attr('href');
    const snippet = $(elem).find('div.VwiC3b, div[data-sncf="1"], div.IsZvec').text();
    if (title && link) {
      results.push({ title, link, snippet });
    }
  });

  // Debug: log what we're getting
  console.log('Found results:', results.length);
  
  // Try multiple selectors for result stats
  const statsText = $('#result-stats').text() || $('div[id="result-stats"]').text() || '';
  console.log('Stats text:', statsText);
  
  const statsMatch = statsText.match(/([\d,]+)/);
  const totalResults = statsMatch ? parseInt(statsMatch[1].replace(/,/g, ''), 10) : null;
  
  // If no stats found, estimate based on results count
  if (!totalResults && results.length > 0) {
    return { results, totalResults: results.length * 10 }; // Rough estimate
  }
  
  return { results, totalResults };
}

// Alternative: Use DuckDuckGo HTML version (more scraping-friendly)
async function searchDuckDuckGo(query, site = null) {
  const searchQuery = site ? `${query} site:${site}` : query;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    $('.result').each((_, elem) => {
      const titleElem = $(elem).find('.result__a');
      const title = titleElem.text().trim();
      const link = titleElem.attr('href');
      const snippet = $(elem).find('.result__snippet').text().trim();
      
      if (title && link) {
        results.push({ title, link, snippet });
      }
    });
    
    console.log(`DuckDuckGo found ${results.length} results for: ${searchQuery}`);
    return results;
  } catch (error) {
    console.error('DuckDuckGo search failed:', error);
    return [];
  }
}

// Bing search scraper
async function searchBing(query, site = null) {
  const searchQuery = site ? `${query} site:${site}` : query;
  const url = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    $('.b_algo').each((_, elem) => {
      const titleElem = $(elem).find('h2 a');
      const title = titleElem.text().trim();
      const link = titleElem.attr('href');
      const snippet = $(elem).find('.b_caption p').text().trim();
      
      if (title && link) {
        results.push({ title, link, snippet });
      }
    });
    
    console.log(`Bing found ${results.length} results for: ${searchQuery}`);
    return results;
  } catch (error) {
    console.error('Bing search failed:', error);
    return [];
  }
}

// Mock data generator for demonstration
function generateMockData(query) {
  const mockSources = [
    'TechCrunch', 'Forbes', 'Reuters', 'Bloomberg', 'The Verge', 
    'Business Insider', 'CNBC', 'Wall Street Journal', 'LinkedIn News'
  ];
  
  const mockMentions = [];
  for (let i = 0; i < 10; i++) {
    mockMentions.push({
      title: `${query} ${['announces', 'launches', 'reports', 'reveals', 'shares'][Math.floor(Math.random() * 5)]} ${['new initiative', 'quarterly results', 'partnership', 'innovation', 'milestone'][Math.floor(Math.random() * 5)]}`,
      link: `https://example.com/article-${i}`,
      snippet: `Recent coverage about ${query} discussing their latest developments and industry impact. This article explores how ${query} is shaping the future of technology and business...`
    });
  }
  
  return {
    query,
    timestamp: new Date().toISOString(),
    last7DaysLinkedInMentions: Math.floor(Math.random() * 50) + 10,
    mentions: mockMentions,
    source: 'mock',
    note: 'Using mock data due to search engine restrictions. In production, consider using official APIs or headless browsers.'
  };
}

export async function crawlWeb(query) {
  console.log(`Starting crawl for: ${query}`);
  
  try {
    // Use Bing as primary search engine (more reliable for scraping)
    const [bingResults, bingLinkedInResults] = await Promise.all([
      searchBing(query),
      searchBing(query, 'linkedin.com')
    ]);
    
    if (bingResults.length > 0) {
      return {
        query,
        timestamp: new Date().toISOString(),
        last7DaysLinkedInMentions: bingLinkedInResults.length * 10, // Estimate
        mentions: bingResults.slice(0, 20),
        source: 'bing'
      };
    }
    
    // Fallback to DuckDuckGo if Bing fails
    console.log('Bing returned no results, trying DuckDuckGo...');
    const [ddgResults, ddgLinkedInResults] = await Promise.all([
      searchDuckDuckGo(query),
      searchDuckDuckGo(query, 'linkedin.com')
    ]);
    
    if (ddgResults.length > 0) {
      return {
        query,
        timestamp: new Date().toISOString(),
        last7DaysLinkedInMentions: ddgLinkedInResults.length * 10,
        mentions: ddgResults.slice(0, 20),
        source: 'duckduckgo'
      };
    }
    
    // Use mock data as final fallback
    console.log('All search engines failed, using mock data for demonstration...');
    return generateMockData(query);
    
  } catch (error) {
    console.error('Crawl failed:', error);
    // Return mock data on error
    return generateMockData(query);
  }
} 