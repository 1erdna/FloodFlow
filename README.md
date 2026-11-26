# FloodFlow

Database and API collaboration project for flood reporting, street conditions, public advisories and assistance requests in Cagayan de Oro.

This repository is based on the [group repository](https://github.com/20240031676-bit/floodflowClone).

## Technology stack

- Node.js and Express
- MongoDB and mongosh
- Swagger UI / OpenAPI

## Repository structure

```text
database/floodflow_db.js              MongoDB collection validators and indexes
docs/ITCC14API_MojoGojo_Final.yaml   OpenAPI specification
server.js                           Express documentation server
package.json                        Dependencies and start command
```

## Getting started

Install Node.js and npm, then run:

```bash
git clone https://github.com/1erdna/FloodFlow.git
cd FloodFlow
npm ci
npm start
```

Open [Swagger UI](http://localhost:3000/api) in your browser.

## Database setup

### Windows automatic setup (recommended)

From the repository folder in PowerShell, preferably running as administrator:

```powershell
git pull --ff-only
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-mongodb.ps1 -InstallCompass
```

The script checks the local MongoDB connection, installs missing tools using Windows Package Manager, starts the default MongoDB service if needed, and runs `database/init-safe.js`. The safe script creates missing collections and indexes and does not drop existing collections or replace existing validators. Omit `-InstallCompass` if you do not need the GUI. Installer prompts may require approval. The execution policy option applies only to this PowerShell process.

### Manual setup (destructive reset)

Install MongoDB and mongosh. Start a local MongoDB instance before running:

```bash
mongosh "mongodb://127.0.0.1:27017" --file database/floodflow_db.js
```

**Warning:** The supplied initialization script drops the six existing collections in the `floodflow` database before recreating them. Run only against a disposable development database or after taking a backup. The script creates schemas and indexes, not sample records.

| Collection | Purpose |
| --- | --- |
| users | Commuter and administrator accounts |
| coverageareas | Barangay coverage |
| streets | Streets and road connections |
| floodreports | Flood observations and verification |
| advisories | Public warnings and announcements |
| assistancerequests | Emergency assistance requests |

## Implementation status

The current Express server hosts the Swagger documentation. The OpenAPI specification describes the intended API; the corresponding live routes and database connection still need implementation. Automated tests are not configured.

## Collaboration

Create a feature branch before making changes and submit a pull request for review. Do not commit credentials, environment files, or real personal records.
