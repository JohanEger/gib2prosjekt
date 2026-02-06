## How to configure and use the Virtual Machine

### Connect to the VM with SSH

> [!NOTE]
> You have to be connected to a NTNU network to work with the VMs. You need to use a VPN if you want to work from a
> location other than NTNU. Read more about NTNU-VPNs [here](https://i.ntnu.no/wiki/-/wiki/norsk/installere+vpn).

```powershell
ssh <username>@tba4250s0x.it.ntnu.no
```

where `x` is the group number. You will have to enter the users NTNU-password. Write `yes` when prompted to add a
fingerprint.

### Install Docker Engine

This section follows the [Docker documentation](https://docs.docker.com/engine/install/ubuntu/). Start by uninstalling
all packages that may cause conflict by running the command

```powershell
sudo apt remove $( dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc | cut -f1 )
```

A fresh VM should show

```terminaloutput
tba4250s02:~$ sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc | cut -f1)
dpkg: no packages found matching docker.io
dpkg: no packages found matching docker-compose
dpkg: no packages found matching docker-compose-v2
dpkg: no packages found matching docker-doc
dpkg: no packages found matching podman-docker
dpkg: no packages found matching containerd
dpkg: no packages found matching runc
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
```

We will use `apt` to install docker in the following steps.

#### Set up the Docker's `apt` repository on the VM

1. `sudo apt update`
2. `sudo apt install ca-certificates curl`
3. `sudo install -m 0755 -d /etc/apt/keyrings`
4. `sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc`
5. `sudo chmod a+r /etc/apt/keyrings/docker.asc`
6. Add the repository to Apt sources. Use the command below
   ```powershell
   sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
   Types: deb
   URIs: https://download.docker.com/linux/ubuntu
   Suites: noble
   Components: stable
   Signed-By: /etc/apt/keyrings/docker.asc
   EOF
   ```
7. `sudo apt update`

#### Install the Docker packages

```powershell
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

To verify that Docker is running use: `sudo systemctl status docker`. If it is not running use:
`sudo systemctl start docker` Check the status again. If everything was done correctly then the output should be

```powershell
tba4250s02:~$ sudo systemctl status docker
● docker.service - Docker Application Container Engine
Loaded: loaded (/usr/lib/systemd/system/docker.service; enabled; preset: enabled)
Active: active (running) since Mon 2026-01-12 12: 48: 36 MET; 14s ago
TriggeredBy: ● docker.socket
Docs: https: //docs.docker.com
Main PID: 2214697 (dockerd)
Tasks: 10
Memory: 26.5M (peak: 27.0M)
CPU: 386ms
CGroup: /system.slice/docker.service
└─2214697 /usr/bin/dockerd -H fd: // --containerd =/run/containerd/containerd.sock

Jan 12 12: 48:35 tba4250s02.it.ntnu.no dockerd[2214697]: time = "2026-01-12T12:48:35.925048903+01:00" level =info msg = "Restoring containers: start."
Jan 12 12: 48: 35 tba4250s02.it.ntnu.no dockerd[2214697]: time = "2026-01-12T12:48:35.967026979+01:00" level = info msg = "Deleting nftables IPv4 rules" error= "exi>
Jan 12 12:48:35 tba4250s02.it.ntnu.no dockerd[2214697]: time="2026-01-12T12: 48: 35.988164867+01: 00" level=info msg="Deleting nftables IPv6 rules" error="exi>
Jan 12 12: 48: 36 tba4250s02.it.ntnu.no dockerd[2214697]: time= "2026-01-12T12:48:36.301667185+01:00" level = info msg = "Loading containers: done."
Jan 12 12: 48: 36 tba4250s02.it.ntnu.no dockerd[2214697]: time = "2026-01-12T12:48:36.309681419+01:00" level = info msg = "Docker daemon" commit = 08440b6 containerd>
Jan 12 12: 48: 36 tba4250s02.it.ntnu.no dockerd[2214697]: time = "2026-01-12T12:48:36.309995142+01:00" level = info msg ="Initializing buildkit"
Jan 12 12: 48:36 tba4250s02.it.ntnu.no dockerd[2214697]: time = "2026-01-12T12:48:36.610275213+01:00" level =info msg = "Completed buildkit initialization"
Jan 12 12: 48: 36 tba4250s02.it.ntnu.no dockerd[2214697]: time = "2026-01-12T12:48:36.623138342+01:00" level = info msg = "Daemon has completed initialization"
Jan 12 12: 48: 36 tba4250s02.it.ntnu.no dockerd[2214697]: time= "2026-01-12T12:48:36.623357007+01:00" level = info msg = "API listen on /run/docker.sock"
Jan 12 12: 48: 36 tba4250s02.it.ntnu.no systemd[1]: Started docker.service - Docker Application Container Engine.
```

> [!NOTE]
> Read the Docker docs to find out more about commands. It is important to know that all Docker commands on our VMs have
> to be prefixed with `sudo`.

#### Add Docker to package sync

The NTNU-servers automatically delete all installed programs if they are not "whitelisted." To do so, navigate to
`/etc/pkgsync/` and create a new file named `required-packages-project-deployment`. It has to start with
`required-packages-*`. Add the following in the file you just created:

```dotenv
docker-ce
docker-ce-cli
docker-ce-rootless-extras
containerd.io
docker-buildx-plugin
docker-compose-plugin
```

To apply the changes run the following command:

```powershell
sudo /local/admin/bin/do_pkgsync.sh
```

### Configure firewall rules with Docker

```powershell
cd /etc/local/firewall.d
```

Create the files `ipv4-expose-docker-ports.conf` and `ipv6-expose-docker-ports.conf` and paste the following in **both**
files

```
-I DOCKER-USER -p tcp -m conntrack --ctorigdstport 80 -j permit_ntnu
-I DOCKER-USER -p tcp -m conntrack --ctorigdstport 5000 -j permit_ntnu
-I DOCKER-USER -p tcp -m conntrack --ctorigdstport 5432 -j permit_ntnu
```

These settings will expose `port 80` (frontend) to everyone, `port 5000` (backend) and `port 5432` (database) to people
connected to a NTNU network. After the files have been created run the script `install-firewall.sh` with the command

```powershell
sudo /local/admin/bin/install-firewall.sh
```

When you run `sudo iptables-save` and `sudo ip6tables-save` the following lines should now be present:

```terminaloutput
-A DOCKER-USER -p tcp -m conntrack --ctorigdstport 5432 -j permit_ntnu
-A DOCKER-USER -p tcp -m conntrack --ctorigdstport 5000 -j permit_ntnu
-A DOCKER-USER -p tcp -m conntrack --ctorigdstport 80 -j permit_ntnu
```

Finally, `port 80` have to be freed up. On the VM check if another process is using the port with

```powershell
sudo ss -lptn 'sport = :80'
```

You can proceed to the next step if no processes are using `port 80`. In most cases it will initially be used by
Apache2, and it can be disabled with the following commands

```powershell
sudo systemctl stop apache2
sudo systemctl disable apache2
```

To verify that it worked run `sudo ss -lptn 'sport = :80'` once more.

### Pull images on VM

> [!NOTE]
> It is not necessary, but it is recommended that you install Git on the VM for the following step. We are going to use
> a standalone `docker-compose.yml` file in its own repository to pull the latest images and deploy them. It is possible
> to create this file directly on the VM.

#### Installing Git and configuring deploy keys on the VM

##### Configure another repository for deployment

Use the [template repository](https://github.com/jathavaan/tba4250-gib-2-vm-template) to create a **new** repository
which is going to be used to handle deployments. This is the repository that will be cloned onto the VM, not the
repository with you actual source code.

##### Install Git with `apt`

```powershell
sudo apt install git-all
```

##### Setup SSH deploy key

Run `sudo ssh-keygen`. Save it the provided location and do not add a passphrase.

#### Clone the deployment repository on the VM

This is another repository that have to be created which
uses [this](https://github.com/jathavaan/tba4250-gib-2-vm-template) template repository. Follow steps described there.
