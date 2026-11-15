# ECO Team Housekeeping Inspection App

## Included
- `index.html`: mobile-friendly inspection app.
- `manifest.webmanifest`: installable app metadata.
- `sw.js`: offline app-shell cache.
- `server-example.js`: small example sync receiver (demonstration only).

## Checklist included from the uploaded Mahoora form
Living Area: Door lock / No Gaps; Power supply light and switches; Fan; Room is clean - walls / floor and other items; All items are in the right place; Curtains.
Bedroom: Beds made; Other items in the right place; Linen clean and neat.
Washroom: Clean and dust free; Shower area; No leaks / no water.
General: Safety booklet in place; ECO cream hung; All carpets in place; Bino / Raincoats / umbrellas.
Outside: Chairs, table rack / carpets / other; Floor sheet is clean; Fly sheets are good.

Each item can be marked OK, Issue, or N/A and has a comment field.

## Important: multi-phone sync
Offline saving works independently on each phone. **Multiple phones do not share data automatically just because they have this app.** To share records, all phones must be configured to send records to the same HTTPS sync server. The app's Sync settings lets you enter that API URL and optional access key.

The included `server-example.js` is a minimal demonstration receiver, not a production-ready service. Before using with real guest/staff data, deploy a secured HTTPS backend with authentication, backups, access controls, and a proper database. A hosting provider/server is not included in this package.

## Run / install
1. Upload this folder to an HTTPS website or internal HTTPS server.
2. Open the site in Chrome on each phone while online once.
3. Use the browser menu → **Add to Home screen** / **Install app**.
4. Open the app; inspections are stored in that phone's IndexedDB and remain available offline.
5. When a shared backend is deployed, open **Sync settings** on every phone and enter the same API URL (and access key if used).
6. Use **Sync now** or reconnect to the internet; pending records are posted to the server.

For local testing on a computer, run a local web server in this folder (for example `python -m http.server 8000`) and open `http://localhost:8000`. Service workers require HTTPS in normal use, with localhost allowed for testing.

## CSV
Use **Export CSV** to export inspection details from the current device. The export is useful for opening in Excel.

## Sync API contract
The app sends one JSON inspection per POST to the configured URL. The server should accept `Content-Type: application/json`, optionally validate `Authorization: Bearer <key>`, and return any 2xx response only after the record has been stored durably. Use the inspection `id` as a unique key so retries do not create duplicates.
