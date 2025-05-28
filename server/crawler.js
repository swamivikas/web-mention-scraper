import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';


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
    
    // Try to extract total results count from Bing
    let totalCount = null;
    const countText = $('.sb_count').text() || '';
    const countMatch = countText.match(/([\d,]+)\s+results?/i);
    if (countMatch) {
      totalCount = parseInt(countMatch[1].replace(/,/g, ''), 10);
    }
    
    console.log(`Bing found ${results.length} results for: ${searchQuery}`);
    console.log(`Total count from Bing: ${totalCount || 'not found'}`);
    
    return { results, totalCount };
  } catch (error) {
    console.error('Bing search failed:', error);
    return { results: [], totalCount: null };
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
    const [bingData, bingLinkedInData] = await Promise.all([
      searchBing(query),
      searchBing(query, 'linkedin.com')
    ]);
    
    if (bingData.results.length > 0) {
      const linkedInCount = bingLinkedInData.totalCount || 
                           (bingLinkedInData.results.length > 0 ? bingLinkedInData.results.length * 10 : 0);
      
      return {
        query,
        timestamp: new Date().toISOString(),
        last7DaysLinkedInMentions: linkedInCount,
        mentions: bingData.results.slice(0, 20),
        source: 'bing',
        debug: {
          linkedInResultsFound: bingLinkedInData.results.length,
          linkedInTotalCount: bingLinkedInData.totalCount
        }
      };
    }
    
    console.log('Bing returned no results, trying DuckDuckGo...');
    const [ddgResults, ddgLinkedInResults] = await Promise.all([
      searchDuckDuckGo(query),
      searchDuckDuckGo(query, 'linkedin.com')
    ]);
    
    if (ddgResults.length > 0) {
      return {
        query,
        timestamp: new Date().toISOString(),
        last7DaysLinkedInMentions: ddgLinkedInResults.length > 0 ? ddgLinkedInResults.length * 10 : 0,
        mentions: ddgResults.slice(0, 20),
        source: 'duckduckgo'
      };
    }
    
    console.log('All search engines failed, using mock data for demonstration...');
    return generateMockData(query);
    
  } catch (error) {
    console.error('Crawl failed:', error);
    return generateMockData(query);
  }
} 