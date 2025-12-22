Backend PHP (REST)
==================

Avvio rapido
------------
- Richiede PHP 8+.
- Da root progetto:
  ```bash
  php -S 127.0.0.1:8000 -t backend/api/public backend/api/public/index.php
  ```
- API esposte con base path `/api` (configurabile in `backend/api/config/config.php`).
- Autenticazione: header `Authorization: Bearer <token>` (token demo `operator-token-123` o `admin-token-123`); origini consentite in `security.allowed_origins`.

Endpoint principali
-------------------
- `GET /api/health` – ping.
- `GET /api/appointments` – lista appuntamenti.
- `GET /api/appointments/{id}` – dettaglio.
- `POST /api/appointments` – crea (JSON payload, `paziente_nome`, `cf` obbligatori).
- `PUT /api/appointments/{id}` – sostituisce record.
- `PATCH /api/appointments/{id}` – aggiorna parzialmente.
- `DELETE /api/appointments/{id}` – elimina.
- `GET /api/references/departments` – dipartimenti (riusa il JSON del frontend).
- `GET /api/references/cadastral` – dati catastali (riusa il JSON del frontend).

Note tecniche
-------------
- OOP e routing minimale (`App\Core\Router`), controller dedicati, servizi con validazione.
- Storage JSON file in `backend/api/storage/appointments.json` con seed all'avvio.
- CORS aperto configurabile (`config/config.php`).
