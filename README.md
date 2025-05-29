# Projet Jeu de Désinformation

## Aperçu du Projet

Ce projet se compose de trois composants principaux :
- **Frontend** : Interface de jeu React construite avec Vite
- **Backend** : API Node.js/Express avec authentification Firebase
- **Backend Python** : Service de collecte et de traitement des données

## Prérequis

- Node.js (version 16 ou supérieure)
- Python 3.8+
- Accès au projet Firebase (invitation requise)

## Configuration Initiale Requise

### Accès au Projet Firebase

**IMPORTANT** : Contactez-moi par email ou Teams avec votre adresse Gmail pour être ajouté au projet Firebase. Une fois ajouté, vous aurez accès à :
- La configuration Firebase (pour le frontend)
- Les clés GCP (pour les services backend)
- Firestore Database
- Google Cloud Storage

## Installation

### 1. Configuration du Frontend

```bash
cd frontend-disinformation-game
npm install
```

**Récupération de la configuration Firebase :**
1. Connectez-vous à la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez le projet partagé
3. Allez dans **Settings** (icône d'engrenage) puis **General**
4. Dans la section "Your apps", trouvez l'application web
5. Copiez les valeurs de configuration

Créez un fichier `.env` dans le répertoire frontend avec :
```env
VITE_FIREBASE_API_KEY=votre_clé_api_firebase
VITE_FIREBASE_AUTH_DOMAIN=votre_domaine_auth
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

### 2. Configuration du Backend Node.js

```bash
cd backend-disinformation-game
npm install
```

Créez un fichier `.env` dans le répertoire backend avec :
```env
PORT=3001
FACT_CHECK_API_KEY="Votre fact check api"
NEWS_API_KEY="votre news api"
GCP_KEY_FILE="GCP_KEYS.json"

FIREBASE_API_KEY=votre_clé_api_firebase
FIREBASE_AUTH_DOMAIN=votre_domaine_auth
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_STORAGE_BUCKET=votre_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
FIREBASE_APP_ID=votre_app_id
```
#### Obtenir la clé NewsAPI

1. Allez sur [NewsAPI.org](https://newsapi.org/)
2. Cliquez sur "Get API Key"
3. Créez un compte gratuit
4. Confirmez votre email
5. Copiez votre clé API depuis le dashboard
6. Ajoutez-la dans le fichier `.env` comme `NEWS_API_KEY`

#### Obtenir la clé Google Fact Check Tools API

**Via le projet Firebase partagé**
Si vous êtes invité au projet Firebase, la clé Fact Check sera accessible via :
1. Console Google Cloud (même projet que Firebase)
2. APIs & Services > Credentials
3. Utilisez la clé API existante du projet

### 3. Configuration des Clés GCP

**Récupération des clés GCP via Firebase :**
1. Dans la Console Firebase, restez sur le même projet
2. Allez dans **Settings** > **Service accounts**
3. Cliquez sur **Generate new private key**
4. Téléchargez le fichier JSON

Placez ce fichier dans :
- `backend-disinformation-game/GCP_KEYS.json`
- `python-backend/GCP_KEYS.json`

### 4. Configuration du Backend Python

```bash
cd python-backend
pip install -r requirements.txt
```

Créez un fichier `config.ini` :
```ini
[X]
username = username_Twitter   
password = password_Twitter
email = email_Twitter
```

## Démarrage de l'Application

### 1. Démarrer le Backend Node.js

```bash
cd backend-disinformation-game
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

### 2. Démarrer le Frontend

```bash
cd frontend-disinformation-game
npm run dev
```

L'application frontend démarre sur `http://localhost:5173`

