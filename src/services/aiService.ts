import { GoogleGenAI } from '@google/genai';

export const getAIRecommendations = async (userData: {
  favoriteGenres: string[];
  topRated: string[];
  recentlyWatched: string[];
}): Promise<{ recommendations: { title: string; type: 'movie' | 'series' | 'game'; reason: string; genre: string }[] }> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('VITE_GEMINI_API_KEY is not defined');
    return { recommendations: [] };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Act as an expert curator.
    User Profile:
    - Favorite Genres: ${userData.favoriteGenres.join(', ')}
    - Top Rated: ${userData.topRated.join(', ')}
    - Recently Watched/Played: ${userData.recentlyWatched.join(', ')}

    Provide 10 highly personalized recommendations that match the user's taste in tone, themes, and storytelling style.
    Mix movies, series, and games.
    IMPORTANT: Do not recommend anything from the Recently Watched/Played list or Top Rated list.

    Return ONLY valid JSON in this format:
    {
      "recommendations": [
        {
          "title": "string",
          "type": "movie" | "series" | "game",
          "reason": "short explanation (e.g., 'Because you watched The Boys', 'Based on your Action favorites')",
          "genre": "string"
        }
      ]
    }
    No text outside the JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from Gemini');
    
    // Safely extract JSON block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    return { recommendations: [] };
  }
};

export const getGameMissions = async (gameName: string): Promise<any[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('VITE_GEMINI_API_KEY is not defined');
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `List main story missions for "${gameName}". Return ONLY JSON array: [{"id": 1, "title": "Name", "description": "Desc"}]. Include 15-20 missions. No extra text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    const text = response.text;
    if (!text) throw new Error('No text returned from Gemini');
    
    // Safely extract JSON block
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error fetching missions:', error);
    return [];
  }
};
