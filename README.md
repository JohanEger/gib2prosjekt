# TBA4250 GIB 2 Template project

> [!NOTE]
> This is a template project that configures a React + Vite frontend, Python FastAPI backend with a PostgreSQL database.
> The project can be used as a template for the project in TBA4250 GIB 2.

The following resources can be found in this repository

- [How to work with the client/frontend](/.github/docs/CLIENT.md)
- [How to work with the server/backend](/.github/docs/SERVER.md)
- [How to configure automated deployments in the GitHub repository](/.github/docs/CI-CD.md)
- [How to use the virtual machine (VM)](/.github/docs/VIRTUAL_MACHINE.md)

There is also another template repository to pull the published images on the VM. It can be
found [here](https://github.com/jathavaan/tba4250-gib-2-vm-template).

### Setup

There is a [`docker-compose.yml`](./docker-compose.yml) in the root directory of the project. Files related to the
frontend can be found in the [client](./client)-directory, and the backend source code is in the [server](./server)
-directory.

#### Environment files

We will use env-files to ensure that secrets are not published. These files are ignored in the [
`.gitignore`](./.gitignore). The directories `client` and `server` will have one env-file each. Both these files have to
be named `.env`. developer have to create this as this defines the local credentials on their computer.

`server/.env` contains database connection credentials and looks something like this.

```.dotenv
POSTGRES_DB=templatedb
POSTGRES_USER=app
POSTGRES_PASSWORD=my-secret-password-123
```

These credentials can and should be changed to something secure. The `client/.env` only really holds the backend base
URL.

```dotenv
VITE_BACKEND_BASE_URL=http://localhost:5000
```

To be able to access environment variables in a Vite app all variables have to be prefixed with `VITE_` in the env-file.

BOM is a common cause for bugs when working with YAML- and env-files, and it is therefore important to remove it before
building Docker images.

#### Running the project on Docker

> [!NOTE]
> Install docker on your local machine. Follow the installation guide
> for [Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
> and [MacOS](https://docs.docker.com/desktop/setup/install/mac-install/).

Whilst in the root directory run `docker-compose up -d` in the terminal. This will start all containers defined in the
`docker-compose` file. This assumes that Docker has been installed and configured on the computer.

### Database

It is recommended to use a database management tool to connect to the database and view the data. Feel free to use
whatever suits your needs. There are some listed below:

- pgAdmin (created for PostgreSQL)
- DBeaver
- SQL Server Management Studio
- Most IDEs have built in (or extensions) for databases, and these work perfectly fine.