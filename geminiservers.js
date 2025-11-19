import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

export const fetchRealtimeNews = async () => {
  try {
    const modelId = 'gemini-2.5-flash';

    const prompt = `
      You are a real-time news aggregator API for Nigeria. 
      Perform a Google Search to find the absolute latest news stories in Nigeria happening right now or in the last 24 hours.
      
      Select exactly 8 distinct, high-impact stories.
      
      You MUST return the data in the following strict plain text format for EACH story, separated by a "---" line.
      Do not use markdown formatting (like bolding **) for the keys.
      
      Format:
      HEADLINE: [The headline of the news]
      SOURCE: [The name of the media outlet, e.g., Punch, Vanguard, Channels TV]
      CATEGORY: [One of: Politics, Business, Sports, Entertainment, Tech, or General]
      SUMMARY: [A concise 2-3 sentence summary of the event]
      IS_BREAKING: [true or false - true if it is a major developing story]
      ---
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    if (!text) {
      return { articles: [], groundingMetadata: null, error: "No content generated" };
    }

    const articles = parseNewsResponse(text);
    
    return {
      articles,
      groundingMetadata: groundingMetadata,
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      articles: [],
      groundingMetadata: null,
      error: error.message || "Unknown error occurred",
    };
  }
};

const parseNewsResponse = (text) => {
  const articles = [];
  const chunks = text.split('---').map(c => c.trim()).filter(c => c.length > 0);

  chunks.forEach((chunk, index) => {
    const lines = chunk.split('\n');
    const article = {
      id: `news-${Date.now()}-${index}`,
      timestamp: new Date(),
      headline: '',
      source: '',
      category: 'General',
      summary: '',
      isBreaking: false
    };

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('HEADLINE:')) article.headline = cleanLine.replace('HEADLINE:', '').trim();
      else if (cleanLine.startsWith('SOURCE:')) article.source = cleanLine.replace('SOURCE:', '').trim();
      else if (cleanLine.startsWith('CATEGORY:')) article.category = cleanLine.replace('CATEGORY:', '').trim();
      else if (cleanLine.startsWith('SUMMARY:')) article.summary = cleanLine.replace('SUMMARY:', '').trim();
      else if (cleanLine.startsWith('IS_BREAKING:')) article.isBreaking = cleanLine.replace('IS_BREAKING:', '').trim().toLowerCase() === 'true';
    });

    if (article.headline && article.summary) {
      articles.push(article);
    }
  });

  return articles;
};
