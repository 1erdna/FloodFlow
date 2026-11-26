# FloodFlow CDO

Database and API collaboration project for flood reporting, street conditions, advisories, and assistance requests in Cagayan de Oro.

**Stack:** Node.js, Express, MongoDB, Swagger/OpenAPI.

## Setup

```bash
git clone https://github.com/1erdna/FloodFlow.git
cd FloodFlow
npm ci
```

Set up MongoDB on Windows (PowerShell):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-mongodb.ps1 -InstallCompass
```

Start the server with `npm start` and open [Swagger UI](http://localhost:3000/api).

## Testing

```bash
node --test tests/schema.test.js
mongosh "mongodb://127.0.0.1:27017" --file tests/database-integration.js
```

**Milestone 3:** 9 unit tests and 7 database integration tests passed on November 26, 2026. Two API integration tests remain blocked pending live routes.

**Note:** Use `database/init-safe.js` for non-destructive initialization. The original `database/floodflow_db.js` resets existing collections.

[Group repository](https://github.com/20240031676-bit/floodflowClone)
