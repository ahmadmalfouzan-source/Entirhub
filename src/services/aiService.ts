import { GoogleGenAI, Type } from '@google/genai';

function safelyParseJSON(text: string, fallbackType: 'array' | 'object' = 'array') {
  if (!text) return fallbackType === 'array' ? [] : {};
  let cleaned = text.trim();
  
  // 1. Remove markdown backticks if present
  cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  
  // 2. Try parsing originally 
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  // 3. Try parsing after removing literal newlines (fixes "Unterminated string" from literal \n in strings)
  try {
    cleaned = cleaned.replace(/[\n\r]+/g, ' ');
    return JSON.parse(cleaned);
  } catch (e) {}

  // 4. Try fixing truncated JSON (e.g. cut off mid-generation)
  try {
    if (fallbackType === 'array' && cleaned.startsWith('[')) {
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace !== -1) {
        const repaired = cleaned.substring(0, lastBrace + 1) + ']';
        return JSON.parse(repaired);
      }
    } else if (fallbackType === 'object' && cleaned.startsWith('{')) {
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace !== -1) {
        const repaired = cleaned.substring(0, lastBrace + 1);
        return JSON.parse(repaired);
      }
    }
  } catch (e) {
    console.warn("Could not repair JSON:", e);
  }

  return fallbackType === 'array' ? [] : {};
}

export const getAIRecommendations = async (userData: {
  favoriteGenres: string[];
  topRated: string[];
  recentlyWatched: string[];
  language: 'en' | 'ar';
}): Promise<{ recommendations: { title: string; type: 'movie' | 'series' | 'game'; reason: string; genre: string }[] }> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined');
    return { recommendations: [] };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a high-end personalized recommendation engine specializing in movies, TV shows, and games.
Your goal is to generate deeply personalized and intelligent recommendations in ${userData.language === 'ar' ? 'Arabic' : 'English'} that reflect a strong understanding of the user's taste.

========================
INPUT
=====
User History:
- Favorite Genres: ${userData.favoriteGenres.join(', ')}
- Top Rated: ${userData.topRated.join(', ')}
- Recently Watched/Played: ${userData.recentlyWatched.join(', ')}

========================
TASK
====
Provide 10 highly personalized recommendations (mix of movies, series, and games) that match the user's taste.
IMPORTANT: Do not recommend anything from the Recently Watched/Played list or Top Rated list.

For EACH recommendation's "reason" field:
1. Infer the user's taste profile from their history (Tone, Themes, Character types, Narrative style).
2. Select 1-2 MOST relevant titles from the user's Top Rated or Recently Watched history.
3. Explain WHY the user likely enjoyed those titles (be specific).
4. Connect those insights directly to the recommended title (highlight shared tone, themes, or character depth).

========================
STRICT RULES FOR "reason" FIELD
===============================
* DO NOT be generic.
* DO NOT say "because you liked X" without explanation.
* DO NOT use vague adjectives like "great", "amazing", or "exciting".
* Focus on psychological depth, tone, and character complexity.
* Make the system feel like it truly understands the user.
* 2 to 3 sentences ONLY per reason.
* Natural, human-like tone.
* Insightful and precise.
* No bullet points.
* No emojis.

EXAMPLE REASON STYLE:
${userData.language === 'ar' ? 'مستوحى من اهتمامك بـ The Boys و Breaking Bad، حيث تحتل الشخصيات ذات الأخلاق المشكوك فيها وعواقب القوة مركز الصدارة، يميل هذا الاقتراح إلى سرد قصصي مظلم ومدفوع بالشخصيات. يستكشف الفساد والسيطرة بنبرة واقعية وقاسية غالباً، مقدماً الأفراد المعيبين على نماذج الأبطال التقليدية.' : 'Drawn from your interest in The Boys and Breaking Bad, where morally compromised characters and the consequences of power take center stage, this recommendation leans into a similarly dark and character-driven narrative. It explores corruption and control with a grounded, often brutal tone, prioritizing flawed individuals over traditional hero archetypes.'}

========================
OUTPUT FORMAT
=============
Return ONLY valid JSON in this format:
{
  "recommendations": [
    {
      "title": "string",
      "type": "movie" | "series" | "game",
      "reason": "string (following the strict rules above)",
      "genre": "string"
    }
  ]
}
No text outside the JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  genre: { type: Type.STRING }
                },
                required: ["title", "type", "reason", "genre"]
              }
            }
          },
          required: ["recommendations"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from Gemini');
    
    return safelyParseJSON(text, 'object');
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    return { recommendations: [] };
  }
};

export const getGameMainMissions = async (gameName: string): Promise<any[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `List ALL main story missions for "${gameName}" in order. Be accurate and specific to the actual game "${gameName}". Do not make up missions or trophies that don't exist. Return ONLY JSON array: [{"id": 1, "title": "mission", "description": "brief description", "rewards": "rewards", "tips": "brief tips"}]. Include a maximum of 50 main missions. STRICT RULE: Keep descriptions to 1 short sentence. Do NOT use newlines or double quotes inside any text fields to prevent JSON errors.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              rewards: { type: Type.STRING },
              tips: { type: Type.STRING }
            },
            required: ["id", "title"]
          }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from Gemini');
    
    return safelyParseJSON(text, 'array');
  } catch (error) {
    console.error('Error fetching main missions:', error);
    return [];
  }
};

export const getGameSideMissions = async (gameName: string): Promise<any[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `List ALL major side missions/quests for "${gameName}". Be accurate and specific to the actual game "${gameName}". Do not make up missions or trophies that don't exist. Return ONLY JSON array: [{"id": 1, "title": "mission", "description": "brief description", "rewards": "rewards", "tips": "brief tips"}]. Include a maximum of 40 major side missions. STRICT RULE: Keep descriptions to 1 short sentence. Do NOT use newlines or double quotes inside any text fields.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              rewards: { type: Type.STRING },
              tips: { type: Type.STRING }
            },
            required: ["id", "title"]
          }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from Gemini');
    
    return safelyParseJSON(text, 'array');
  } catch (error) {
    console.error('Error fetching side missions:', error);
    return [];
  }
};

export const getGameTrophies = async (gameName: string): Promise<any[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `List ALL trophies/achievements for "${gameName}" on PlayStation and Steam. Be accurate and specific to the actual game "${gameName}". Do not make up missions or trophies that don't exist. Use the actual official trophy/achievement list for "${gameName}" from PlayStation Network or Steam. Return ONLY JSON array: [{"name": "trophy string", "description": "brief unlock guide", "difficulty": "Easy/Medium/Hard", "platform": "PSN/Steam/Both"}]. Include a maximum of 50 trophies. STRICT RULE: Keep descriptions to 1 short sentence. Do NOT use newlines or double quotes inside any text fields.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              platform: { type: Type.STRING }
            },
            required: ["name"]
          }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from Gemini');
    
    return safelyParseJSON(text, 'array');
  } catch (error) {
    console.error('Error fetching trophies:', error);
    return [];
  }
};

export const getGameTipsAndClasses = async (gameName: string): Promise<{ tips: any[], classes: any[] } | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Create a detailed tips and builds guide for "${gameName}". Provide specific accurate advice based on actual game mechanics of "${gameName}". For RPGs include actual class names and skill trees from the game. Return ONLY a valid JSON object: { "gameTips": [{"category": "General/Combat/Exploration", "title": "tip title", "description": "brief tip"}], "bestClasses": [{"name": "class/build name", "description": "brief playstyle", "pros": "advantages", "cons": "disadvantages"}] }. Include a maximum of 15 game tips and up to 10 best classes/builds. STRICT RULE: Keep descriptions to 1-2 short sentences. Do NOT use newlines or double quotes inside any text fields.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gameTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["category", "title", "description"]
              }
            },
            bestClasses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  pros: { type: Type.STRING },
                  cons: { type: Type.STRING }
                },
                required: ["name", "description"]
              }
            }
          }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from Gemini');
    
    const parsed = safelyParseJSON(text, 'object') as any;
    return { tips: parsed.gameTips || [], classes: parsed.bestClasses || [] };
  } catch (error) {
    console.error('Error fetching tips and classes:', error);
    return null;
  }
};

export const extractTitlesFromImage = async (imageFile: File): Promise<string[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Convert File to base64
  const base64Image = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(imageFile);
  });
  
  const base64Data = base64Image.split(',')[1];
  
  const prompt = `Extract all game, movie, and series titles from this image. 
  
  Guidelines:
  - Return ONLY a JSON array of strings: ['Title 1', 'Title 2', ...].
  - Remove all UI text, numbers, icons, and words like "Installed", "Play", "Hours", "Update", "Download".
  - Keep only real, recognizable game, movie, or series titles.
  - Limit the result to a maximum of 20 titles.
  - No extra text or explanations.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType: imageFile.type } }] }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    
    const titles = safelyParseJSON(text, 'array') as any;
    return Array.isArray(titles) ? titles.slice(0, 20) : []; // Ensure limit
  } catch (error) {
    console.error('Error extracting titles from image:', error);
    return [];
  }
};
