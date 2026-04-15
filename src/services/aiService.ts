import { GoogleGenAI } from '@google/genai';

export const getAIRecommendations = async (userData: {
  favoriteGenres: string[];
  topRated: string[];
  recentlyWatched: string[];
}): Promise<{ recommendations: { title: string; type: 'movie' | 'series' | 'game'; reason: string; genre: string }[] }> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined');
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined');
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
      model: 'gemini-flash-latest',
      contents: [
        { role: 'user', parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType: imageFile.type } }] }
      ],
    });
    
    const text = response.text;
    if (!text) return [];
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    
    const titles = JSON.parse(jsonMatch[0]);
    return titles.slice(0, 20); // Ensure limit
  } catch (error) {
    console.error('Error extracting titles from image:', error);
    return [];
  }
};
