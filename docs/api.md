# API Kurzuebersicht

Die komplette REST-Dokumentation ist ueber Swagger verfuegbar:
- http://127.0.0.1:8000/api/docs/

Wichtige Endpunkte:
- POST /api/auth/register/
- GET /api/auth/me/
- GET /api/offers/
- GET /api/offers/{id}/
- GET /api/bookings/
- POST /api/bookings/
- POST /api/bookings/{id}/pay/
- POST /api/bookings/{id}/cancel/

Auth-Hinweis:
- Endpunkte unter /api/bookings/* und /api/auth/me/ erwarten HTTP Basic Auth.
- Angebote unter /api/offers/* sind oeffentlich.
