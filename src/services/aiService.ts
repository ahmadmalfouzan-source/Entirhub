export const getAIRecommendations = async (userData: {
  favoriteGenres: string[];
  topRated: string[];
  recentlyWatched: string[];
}): Promise<{ recommendations: { title: string; type: 'movie' | 'tv' | 'game'; reason: string; genre: string }[] }> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('VITE_GEMINI_API_KEY is not defined');
    return { recommendations: [] };
  }

  try {
    const prompt = `Act as an expert curator.
    User Profile:
    - Favorite Genres: ${userData.favoriteGenres.join(', ')}
    - Top Rated: ${userData.topRated.join(', ')}
    - Recently Watched/Played: ${userData.recentlyWatched.join(', ')}

    Provide 5 highly personalized recommendations that match the user's taste in tone, themes, and storytelling style.
    Mix popular titles with hidden gems. Avoid generic recommendations.
    IMPORTANT: Do not recommend anything from the Recently Watched/Played list.

    Return ONLY valid JSON in this format:
    {
      "recommendations": [
        {
          "title": "string",
          "type": "movie" | "tv" | "game",
          "reason": "short explanation",
          "genre": "string"
        }
      ]
    }
    No text outside the JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI recommendations API request failed:', response.status, errorText);
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
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
    const prompt = `List main story missions for "${gameName}". Return ONLY JSON array: [{"id": 1, "title": "Name", "description": "Desc"}]. Include 15-20 missions. No extra text.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Game missions API request failed:', response.status, errorText);
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Safely extract JSON block
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error fetching missions:', error);
    return [];
  }
};
