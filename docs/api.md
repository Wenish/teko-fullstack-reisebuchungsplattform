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
