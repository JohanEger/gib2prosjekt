## Working with the database locally

### Overview

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
