// services/geminiService.js

// Mock data for development - remove this when you have real API
const mockNewsData = {
  articles: [
    {
      headline: "Nigeria's Economy Shows Strong Growth in Q4 2024",
      summary: "Recent economic indicators suggest positive growth trends across multiple sectors despite global challenges.",
      category: "Business",
      source: "Business Daily",
      isBreaking: true,
      timestamp: new Date().toISOString()
    },
    {
      headline: "National Team Advances to Continental Finals",
      summary: "The Super Eagles secure their spot in the championship after a thrilling semi-final match.",
      category: "Sports", 
      source: "Sports Network",
      isBreaking: false,
      timestamp: new Date().toISOString()
    },
    {
      headline: "Tech Innovation Hub Launched in Lagos",
      summary: "New technology center aims to foster innovation and startup growth in the region.",
      category: "Tech",
      source: "Tech Review",
      isBreaking: true,
      timestamp: new Date().toISOString()
    },
    {
      headline: "Entertainment Industry Sets New Records",
      summary: "Nollywood and music industry achieve unprecedented international recognition this year.",
      category: "Entertainment",
      source: "Culture Times",
      isBreaking: false,
      timestamp: new Date().toISOString()
    },
    {
      headline: "Political Reforms Gain Momentum",
      summary: "New legislative proposals aim to strengthen democratic institutions and processes.",
      category: "Politics",
      source: "National Herald",
      isBreaking: false,
      timestamp: new Date().toISOString()
    },
    {
      headline: "Healthcare Initiative Reaches Milestone",
      summary: "National health program exceeds targets, improving access to medical services.",
      category: "Health",
      source: "Health Digest",
      isBreaking: false,
      timestamp: new Date().toISOString()
    }
  ],
  groundingMetadata: {
    groundingChunks: [
      {
        web: {
          uri: "https://example.com/source1",
          title: "Official Economic Report"
        }
      },
      {
        web: {
          uri: "https://example.com/source2", 
          title: "Sports Association"
        }
      }
    ]
  }
};

export async function fetchRealtimeNews() {
  try {
    // For now, return mock data
    // Replace this with your actual API call when ready
    console.log("Fetching news data...");
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockNewsData;
    
    // When ready for real API, use:
    // const response = await fetch('your-api-endpoint');
    // return await response.json();
    
  } catch (error) {
    console.error('Error fetching news:', error);
    return { 
      error: "Unable to fetch news data. Please check your connection.",
      articles: [],
      groundingMetadata: null
    };
  }
}
