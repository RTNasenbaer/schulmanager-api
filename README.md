# 🚀 Schulmanager Backend API

Backend-Service für die Schulmanager Alexa-Integration. Dieser Service ist verantwortlich für:
- Web-Scraping von Schulmanager-Online.de
- Authentifizierung und Session-Management
- Datenverarbeitung und Normalisierung
- REST-API für Alexa-Skill und Web-Dashboard
- Caching für Performance-Optimierung

## 🛠️ Technologie-Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Sprache**: TypeScript
- **Web Scraping**: Puppeteer
- **Caching**: node-cache
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest

## 📋 Voraussetzungen

- Node.js >= 18.0.0
- Yarn >= 1.22.0
- Schulmanager-Online Account

## 🚀 Installation

```bash
# Dependencies installieren
yarn install

# Environment-Datei erstellen
cp .env.example .env

# .env-Datei mit eigenen Werten ausfüllen
```

## 🔧 Konfiguration

Bearbeite die `.env`-Datei und setze folgende Werte:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=dein-geheimes-jwt-secret
API_KEY=api-key-für-alexa-skill
ENCRYPTION_KEY=32-zeichen-lang-encryption-key
```

## 🎯 Development

```bash
# Development-Server starten (mit Hot-Reload)
yarn dev

# TypeScript kompilieren
yarn build

# Production-Server starten
yarn start
```

## 🧪 Testing

```bash
# Alle Tests ausführen
yarn test

# Tests im Watch-Mode
yarn test:watch

# Test-Coverage generieren
yarn test:coverage
```

## 📝 Code-Qualität

```bash
# Linting
yarn lint

# Linting mit Auto-Fix
yarn lint:fix

# Code formatieren
yarn format
```

## 📚 API-Endpoints

### Authentication
- `POST /api/auth/register` - Neuen User registrieren
- `POST /api/auth/login` - User Login
- `POST /api/auth/logout` - User Logout
- `GET /api/auth/verify` - Token verifizieren

### Timetable
- `GET /api/timetable/today` - Stundenplan für heute
- `GET /api/timetable/tomorrow` - Stundenplan für morgen
- `GET /api/timetable/date/:date` - Stundenplan für bestimmtes Datum
- `GET /api/timetable/week` - Stundenplan für aktuelle Woche

### Substitutions
- `GET /api/substitutions/today` - Vertretungen für heute
- `GET /api/substitutions/tomorrow` - Vertretungen für morgen
- `GET /api/substitutions/date/:date` - Vertretungen für bestimmtes Datum

### User
- `GET /api/user/settings` - User-Einstellungen abrufen
- `PUT /api/user/settings` - User-Einstellungen aktualisieren
- `POST /api/user/schulmanager` - Schulmanager-Credentials speichern

## 🔐 Sicherheit

- JWT-basierte Authentifizierung
- Verschlüsselte Speicherung von Schulmanager-Credentials
- Rate-Limiting für API-Endpoints
- Helmet.js für HTTP-Security-Headers
- CORS-Konfiguration

## 📦 Projekt-Struktur

```
backend-api/
├── src/
│   ├── controllers/    # Route Handler
│   ├── services/       # Business Logic
│   ├── models/         # Data Models
│   ├── utils/          # Utility Functions
│   ├── middleware/     # Express Middleware
│   ├── routes/         # API Routes
│   ├── config/         # Configuration
│   └── app.ts          # Express App Setup
├── tests/              # Tests
├── package.json
└── tsconfig.json
```

## 🐛 Troubleshooting

### Problem: Puppeteer startet nicht
```bash
# Linux: Chrome Dependencies installieren
sudo apt-get install -y chromium-browser
```

### Problem: Port bereits in Verwendung
```bash
# Ändere PORT in .env zu einem anderen Wert (z.B. 3001)
```

## 📄 Lizenz

MIT

## 👨‍💻 Entwickler

Finn Martin
