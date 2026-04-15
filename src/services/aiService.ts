export const getGameMissions = async (gameName: string): Promise<any[]> => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `List the main story missions/chapters for the game "${gameName}" in order. Return ONLY a JSON array like this: [{"id": 1, "title": "Mission name", "description": "Brief one-line description"}]. Include 15-20 missions. No extra text, no markdown, just the JSON array.`
        }]
      })
    });
    
    const data = await response.json();
    const text = data.content[0].text;
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Error fetching missions from Anthropic:', error);
    return [];
  }
};
