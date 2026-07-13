# Reisebuchungsplattform (Schulprojekt)

Minimale Fullstack-Reisebuchungsplattform als Monorepo:
- Backend: Python + Django + Django REST Framework
- API-Doku: Swagger (drf-spectacular)
- Frontend: React + TypeScript + TailwindCSS
- Datenbank: SQLite
- Auth: JWT ueber HttpOnly-Cookies mit Registrierung, Login, Refresh und Logout
- Zahlung: nur Simulation (unpaid -> paid)

## Monorepo-Struktur

- backend: Django REST API
- frontend: React Client
- docs: kurze Dokumentation

## Backend starten

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

Backend URLs:
- API Basis: http://127.0.0.1:8000/api/
- Swagger UI: http://127.0.0.1:8000/api/docs/
- OpenAPI Schema: http://127.0.0.1:8000/api/schema/

## Frontend starten

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:
- App: http://127.0.0.1:5173

## Tests ausfuehren

Backend Unit Tests:

```bash
cd backend
source .venv/bin/activate
python manage.py test
```

Frontend Unit Tests:

```bash
cd frontend
npm install
npm run test:run
```

## Kernfunktionen

- Angebote suchen und filtern (Typ, Ort, Preis, Bewertung)
- Benutzerregistrierung und Login ueber sichere Cookie-Session
- Buchung erstellen (nur fuer eingeloggte Benutzer)
- Zahlung simulieren
- Buchung stornieren mit einfacher Rueckerstattung (80 Prozent)

## Hinweis zur Einfachheit

Der Code ist bewusst einfach und lesbar gehalten:
- klare Modellstruktur
- wenige Schichten
- wenig Abstraktion
- gute Nachvollziehbarkeit fuer Unterricht und Demo
