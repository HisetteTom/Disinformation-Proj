export async function checkFact(claim) {
  // Utilisez votre propre clé API ici - assurez-vous qu'elle est activée pour l'API Fact Check Tools
  const API_KEY = "AIzaSyBP6vZo2Aeoz1ogzXibmGQCo8Tk49ozXiA";

  // Construction correcte de l'URL selon la documentation officielle
  const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(claim)}&key=${API_KEY}&languageCode=en`;

  try {
    console.log("Calling fact check API with URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API response:", data);

    if (data.claims && data.claims.length > 0) {
      return {
        found: true,
        result: data.claims[0],
        allResults: data.claims,
      };
    } else {
      return {
        found: false,
        message: "No fact checks found for this claim.",
      };
    }
  } catch (error) {
    console.error("Error checking facts:", error);
    return {
      found: false,
      error: error.message,
      message: "Error connecting to fact check service.",
    };
  }
}
