# Deploy GIB2 til VM `tba4250s01.it.ntnu.no`

Komplett guide for å deploye dette prosjektet til NTNU-VM-en for gruppe 1.
Tilpasset vårt oppsett (HTTPS via nginx reverse proxy, port 5001 internt for
backend, etc.) - **ikke** identisk med guiden i `.github/docs/VIRTUAL_MACHINE.md`.

---

## Oversikt

```
                                                         ┌─ VM (tba4250s01) ─────────────────────┐
                                                         │                                       │
 Bruker (HTTPS) ─────────────────► port 443 ──► nginx ──┐│                                       │
                                                        ││  ┌────────────────────────────────┐  │
                                                        │└─►│  reverse proxy + TLS termin.   │  │
                                                        │   │   /        → client:80         │  │
                                                        │   │   /api/*   → server:5001       │  │
                                                        │   └────────────────────────────────┘  │
                                                        │                │                      │
                                                        │   ┌────────────┴───────┐              │
                                                        │   │ docker compose:    │              │
                                                        │   │   nginx (80/443)   │              │
                                                        │   │   client (intern)  │              │
                                                        │   │   server (intern)  │              │
                                                        │   │   db     (intern)  │              │
                                                        │   └────────────────────┘              │
                                                        └────────────────────────────────────────┘

 Lokal git push ──► GitHub Actions ──► Docker Hub ──► VM kjører `docker compose pull && up`
```

- **HTTPS-only**: Alt brukertrafikk går via `https://tba4250s01.it.ntnu.no` (port 443).
  Port 80 redirector til 443.
- **Sertifikat**: NTNU provisjonerer automatisk og fornyer
  `/root/tba4250s01.it.ntnu.no.{crt,key}` (gyldig GEANT TLS-cert, ingen warnings).
- **Reverse proxy**: nginx terminerer TLS og proxyer `/api/*` til backend og
  alt annet til frontend. Frontend, backend og DB er ikke eksponert direkte
  utad - kun nginx.
- **CI/CD**: GitHub Actions bygger images ved hver push til `main` og publiserer
  til Docker Hub. VM-en henter med `docker compose pull && up -d`.

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
| `POSTGRES_PASSWORD` | Sterkt **alfanumerisk** passord (KUN A-Z, a-z, 0-9 - se note under). Brukes som DB-passord på VM. |

> **Viktig**: Bruk KUN alfanumeriske tegn i `POSTGRES_PASSWORD`. Spesialtegn som
> `/`, `+`, `=` blir URL-encoded i `DATABASE_URL` (f.eks. `/` → `%2F`), og dette
> bryter alembic sin `configparser`-parsing. Generer med:
> `openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32`

**Variables** (Repository variables):

| Navn | Verdi |
|---|---|
| `BACKEND_BASE_URL` | `https://tba4250s01.it.ntnu.no/api` |
| `DOCKER_USERNAME` | Docker Hub-brukernavnet ditt fra 1.1 |
| `POSTGRES_DB_NAME` | `utstyrsoversikt` |
| `POSTGRES_USERNAME` | `postgres` |

> **NB om `BACKEND_BASE_URL`**: Den MÅ være `https://...` med `/api`-suffix
> (ikke `:5001`). Denne URL-en bakes inn i client-bygget som `VITE_BACKEND_BASE_URL`,
> og frontend bruker den som base for alle backend-kall. nginx på VM-en stripper
> `/api/`-prefixet før den proxyer til backend (`/api/foo` → `server:5001/foo`).

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

> Tips: Sett opp SSH-nøkkel-autentisering for å slippe å skrive passord
> hver gang. Kjør lokalt: `ssh-copy-id <brukernavn>@tba4250s01.it.ntnu.no`.

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

Eksponer port **80** (HTTP→HTTPS redirect) og **443** (HTTPS).

```bash
cd /etc/local/firewall.d

# IPv4
sudo tee ipv4-expose-docker-ports.conf > /dev/null <<'EOF'
-I DOCKER-USER -p tcp -m conntrack --ctorigdstport 80 -j permit_ntnu
-I DOCKER-USER -p tcp -m conntrack --ctorigdstport 443 -j permit_ntnu
EOF

# IPv6 (samme innhold)
sudo cp ipv4-expose-docker-ports.conf ipv6-expose-docker-ports.conf

sudo /local/admin/bin/install-firewall.sh

# Verifiser
sudo iptables -L DOCKER-USER -n -v | grep -E "(dpt:80|dpt:443)"
```

> Vi åpner KUN 80 og 443. Backend (5001) og DB (5432) er ikke eksponert utad
> - de er kun tilgjengelige via Docker-nettverket internt. Hvis du senere vil
> kunne koble til DB-en eksternt med f.eks. DBeaver, kan du legge til
> `--ctorigdstport 5432 -j permit_ntnu` i samme fil og kjøre install-scriptet
> på nytt.

### 2.5 Frigjør port 80

```bash
sudo ss -lptn 'sport = :80'      # se hva som bruker port 80
sudo systemctl stop apache2
sudo systemctl disable apache2
sudo ss -lptn 'sport = :80'      # skal nå være tom
```

### 2.6 Verifiser at SSL-sertifikatene finnes

NTNU provisjonerer automatisk sertifikater for VM-en til `/root/`:

```bash
sudo sh -c 'ls -la /root/tba4250s01.it.ntnu.no.*'
```

Du skal se to filer:
- `tba4250s01.it.ntnu.no.crt`
- `tba4250s01.it.ntnu.no.key`

Disse mountes inn i nginx-containeren read-only. Hvis de mangler, kontakt NTNU IT.

---

## Fase 3 — Deploy applikasjonen

### 3.1 Lag deploy-mappe på VM

```bash
mkdir -p ~/gib2-deploy && cd ~/gib2-deploy
```

### 3.2 Lag `docker-compose.yml`

Kopier hele innholdet fra [`deploy/docker-compose.yml`](./docker-compose.yml) i
repoet og lim inn på VM-en, f.eks.:

```bash
nano docker-compose.yml
# Lim inn, lagre med Ctrl+O, Enter, lukk med Ctrl+X.
```

### 3.3 Lag `nginx.conf`

Kopier hele innholdet fra [`deploy/nginx.conf`](./nginx.conf) i repoet og lim
inn:

```bash
nano nginx.conf
```

### 3.4 Lag tre env-filer

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
DATABASE_URL=postgresql+asyncpg://postgres:<sterkt-passord>@db:5432/utstyrsoversikt
JWT_SECRET_KEY=<32 tilfeldige bytes hex>
```

Generer JWT-key: `openssl rand -hex 32`

**`db.env`** (postgres-init):

```bash
nano db.env
```
```
POSTGRES_DB=utstyrsoversikt
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<samme passord som i DATABASE_URL over>
```

> **VIKTIG om passord**: `POSTGRES_PASSWORD` her, passordet i `DATABASE_URL`
> (`server.env`) og `POSTGRES_PASSWORD`-secret på GitHub MÅ være identiske.
> Bruk KUN alfanumeriske tegn (A-Z, a-z, 0-9) for å unngå URL-encoding-feil
> med alembic. Generer med:
> ```bash
> openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32
> ```

Sett rettigheter slik at andre brukere på VM-en ikke leser dem:

```bash
chmod 600 .env server.env db.env
```

### 3.5 Pull images og start

```bash
sudo docker compose pull
sudo docker compose up -d
sudo docker compose ps           # alle 4 (nginx/client/server/db) skal være Up
sudo docker compose logs -f
```

Vent til:
- `db` er `healthy`
- `server` er `Up (healthy)` (kan ta ~30 sek pga. seeding/grafer)
- `client` og `nginx` er `Up`

### 3.6 Verifiser

Fra VM-en (rask sanity check):

```bash
curl -v https://tba4250s01.it.ntnu.no/api/health
# Forventet: HTTP/2 200 + {"status":"ok","database":"connected"}

curl -I http://tba4250s01.it.ntnu.no
# Forventet: HTTP/1.1 301 Moved Permanently → Location: https://...
```

I nettleser (NTNU-nett/VPN):
- https://tba4250s01.it.ntnu.no — frontend (med 🔒 grønn lås, gyldig NTNU-cert)
- https://tba4250s01.it.ntnu.no/api/health — `{"status":"ok","database":"connected"}`
- https://tba4250s01.it.ntnu.no/api/docs — FastAPI Swagger UI

> Du skal IKKE få SSL warning. Sertifikatet er signert av en offentlig CA
> (GEANT) som alle nettlesere stoler på.

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

> Hvis du endrer `nginx.conf` eller `docker-compose.yml`, kopier den nye versjonen
> fra repoet inn på VM-en før du restarter. nginx-konfigen lastes inn ved start.

### Oppdater bare nginx-konfig (uten å restarte alle containere)

```bash
sudo docker compose restart nginx
```

---

## Eksterne tjenester

### Stadia Maps (frontend map tiles)

Stadia Maps bruker domain-basert autentisering. Etter deploy må du registrere
VM-domenet i Stadia-dashboardet for å unngå 401-feil på tile-requests:

1. Logg inn på https://client.stadiamaps.com/
2. Gå til ditt prosjekt → "Allowed origins / domains"
3. Legg til `https://tba4250s01.it.ntnu.no`
4. Vent ~2 min → reload frontend → tiles skal laste 200 OK

ArcGIS sine satellite tiles trenger ikke noe ekstra oppsett.

---

## Feilsøking

### Sjekk container-status
```bash
sudo docker compose ps
sudo docker compose logs nginx       # eller client / server / db
sudo docker compose logs -f server   # følg loggen i sanntid
```

### nginx feiler ved oppstart
- `sudo docker compose logs nginx` - syntaksfeil i `nginx.conf` vises tydelig.
- `sudo docker compose exec nginx ls -la /etc/nginx/certs/` - skal vise to filer
  (cert + key) read-only fra `/root/`. Hvis tom: cert-filer mangler eller
  permission feil.

### `curl: (7) Failed to connect ... port 443: Connection refused`
- Firewall: `sudo iptables -L DOCKER-USER -n -v | grep 443`. Hvis tom, kjør
  `sudo /local/admin/bin/install-firewall.sh` på nytt.

### `SSL certificate problem`
- Cert-mount feil i `docker-compose.yml`, eller cert-filene mangler i `/root/`.

### Server kommer ikke opp / 502 fra `/api/...`
- `sudo docker compose logs server --tail 50` - vanlig: alembic feiler pga.
  passord med spesialtegn i `DATABASE_URL`. Fix:
  1. `sudo docker compose down -v` (sletter DB-volume!)
  2. Lag nytt alfanumerisk passord (se 3.4-noten).
  3. Oppdater `db.env` + `server.env` med nytt passord.
  4. `sudo docker compose up -d`.
- Sjekk at `DATABASE_URL` peker på `@db:5432/...` (Docker-nettverket), ikke
  `localhost`.

### Frontend laster, men API-kall feiler
- Åpne DevTools → Network. Hvilken URL prøver fetcher å nå?
  - Hvis `http://localhost:5001` eller `http://...:5001` → image ble bygget
    med feil `BACKEND_BASE_URL`. Verifiser GitHub-variabelen står til
    `https://tba4250s01.it.ntnu.no/api` og kjør client-workflowen på nytt.
  - Hvis `https://tba4250s01.it.ntnu.no/api/...` men feiler med CORS → sjekk
    at https-origins er i `server/app/main.py`.
- Mixed content (`Blocked ... insecure ...`) → frontend prøver `http://`-API
  fra https-side. Samme fix som over.

### Ingen geolocation-prompt
- Geolocation API krever HTTPS i alle moderne nettlesere (unntatt på `localhost`).
  Hvis du ser nettsiden over `http://`, blir prompt aldri vist. Sjekk at URL-en
  starter med `https://` og at HTTP→HTTPS-redirect i nginx fungerer.

### Restart alt fra scratch (mister DB-data!)
```bash
sudo docker compose down -v
sudo docker compose up -d
```

### Restart uten å miste DB
```bash
sudo docker compose restart
```
