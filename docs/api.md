# API Kurzuebersicht

Die komplette REST-Dokumentation ist ueber Swagger verfuegbar:
- http://127.0.0.1:8000/api/docs/

Wichtige Endpunkte:
- POST /api/auth/register/
- POST /api/auth/login/
- POST /api/auth/refresh/
- POST /api/auth/logout/
- GET /api/auth/csrf/
- GET /api/auth/me/
- GET /api/offers/
- GET /api/offers/{id}/
- GET /api/bookings/
- POST /api/bookings/
- POST /api/bookings/{id}/pay/
- POST /api/bookings/{id}/cancel/

Auth-Hinweis:
- Auth erfolgt ueber HttpOnly-JWT-Cookies; fuer schreibende Requests wird ein CSRF-Token erwartet.
- Angebote unter /api/offers/* sind oeffentlich.

## Sicherheit und Testen

Automatisierte Security-Tests sind im Projekt enthalten.

Abgedeckte Angriffe/Risiken:
- XSS (Cross-Site Scripting): Payloads wie `<script>...` und HTML-Event-Handler werden als normaler Text behandelt.
- SQLi (SQL Injection): SQLi-aehnliche Eingaben in Filter- und Form-Felder fuehren zu keiner SQL-Ausfuehrung.
- Funktionales Risiko (aus Analyse): Unbefugter Zugriff auf fremde Buchungen (IDOR) ist blockiert.

Umgesetzte Testbereiche:
- Backend (Django): `backend/api/tests.py`
- Frontend (Vitest/RTL): `frontend/src/pages/OffersPage.test.tsx`, `frontend/src/components/Header.test.tsx`

Wichtige Nachweise:
- IDOR: User B kann `GET/POST` auf Buchungen von User A nicht ausfuehren (404).
- SQLi: Payloads in numerischen Offer-Filtern erzeugen keinen Serverfehler und liefern leere Treffer statt Umgehung.
- XSS: Boesartige Strings werden in API und React-UI als Text dargestellt, nicht als HTML ausgefuehrt.

Tests ausfuehren:
- Backend: `cd backend && .venv/bin/python manage.py test api.tests`
- Frontend: `cd frontend && npm run test:run`
