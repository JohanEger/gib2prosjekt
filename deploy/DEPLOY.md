# Deploy GIB2 til VM `tba4250s01.it.ntnu.no`

Komplett guide for å deploye dette prosjektet til NTNU-VM-en for gruppe 1.
Tilpasset vårt oppsett (port 5001 for backend, etc.) - **ikke** identisk med
guiden i `.github/docs/VIRTUAL_MACHINE.md`.

---

## Oversikt

```
┌──────────────────┐  push    ┌────────────┐  pull    ┌────────────────────────┐
│ Lokal git repo   │ ───────► │ GitHub     │ ──┐      │ VM (tba4250s01)        │
│ (denne mappa)    │          │ Actions    │   │      │  ┌──────────────────┐  │
└──────────────────┘          └─────┬──────┘   │      │  │ docker compose   │  │
                                    │ build    │      │  │  - client (80)   │  │
                                    ▼          │      │  │  - server (5001) │  │
                              ┌──────────┐     │      │  │  - db    (5432)  │  │
                              │ Docker   │ ◄───┘      │  └──────────────────┘  │
                              │ Hub      │ ───────────►                        │
                              └──────────┘   pull     └────────────────────────┘
```

Frontend-image (nginx + ferdig-bygd React) og backend-image (FastAPI/uvicorn)
bygges av GitHub Actions ved hver push til `main`, og publiseres til Docker Hub.
VM-en kjører `docker compose pull && docker compose up -d` for å hente og kjøre
nyeste images.

---

## Fase 1 — Engangsoppsett (ca. 30 min)

### 1.1 Docker Hub-konto + Personal Access Token

Bare én i gruppen trenger dette - alle bruker samme Docker Hub-bruker for image-publisering.

1. Gå til https://hub.docker.com/ → "Sign Up" (eller "Sign In" hvis du har konto).
2. Bekreft e-post.
3. Account Settings → **Personal access tokens** → "Generate new token".
   - Description: `TBA4250 GIB 2`
   - Access permissions: **Read & Write**
   - Klikk Generate.
4. **Kopier tokenet med en gang** - det vises bare denne ene gangen.

### 1.2 GitHub repository — Secrets og Variables

I GitHub-repoet: *Settings → Secrets and variables → Actions*

**Secrets** (Repository secrets):

| Navn | Verdi |
|---|---|
| `DOCKER_ACCESS_TOKEN` | PAT-en fra 1.1 |
| `POSTGRES_PASSWORD` | Velg et sterkt passord. Brukes som DB-passord på VM. **NB: dette er i dag ikke faktisk i bruk i workflow-en, men opprett det likevel.** |

**Variables** (Repository variables):

| Navn | Verdi |
|---|---|
| `BACKEND_BASE_URL` | `http://tba4250s01.it.ntnu.no:5001` |
| `DOCKER_USERNAME` | Docker Hub-brukernavnet ditt fra 1.1 |
| `POSTGRES_DB_NAME` | `gib2db` |
| `POSTGRES_USERNAME` | `app` |

**Sett repoet til public** (`Settings → General → Danger Zone → Change visibility`).

### 1.3 Bygg og publiser images

I repoet: *Actions*-fanen.

1. Velg **"Build and publish client image to docker registry"** → "Run workflow" → branch `main` → Run.
2. Velg **"Build and publish server image to docker registry"** → samme prosedyre.

Vent til begge er grønne (~5-10 min hver).

Verifiser på https://hub.docker.com/u/<DOCKER_USERNAME> at det er to nye repoer:
- `tba4250-gib-2-client`
- `tba4250-gib-2-server`

Sett begge til **Public** (Repository → Settings → Visibility).

---

## Fase 2 — Førstegangs-oppsett av VM

### 2.1 Tilkobling

Krever NTNU-nett (eduroam) eller [NTNU VPN](https://i.ntnu.no/wiki/-/wiki/norsk/installere+vpn).

```bash
ssh <ntnu-brukernavn>@tba4250s01.it.ntnu.no
```

Skriv `yes` på fingerprint-prompt, deretter NTNU-passord.

> Får du "Permission denied"? Da har du sannsynligvis ikke blitt lagt til på
> VM-en enda. Kontakt læringsassistent/faglærer.

### 2.2 Installer Docker Engine

Følger Docker sin offisielle Ubuntu-guide.

```bash
# Fjern eventuelle konfliktende pakker (skal være tom på fersk VM)
sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc | cut -f1)

# Sett opp Dockers apt-repo
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update

# Installer Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verifiser
sudo systemctl status docker     # skal være "active (running)"
```

### 2.3 Whitelist Docker-pakker mot pkgsync

NTNU-VM-er sletter ikke-whitelistede pakker periodisk. Forhindre dette:

```bash
sudo tee /etc/pkgsync/required-packages-project-deployment > /dev/null <<EOF
docker-ce
docker-ce-cli
docker-ce-rootless-extras
containerd.io
docker-buildx-plugin
docker-compose-plugin
EOF

sudo /local/admin/bin/do_pkgsync.sh
```

### 2.4 Firewall

Eksponer portene vi bruker:

```bash
cd /etc/local/firewall.d

# IPv4
sudo tee ipv4-expose-docker-ports.conf > /dev/null <<'EOF'
-I DOCKER-USER -p tcp -m conntrack --ctorigdstport 80 -j permit_ntnu
-I DOCKER-USER -p tcp -m conntrack --ctorigdstport 5001 -j permit_ntnu
-I DOCKER-USER -p tcp -m conntrack --ctorigdstport 5432 -j permit_ntnu
EOF

# IPv6 (samme innhold)
sudo cp ipv4-expose-docker-ports.conf ipv6-expose-docker-ports.conf

sudo /local/admin/bin/install-firewall.sh

# Verifiser
sudo iptables-save | grep DOCKER-USER
```

> Port 80 åpen for alle (frontend), port 5001 og 5432 kun for NTNU-nett (backend + DB).

### 2.5 Frigjør port 80

```bash
sudo ss -lptn 'sport = :80'      # se hva som bruker port 80
sudo systemctl stop apache2
sudo systemctl disable apache2
sudo ss -lptn 'sport = :80'      # skal nå være tom
```

---

## Fase 3 — Deploy applikasjonen

### 3.1 Lag deploy-mappe på VM

```bash
mkdir -p ~/gib2-deploy && cd ~/gib2-deploy
```

### 3.2 Lag `docker-compose.yml`

Kopier innholdet fra `deploy/docker-compose.yml` i repoet (f.eks. via `nano docker-compose.yml` og lim inn).

### 3.3 Lag tre env-filer

**`.env`** (compose-substitusjon - leses automatisk av `docker compose`):

```bash
nano .env
```
```
DOCKER_USERNAME=<ditt-dockerhub-brukernavn>
```

**`server.env`** (backend runtime):

```bash
nano server.env
```
```
DATABASE_URL=postgresql+asyncpg://app:<sterkt-passord>@db:5432/gib2db
JWT_SECRET_KEY=<32 tilfeldige bytes hex>
```

Generer JWT-key: `openssl rand -hex 32`

**`db.env`** (postgres-init):

```bash
nano db.env
```
```
POSTGRES_DB=gib2db
POSTGRES_USER=app
POSTGRES_PASSWORD=<samme passord som i DATABASE_URL over>
```

> Viktig: `POSTGRES_PASSWORD` her, passordet i `DATABASE_URL` (`server.env`) og
> `POSTGRES_PASSWORD`-secret på GitHub MÅ være identiske.

Sett rettigheter slik at andre brukere på VM-en ikke leser dem:

```bash
chmod 600 .env server.env db.env
```

### 3.4 Pull images og start

```bash
sudo docker compose pull
sudo docker compose up -d
sudo docker compose logs -f
```

Vent til server-loggen viser at den lytter på 5001 og DB er klar.

### 3.5 Verifiser

I nettleser (NTNU-nett/VPN):
- http://tba4250s01.it.ntnu.no — frontend
- http://tba4250s01.it.ntnu.no:5001/health — `{"status":"ok","database":"connected"}`
- http://tba4250s01.it.ntnu.no:5001/docs — FastAPI Swagger UI

---

## Fase 4 — Oppdateringer i fremtiden

Når du pusher kode-endringer til `main`:

1. GitHub Actions bygger nye images automatisk (~5-10 min).
2. På VM-en:
   ```bash
   cd ~/gib2-deploy
   sudo docker compose pull
   sudo docker compose up -d
   ```

Det er det. Ingen down-time utover noen sekunder mens containere restartes.

---

## Feilsøking

### Sjekk container-status
```bash
sudo docker compose ps
sudo docker compose logs server      # eller client / db
sudo docker compose logs -f server   # følg loggen i sanntid
```

### Server kommer ikke opp
- Sjekk at `DATABASE_URL` i `server.env` peker på `@db:5432/...` (ikke localhost).
- Sjekk at passord matcher mellom `server.env` og `db.env`.
- `sudo docker compose logs db` for å se om Postgres startet ok.

### Frontend laster, men API-kall feiler
- Åpne DevTools → Network. Hvilken URL prøver fetcher å nå?
  - Hvis `http://localhost:5001` → image ble bygget med feil `BACKEND_BASE_URL`.
    Verifiser GitHub-variabelen og kjør client-workflowen på nytt.
  - Hvis `http://tba4250s01.it.ntnu.no:5001` men feiler → sjekk firewall + at backend kjører.
- Sjekk CORS i `server/app/main.py` (origins-listen).

### Restart alt fra scratch (mister DB-data!)
```bash
sudo docker compose down -v
sudo docker compose up -d
```

### Restart uten å miste DB
```bash
sudo docker compose restart
```
