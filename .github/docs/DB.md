# Working with the database locally

## Overview

The project uses **PostgreSQL with PostGIS** running inside Docker.  
This ensures that all team members use the exact same database version and spatial configuration.

The database runs as a separate Docker service and is automatically configured using SQL initialization scripts located in [01_init](/db/init/01_init.sql).
PostGIS is enabled automatically when the database container is initialized.

## Environment variables

Database credentials are defined in the `.env` file located inside the `db/` folder.

Each team member must create this file before starting the database.

## Starting the database

From the project root, run:

```powershell
docker compose up -d db
````

To start all services (recommended during development):

```powershell
docker compose up --build
```

To verify that the container is running:

```powershell
docker ps
```

## Connection details

When running locally, the database is available at:

| Setting   | Value |
|-----------|-------|
| Host      | `localhost` |
| Port      | `5823` |
| Database  | `utstyrsoversikt` |
| Username  | `postgres` |
| Password  | Defined in `.env` |

You can connect using DBeaver or via terminal inside the container.

## Verifying PostGIS

To connect via Docker:

```powershell
docker exec -it my_postgis psql -U postgres -d utstyrsoversikt
```

Inside `psql`, run:

```sql
SELECT PostGIS_Version();
```

If a version is returned, PostGIS is working correctly.

Exit with:

```sql
\q
```


## Important: Initialization behavior

> [!WARNING]
> SQL files in `db/init/` are only executed when the database volume is created for the first time.

If you:

- Change database credentials
- Modify init scripts
- Change `POSTGRES_DB`
- Encounter unexpected database state

You must reset the volume:

```powershell
docker compose down -v
docker compose up --build
```

This will delete the database and recreate it.

# Database migrations (Alembic)

## Overview

We use **Alembic** to manage database schema changes in a version-controlled and reproducible way.

All migrations are executed **inside the `server` Docker container**, ensuring that all team members use the same Python environment and dependencies.

After the database is initialized, **all schema changes must be done through Alembic migrations** — not by manually editing SQL init scripts.

## Prerequisites

Make sure the database container is running and healthy:

```powershell
docker compose up -d db
docker compose ps
```

To start the full development environment:

```powershell
docker compose up --build
```

## Project structure

Alembic files are located inside the `server` service:

```YAML
server/
├── alembic/
│   ├── versions/        # Generated migration files
│   └── env.py           # Migration configuration
└── alembic.ini          # Alembic configuration file
```

If these files do not appear in your IDE, ensure that the `server` container mounts the correct volume in [docker-compose.yml](/docker-compose.yml).:

```YAML
volumes:
    - ./server:/app
```

Mounting the entire repository `(.:app)` can cause Python import issues such as: `ModuleNotFoundError: No module named 'app'`

## Enviroment configuration

Alembic uses the same `DATABASE_URL` as the backend application. Ensure that `server/.env` contains this.

## Creating a migration

After modifying SQLAlchemy models, run:

```powershell
docker compose exec server alembic revision --autogenerate -m "describe change"
```

This generates a new migration file in `server/alembic/versions`

**Always review the generated migration file before applying it.**
Check especially:

- Dropped columns
- Renamed columns (Alembic may detect these as drop + add)
- Constraints and indexes
- PostGIS geometry columns

## Applying migrations

To apply all pending migrations:

```powershell
docker compose exec server alembic upgrade head
```

## Rolling back a migration

To undo the most recent migration:

```powershell
docker compose exec server alembic downgrade -1
```

To downgrade a specific revision:

```powershell
docker compose exec server alembic downgrade <revision_id>
```

## Check migration status

Show current database revision:

```powershell
docker compose exec server alembic current
```

Show migration history:

```powershell
docker compose exec server alembic history --verbose
```

## Development workflow summary

1. Modify SQLAlchemy models
2. Generate migration:

```powershell
docker compose exec server alembic revision --autogenerate -m "message"
```

3. Review migration file
4. Apply migration:

```powershell
docker compose exec server alembic upgrade head
```

5. Commit migration file to Git