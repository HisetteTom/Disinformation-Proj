import requests
import json

def test_fact_check_api():
    # Utiliser la même clé API que dans votre application React
    api_key = "AIzaSyBP6vZo2Aeoz1ogzXibmGQCo8Tk49ozXiA"
    
    # Requête de test avec une affirmation connue pour avoir des fact-checks
    query = "vaccines cause autism"
    
    # Construction de l'URL
    url = f"https://factchecktools.googleapis.com/v1alpha1/claims:search"
    
    # Paramètres de la requête
    params = {
        "query": query,
        "key": api_key,
        "languageCode": "en"  # Essayons en anglais pour avoir plus de résultats
    }
    
    print(f"Sending request to: {url}")
    print(f"With parameters: {params}")
    
    # Envoi de la requête
    response = requests.get(url, params=params)
    
    print(f"Status code: {response.status_code}")
    
    # Vérifier si la requête a réussi
    if response.status_code == 200:
        # Afficher la réponse formatée
        data = response.json()
        print("\nAPI Response:")
        print(json.dumps(data, indent=2))
        
        if "claims" in data and data["claims"]:
            print("\nFound fact checks!")
            print(f"Number of fact checks: {len(data['claims'])}")
        else:
            print("\nNo fact checks found in the response.")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_fact_check_api()