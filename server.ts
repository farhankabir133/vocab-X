import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Gemini API client (lazy-initialized in routes)
  let genAI: GoogleGenAI | null = null;
  function getGenAI() {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not defined in environment variables');
      }
      genAI = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return genAI;
  }

  // Common model alias
  const DEFAULT_MODEL = 'gemini-flash-latest';

  // Helper for model calling with basic retry for transient errors
  async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isTransient = error.message?.includes('503') || 
                         error.message?.includes('429') || 
                         error.status === 503 || 
                         error.status === 429;
      
      if (isTransient && retries > 0) {
        console.log(`Transient error encountered, retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  // API Route for Gemini Chat
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      const ai = getGenAI();

      const result = await withRetry(() => {
        const chat = ai.chats.create({
          model: DEFAULT_MODEL,
          history: history || [],
          config: {
            systemInstruction: "Act as a professional vocabulary tutor. Provide concise, helpful explanations and mnemonics. Help users prepare for exams like BCS, IELTS, and GRE.",
          },
        });
        return chat.sendMessage({ message });
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // API Route for Word Analysis / Mnemonics
  app.post('/api/analyze-word', async (req, res) => {
    try {
      const { word } = req.body;
      if (!word) {
        return res.status(400).json({ error: 'Word is required' });
      }

      const ai = getGenAI();
      
      const prompt = `Provide a comprehensive analysis for the word "${word}". 
      Focus on helping a student learn and remember this word for competitive exams (like BCS or IELTS).
      The Bengali translation should be accurate and common.`;

      const response = await withRetry(() => ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: { 
          systemInstruction: "You are a professional vocabulary tutor and linguist. Always respond with valid JSON matching the requested schema.",
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT' as any,
            properties: {
              pronunciation: { type: 'STRING', description: 'General pronunciation guide' },
              ipa: { type: 'STRING', description: 'Accurate IPA phonetic notation' },
              definition: { type: 'STRING', description: 'Clear and concise definition' },
              mnemonic: { type: 'STRING', description: 'A clever memory aid' },
              examples: { 
                type: 'ARRAY', 
                items: { type: 'STRING' },
                description: 'Two example sentences'
              },
              synonyms: { 
                type: 'ARRAY', 
                items: { type: 'STRING' },
                description: 'List of relevant synonyms'
              },
              bengaliTranslation: { type: 'STRING', description: 'Bengali meaning' }
            },
            required: ['pronunciation', 'ipa', 'definition', 'mnemonic', 'examples', 'synonyms', 'bengaliTranslation']
          }
        },
      }));
      
      const text = response.text;
      if (!text) {
        throw new Error('No response content from Gemini');
      }

      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: 'Failed to analyze word. Please try again later.' });
    }
  });

  // API Route for Web Search / Concept Exploration
  app.post('/api/web-search', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const ai = getGenAI();
      const response = await withRetry(() => ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: `Explain the following word or linguistic concept: "${query}". Provide a concise yet thorough explanation suitable for a vocabulary learner. If it's a very rare word or complex concept, provide context and usage.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      }));

      const text = response.text;
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

      res.json({
        text,
        sources: chunks?.map((c: any) => ({
          uri: c.web?.uri,
          title: c.web?.title
        })).filter((s: any) => s.uri) || []
      });
    } catch (error: any) {
      console.error('Gemini Web Search Error:', error);
      res.status(500).json({ error: 'Web search protocol failed. Please try again.' });
    }
  });

  // API Route for Word Nuance Comparison
  app.post('/api/compare-nuances', async (req, res) => {
    try {
      const { words } = req.body;
      if (!words || !Array.isArray(words) || words.length < 2) {
        return res.status(400).json({ error: 'At least two words are required for comparison.' });
      }

      const ai = getGenAI();
      const response = await withRetry(() => ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: `Compare the following words: ${words.join(', ')}. 
        Provide a concise analysis focusing on:
        1. Key differences in usage and connotation.
        2. Typical contexts where one is preferred over the other.
        3. A summary of their shared semantic field.
        Keep it under 150 words and use markdown.`,
      }));

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error('Nuance Comparison Error:', error);
      res.status(500).json({ error: 'Failed to generate semantic contrast analysis.' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
