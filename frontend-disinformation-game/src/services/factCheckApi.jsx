export async function checkFact(claim) {
  try {
    const response = await fetch('http://localhost:3001/api/factcheck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ claim })
    });

    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking fact:', error);
    throw error;
  }
}