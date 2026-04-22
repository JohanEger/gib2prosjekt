# TBA4250 GIB 2 - GriffGear

This is a project for the course TBA4250 at NTNU. The aim of the project is to develop a GIS-based web application. 

For this project we have developed a solution for tracking, booking and registering equipment owned by non-governmental organizations.

> [!NOTE]
> This is a project that configures a React + Vite frontend, Python FastAPI backend with a PostgreSQL/PostGIS database based on the [template project](https://github.com/jathavaan/tba4250-gib-2-template.git/) published by jathavaan.

The application is deployed and available at **https://tba4250s01.it.ntnu.no** (requires NTNU network or VPN).

The following resources can be found in this repository

- [How to work with the client/frontend](/.github/docs/CLIENT.md)
- [How to work with the server/backend](/.github/docs/SERVER.md)
- [How to configure automated deployments in the GitHub repository](/.github/docs/CI-CD.md)
- [How to use the virtual machine (VM)](/.github/docs/VIRTUAL_MACHINE.md) — original NTNU template guide
- **[How we deploy this project to the NTNU VM](/deploy/DEPLOY.md)** — our actual production deployment guide
- [How to work with the database](/.github/docs/DB.md)


### Setup

There is a [`docker-compose.yml`](./docker-compose.yml) in the root directory of the project for local development. Files related to the
frontend can be found in the [client](./client)-directory, and the backend source code is in the [server](./server)
-directory. The [`deploy/`](./deploy/) directory contains the configuration used for the production deployment on the NTNU VM.

#### Environment files

We will use env-files to ensure that secrets are not published. These files are ignored in the [
`.gitignore`](./.gitignore). The directories `db`, `client` and `server` will have one env-file each. All of these files have to
be named `.env`. Developers have to create these as they define the local credentials on their computer.

`server/.env` contains database connection URL and looks something like this.

```.dotenv
DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/db_name
JWT_SECRET_KEY=secret_key
```

Generate a 32 byte key using openssl:
```bash
openssl rand -hex 32
```

`db/.env` contains connection credentials and looks something like this.

```.dotenv
POSTGRES_DB=utstyrsoversikt
POSTGRES_USER=postgres
POSTGRES_PASSWORD=my-secret-password-123
```

These credentials can and should be changed to something secure. The `client/.env` only really holds the backend base
URL.

```dotenv
VITE_BACKEND_BASE_URL=http://localhost:5001
```

> Backend runs on **port 5001**, not 5000. On macOS port 5000 is reserved by the AirPlay Receiver service.

To be able to access environment variables in a Vite app all variables have to be prefixed with `VITE_` in the env-file.

BOM is a common cause for bugs when working with YAML- and env-files, and it is therefore important to remove it before
building Docker images.

#### Running the project on Docker

> [!NOTE]
> Install docker on your local machine. Follow the installation guide
> for [Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
> and [MacOS](https://docs.docker.com/desktop/setup/install/mac-install/).

Whilst in the root directory run `docker compose up -d` in the terminal. This will start all containers defined in the
`docker-compose.yml` file. This assumes that Docker has been installed and configured on the computer.

After starting, the services are reachable at:

- Frontend: http://localhost
- Backend: http://localhost:5001 (Swagger UI on `/docs`, healthcheck on `/health`)
- Database: `localhost:6543` (mapped from container's internal `5432`)

### Database

It is recommended to use a database management tool to connect to the database and view the data. Feel free to use
whatever suits your needs. There are some listed below:

- pgAdmin (created for PostgreSQL)
- DBeaver
- SQL Server Management Studio
- Most IDEs have built in (or extensions) for databases, and these work perfectly fine.

### Production deployment

The application is deployed to NTNUs virtual machine `tba4250s01.it.ntnu.no` via GitHub Actions
that automatically build and publish Docker images to Docker Hub on every push to `main`. On the
VM, four containers run behind an Nginx reverse proxy that handles HTTPS-termination using NTNUs
SSL certificate, exposing the app on `https://tba4250s01.it.ntnu.no`.

For the full deployment guide (initial VM setup, GitHub secrets, firewall rules, certificates,
troubleshooting, etc.), see [**`deploy/DEPLOY.md`**](./deploy/DEPLOY.md).
