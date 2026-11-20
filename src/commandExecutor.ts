import type { KaliTool, ExecutionResult } from './types';

/**
 * Builds the shell command string from a tool definition and its parameters.
 * This is the exact command that a real backend would execute via `sudo -S`.
 */
export function buildCommand(
  tool: KaliTool,
  params: Record<string, string | boolean | number>,
  savePath: string
): string {
  const p = params;
  const sudo = `echo '$PASSWORD' | sudo -S `;

  switch (tool.id) {
    case 'nmap-recon': {
      const scanType = String(p.scanType || '').split(' ')[0];
      const parts = [sudo, 'nmap', scanType];
      if (p.osDetect) parts.push('-O');
      if (p.portRange) parts.push(`-p ${p.portRange}`);
      parts.push(String(p.target || ''));
      return parts.join(' ');
    }
    case 'nmap-vuln':
      return `${sudo}nmap --script ${p.script || 'vuln'} ${p.target}`;
    case 'searchsploit':
      return `searchsploit ${p.query}`;
    case 'theharvester':
      return `${sudo}theHarvester -d ${p.domain} -b ${p.source}`;
    case 'recon-ng':
      return `${sudo}recon-ng -r "${p.module}" -d ${p.domain}`;
    case 'dnsenum':
      return `${sudo}dnsenum ${p.domain}`;
    case 'masscan':
      return `${sudo}masscan ${p.target} -p${p.ports || '1-65535'} --rate=${p.rate || 1000} -oJ ${savePath}/masscan-results.json`;

    case 'nikto':
      return `${sudo}nikto -h ${p.target} -p ${p.port || 80} -o ${savePath}/nikto-report.txt`;
    case 'dirb':
      return `${sudo}gobuster dir -u ${p.url} -w ${p.wordlist} -x ${p.extensions}`;
    case 'enum4linux':
      return `${sudo}enum4linux -a ${p.target}`;
    case 'smbclient':
      return `${sudo}smbclient ${p.target} ${p.action || '-L'} -N`;

    case 'metasploit':
      return `${sudo}msfconsole -q -x "use ${p.module}; set RHOSTS ${p.target}; set LHOST ${p.lhost || '0.0.0.0'}; set LPORT ${p.lport || 4444}; run; exit"`;
    case 'sqlmap':
      return `${sudo}sqlmap -u "${p.url}" ${p.action} --level=${p.level} --risk=${p.risk} --batch`;
    case 'hydra': {
      const userPart = p.userList ? `-L ${p.userList}` : `-l ${p.user || 'admin'}`;
      return `${sudo}hydra ${userPart} -P ${p.passList} ${p.target} ${p.service} -o ${savePath}/hydra-${p.service}.txt`;
    }

    case 'john':
      return `${sudo}john ${p.wordlist ? `--wordlist=${p.wordlist}` : ''} ${p.format !== 'auto' ? `--format=${p.format}` : ''} ${p.hashfile}`;
    case 'hashcat': {
      const mode = String(p.mode || '0 (MD5)').split(' ')[0];
      const attackMode = String(p.attackMode || '0 (Straight)').split(' ')[0];
      return `${sudo}hashcat -m ${mode} -a ${attackMode} ${p.hashfile} ${p.wordlist}`;
    }
    case 'wordlists':
      return `${sudo}crunch ${p.minLen} ${p.maxLen} ${p.charset} -o ${savePath}/wordlist.txt`;

    case 'airmon-ng':
      return `${sudo}airmon-ng ${p.action} ${p.interface}`;
    case 'airodump-ng': {
      const parts = [sudo, 'airodump-ng'];
      if (p.band === 'a') parts.push('--band a');
      else if (p.band === 'bg') parts.push('--band bg');
      if (p.channel) parts.push(`-c ${p.channel}`);
      if (p.writeFile) parts.push(`-w ${savePath}/capture`);
      parts.push(p.interface);
      return parts.join(' ');
    }
    case 'aireplay-ng':
      return `${sudo}aireplay-ng --deauth ${p.count || 5} -a ${p.bssid} -c FF:FF:FF:FF:FF:FF ${p.interface}`;
    case 'aircrack-ng':
      return `${sudo}aircrack-ng -w ${p.wordlist} ${p.captureFile}`;
    case 'wifite':
      return `${sudo}wifite --iface ${p.interface} --${p.attackType}`;

    case 'wireshark-cli':
      return `${sudo}tshark -i ${p.interface} -a duration:${p.duration || 30} ${p.filter ? `-f "${p.filter}"` : ''} -w ${savePath}/capture.pcap`;
    case 'tcpdump':
      return `${sudo}tcpdump -i ${p.interface} -c ${p.count || 100} ${p.filter ? `"${p.filter}"` : ''} -w ${savePath}/tcpdump.pcap`;
    case 'ettercap':
      return `${sudo}ettercap -T -M ${p.attack} /${p.target1}// /${p.target2 || ''}//`;
    case 'responder':
      return `${sudo}responder -I ${p.interface} ${p.analyze ? '-A' : ''} -w ${savePath}/responder-logs`;

    case 'mimikatz':
      return `${sudo}mimikatz.exe "${p.action}"`;
    case 'ssh-connect':
      return `ssh ${p.keyFile ? `-i ${p.keyFile}` : ''} ${p.user}@${p.host} -p ${p.port || 22}`;
    case 'nfs-enumerate':
      return `${sudo}showmount -e ${p.target}`;

    case 'volatility':
      return `${sudo}volatility --profile=${p.profile} -f ${p.dumpFile} ${p.plugin}`;
    case 'binwalk':
      return `${sudo}binwalk ${p.extract ? '-e' : ''} ${p.file}`;
    case 'foremost':
      return `${sudo}foremost -i ${p.input} -t ${p.types} -o ${savePath}/foremost-output`;
    case 'strings':
      return `strings -n ${p.minLen || 4} ${p.file}`;

    case 'save-report':
      return `report-generator --format ${p.format} --output ${savePath}/report.${p.format} ${p.includeOutput ? '--include-output' : ''}`;
    case 'export-captures':
      return `export-captures --format ${p.format} --output ${savePath}/exports/`;

    default:
      return `${sudo}${tool.command}`;
  }
}

/**
 * Generates simulated terminal output for a given tool.
 * In production, this would be replaced by the real backend's stdout.
 */
export function generateSimulatedOutput(
  tool: KaliTool,
  params: Record<string, string | boolean | number>
): { output: string; summary: string; parsedTargets?: string[]; artifacts?: string[] } {
  const target = String(params.target || params.url || params.domain || params.host || params.bssid || 'target');
  const lines: string[] = [];
  let summary = '';
  let parsedTargets: string[] | undefined;
  let artifacts: string[] | undefined;

  switch (tool.id) {
    case 'nmap-recon':
      lines.push(
        `Starting Nmap 7.94 ( https://nmap.org )`,
        `Nmap scan report for ${target}`,
        `Host is up (0.00042s latency).`,
        ``,
        `PORT     STATE SERVICE      VERSION`,
        `22/tcp   open  ssh          OpenSSH 8.9p1 Ubuntu 3ubuntu0.1`,
        `80/tcp   open  http         Apache httpd 2.4.52`,
        `443/tcp  open  ssl/https    nginx 1.18.0`,
        `8080/tcp open  http-proxy   Jenkins 2.387.1`,
        ``,
        `Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel`,
        ``,
        `Nmap done: 1 IP address (1 host up) scanned in 8.12 seconds`,
      );
      summary = `Host ${target} is up. Found 4 open ports: 22 (SSH), 80 (HTTP/Apache), 443 (HTTPS/Nginx), 8080 (Jenkins). OS detected as Linux.`;
      parsedTargets = ['22', '80', '443', '8080'];
      break;
    case 'nmap-vuln':
      lines.push(
        `Starting Nmap 7.94 with --script vuln`,
        `Nmap scan report for ${target}`,
        `Host is up.`,
        ``,
        `PORT   STATE SERVICE`,
        `80/tcp open  http`,
        `| http-enum: `,
        `|   /admin/: Admin panel`,
        `|   /backup/: Backup directory`,
        `| http-slowloris-check: `,
        `|   VULNERABLE:`,
        `|   Slowloris DOS attack`,
        `|_  References: http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2007-6465`,
        ``,
        `Nmap done in 12.04 seconds`,
      );
      summary = `Found potential vulnerabilities on ${target}: Slowloris DoS (CVE-2007-6465), exposed /admin/ and /backup/ directories.`;
      break;
    case 'searchsploit':
      lines.push(
        `----------------------------------------------`,
        ` Exploit Database Search Results`,
        `----------------------------------------------`,
        `  Title                                          Path`,
        `----------------------------------------------`,
        ` Apache 2.4.49 - Path Traversal                 multiple/webapps/50383.py`,
        ` Apache 2.4.50 - RCE                            multiple/webapps/50406.sh`,
        `----------------------------------------------`,
      );
      summary = `Found 2 exploits matching "${params.query}". Both relate to Apache path traversal / RCE.`;
      break;
    case 'theharvester':
      lines.push(
        `*******************************************************************`,
        `*  theHarvester 4.6.0                                            *`,
        `*******************************************************************`,
        `[*] Target: ${params.domain}`,
        ``,
        `[*] Searching Google.`,
        `[+] Emails found:`,
        `   admin@${params.domain}`,
        `   info@${params.domain}`,
        `   support@${params.domain}`,
        `[+] Hosts found:`,
        `   mail.${params.domain}:185.199.108.1`,
        `   www.${params.domain}:185.199.108.2`,
        `   api.${params.domain}:185.199.108.3`,
      );
      summary = `Found 3 email addresses and 3 subdomains for ${params.domain}.`;
      parsedTargets = [`mail.${params.domain}`, `www.${params.domain}`, `api.${params.domain}`];
      break;
    case 'dnsenum':
      lines.push(
        `dnsenum ${params.domain}`,
        `Host's addresses:`,
        `${params.domain}.    300  IN  A  93.184.216.34`,
        `ns.${params.domain}.  300  IN  A  93.184.216.35`,
        `Name Servers:`,
        `ns1.${params.domain}`,
        `ns2.${params.domain}`,
        `Mail Servers:`,
        `mail.${params.domain}`,
        `Subdomains:`,
        `www.${params.domain}`,
        `dev.${params.domain}`,
        `staging.${params.domain}`,
      );
      summary = `Resolved ${params.domain} to 93.184.216.34. Found 2 NS, 1 MX, and 3 subdomains.`;
      break;
    case 'masscan':
      lines.push(
        `Starting masscan 1.3.2 ( https://github.com/robertdavidgraham/masscan )`,
        `Scanning ${params.target} [1-65535 ports]`,
        `Discovered open port 22/tcp on ${params.target}`,
        `Discovered open port 80/tcp on ${params.target}`,
        `Discovered open port 443/tcp on ${params.target}`,
        `Discovered open port 3389/tcp on ${params.target}`,
        `Masscan done: scanned in 4.98 seconds`,
      );
      summary = `Scanned ${params.target} at rate ${params.rate}/s. Found 4 open ports: 22, 80, 443, 3389.`;
      artifacts = [`${params.target}-scan.json`];
      break;
    case 'nikto':
      lines.push(
        `- Nikto v2.5.0`,
        `+ Target IP: ${target}`,
        `+ Target Port: ${params.port || 80}`,
        `+ Server: Apache/2.4.52`,
        `+ /admin/: Administration panel spotted.`,
        `+ /backup.zip: Backup file found.`,
        `+ /robots.txt: Contains 3 entries.`,
        `+ Server may leak inodes via ETag header.`,
        `+ OSVDB-3092: /backup/: Backup directory found.`,
        `+ 6545 items checked in 14.82 seconds`,
      );
      summary = `Scanned ${target}. Found admin panel, backup.zip, robots.txt, and potential ETag inode leak.`;
      break;
    case 'dirb':
      lines.push(
        `=====================================================`,
        `Gobuster v3.6`,
        `=====================================================`,
        `Url: ${params.url}`,
        `Wordlist: ${params.wordlist}`,
        `[+] Status: 200   [Size: 10918]  /admin`,
        `[+] Status: 200   [Size: 3402]   /login`,
        `[+] Status: 301   [Size: 312]    /images`,
        `[+] Status: 301   [Size: 312]    /css`,
        `[+] Status: 403   [Size: 287]    /server-status`,
        `=====================================================`,
        `Found 5 directories/files`,
      );
      summary = `Found 5 paths on ${params.url}: /admin, /login, /images, /css, /server-status (403).`;
      break;
    case 'enum4linux':
      lines.push(
        `Starting enum4linux v0.9.1`,
        ` ==========================`,
        `| Target Information |`,
        ` ==========================`,
        `Target ........... ${target}`,
        `Username ......... 'nobody'`,
        ``,
        `[*] Enumerating users`,
        `user:[admin] rid:[0x3e8]`,
        `user:[guest] rid:[0x3e9]`,
        `user:[root] rid:[0x3ea]`,
        `[*] Enumerating shares`,
        `\\IPC$    - IPC Service`,
        `\\admin$  - Remote Admin`,
        `\\C$      - Default share`,
      );
      summary = `Found 3 users (admin, guest, root) and 3 shares (IPC$, admin$, C$) on ${target}.`;
      break;
    case 'metasploit':
      lines.push(
        `[*] Starting persistent handler(s)...`,
        `[*] Started reverse TCP handler on ${params.lhost || '0.0.0.0'}:${params.lport || 4444}`,
        `[*] ${params.module} - Running against ${params.target}`,
        `[*] Sending stage (200774 bytes) to ${params.target}`,
        `[*] Meterpreter session 1 opened (${params.lhost}:${params.lport} -> ${params.target}:49158)`,
        `meterpreter > getuid`,
        `Server username: NT AUTHORITY\\SYSTEM`,
      );
      summary = `Exploitation successful. Meterpreter session opened with SYSTEM privileges on ${params.target}.`;
      break;
    case 'sqlmap':
      lines.push(
        `sqlmap/1.8 - automatic SQL injection`,
        `[!] legal disclaimer: for educational purposes only`,
        `[*] starting to ${params.url}`,
        `[INFO] testing connection to target URL`,
        `[INFO] testing if the target URL content is stable`,
        `[INFO] GET parameter 'id' is vulnerable`,
        `[INFO] the back-end DBMS is MySQL`,
        `[INFO] fetching databases`,
        `available databases [3]:`,
        `[*] information_schema`,
        `[*] webapp`,
        `[*] test_db`,
      );
      summary = `SQL injection confirmed on parameter 'id'. Backend is MySQL. Found 3 databases: information_schema, webapp, test_db.`;
      break;
    case 'hydra':
      lines.push(
        `Hydra v9.5 (c) 2023 by van Hauser/THC`,
        `[DATA] attacking ${params.service}://${params.target}:`,
        `[DATA] max 16 tasks per server`,
        `[STATUS] 1280.00 tries/min, 1280 tries in 00:01h`,
        `[4432][ssh] host: ${params.target} login: root password: toor`,
        `[4432][ssh] host: ${params.target} login: admin password: admin123`,
        `1 of 1 target successfully completed, 2 valid passwords found`,
      );
      summary = `Cracked 2 credentials on ${params.target} ${params.service}: root:toor, admin:admin123.`;
      parsedTargets = ['root:toor', 'admin:admin123'];
      break;
    case 'john':
      lines.push(
        `Using default input encoding: UTF-8`,
        `Loaded 5 password hashes (sha512crypt)`,
        `Press 'q' or Ctrl-C to abort`,
        `toor            (root)`,
        `admin123        (admin)`,
        `password        (guest)`,
        `3g 0:00:00:42 DONE (2019-05-01 12:00)`,
        `Session completed.`,
      );
      summary = `Cracked 3 of 5 hashes: root=toor, admin=admin123, guest=password.`;
      break;
    case 'airmon-ng':
      lines.push(
        `Found 2 processes that could cause trouble.`,
        `Killing all interfering processes...`,
        `PHY     Interface   Driver      Chipset`,
        `phy0    wlan0       ath9k_htc   Atheros AR9271`,
        `        (mac80211 monitor mode vif enabled for [phy0]wlan0 on [phy0]wlan0mon)`,
        `        (mac80211 station mode vif disabled for [phy0]wlan0)`,
      );
      summary = `Monitor mode enabled on ${params.interface}. New interface: ${params.interface}mon.`;
      break;
    case 'airodump-ng':
      lines.push(
        ` CH  6 ][ Elapsed: 12 s ][ ${new Date().toLocaleTimeString()} `,
        ``,
        ` BSSID              PWR  Beacons  #Data  CH  ES  ESSID`,
        ` 00:11:22:33:44:55  -42    142     37    6   Y  HomeWiFi`,
        ` AA:BB:CC:DD:EE:FF  -67     89     12   11   Y  OfficeNet`,
        ` 11:22:33:44:55:66  -71     56      3    1   Y  Guest_WiFi`,
        ` EE:FF:00:11:22:33  -89     23      0    6   Y  <hidden>`,
        ``,
        ` BSSID              STATION            PWR  Rate  Lost  Frames`,
        ` 00:11:22:33:44:55  1A:2B:3C:4D:5E:6F  -45  1e-6     0     142`,
      );
      summary = `Discovered 4 access points and 1 connected station. Strongest: HomeWiFi (CH6, -42dBm).`;
      parsedTargets = ['00:11:22:33:44:55:HomeWiFi:6', 'AA:BB:CC:DD:EE:FF:OfficeNet:11', '11:22:33:44:55:66:Guest_WiFi:1'];
      break;
    case 'aireplay-ng':
      lines.push(
        `Waiting for beacon frame (BSSID: ${params.bssid}) on channel ${params.channel}`,
        `Sending DeAuth (code 7) to broadcast -- A-MAC: ${params.bssid} C-MAC: FF:FF:FF:FF:FF:FF`,
        `Sending DeAuth (code 7) to broadcast -- A-MAC: ${params.bssid} C-MAC: FF:FF:FF:FF:FF:FF`,
        `Sending DeAuth (code 7) to broadcast -- A-MAC: ${params.bssid} C-MAC: FF:FF:FF:FF:FF:FF`,
        `[!] WPA handshake captured: ${params.bssid}`,
      );
      summary = `Sent ${params.count || 5} deauth packets. WPA handshake captured for ${params.bssid}.`;
      artifacts = ['handshake-01.cap'];
      break;
    case 'aircrack-ng':
      lines.push(
        `Opening ${params.captureFile}`,
        `Read 4827 packets.`,
        `   #  BSSID              ESSID                   Encryption`,
        `   1  00:11:22:33:44:55  HomeWiFi                WPA2 (1 handshake)`,
        `Choosing first network as target.`,
        `Reading wordlist: ${params.wordlist}`,
        `                  Aircrack-ng 1.7`,
        `[00:00:08] 2482/14344392 keys tested (310.12 k/s)`,
        `Time left: 12 hours, 53 minutes`,
        `KEY FOUND! [ S3cur3P@ssw0rd! ]`,
        `Master Key: A1 B2 C3 D4 E5 F6 A7 B8`,
      );
      summary = `WPA2 key cracked: S3cur3P@ssw0rd! for HomeWiFi.`;
      break;
    case 'wifite':
      lines.push(
        ` wifite2 2.7.0`,
        ` [*] Interface: ${params.interface}`,
        ` [*] Scanning for wireless networks...`,
        ` NUM ESSID       CH  ENCR  PWR  WPS?`,
        ` 1   HomeWiFi    6   WPA2 -42  no`,
        ` 2   OfficeNet  11   WPA2 -67  yes`,
        ` [*] attacking "HomeWiFi"`,
        ` [*] handshake captured! saved as ${params.interface}-home-handshake.pcap`,
        ` [*] cracking with aircrack-ng...`,
        ` [*] key found: S3cur3P@ssw0rd!`,
      );
      summary = `Automated attack complete. Cracked HomeWiFi: S3cur3P@ssw0rd!`;
      break;
    case 'tcpdump':
      lines.push(
        `tcpdump: listening on ${params.interface}, link-type EN10MB (Ethernet), capture size 262144 bytes`,
        `12:00:01.123456 IP 192.168.1.100.443 > 192.168.1.1.54321: Flags [S], seq 123456`,
        `12:00:01.123789 IP 192.168.1.1.54321 > 192.168.1.100.443: Flags [S.], seq 654321`,
        `12:00:01.124012 IP 192.168.1.100.443 > 192.168.1.1.54321: Flags [.], ack 1`,
        `12:00:01.456789 IP6 fe80::1 > ff02::1: ICMP6, neighbor solicitation`,
        `100 packets captured`,
        `100 packets received by filter`,
      );
      summary = `Captured ${params.count || 100} packets on ${params.interface}. Saved to ${params.interface}-capture.pcap.`;
      artifacts = [`${params.interface}-capture.pcap`];
      break;
    case 'wireshark-cli':
      lines.push(
        `Capturing on '${params.interface}'`,
        `  1024   12.000000 192.168.1.100 → 192.168.1.1  TCP 80 → 54321 [SYN]`,
        `  1025   12.000123 192.168.1.1 → 192.168.1.100  TCP 54321 → 80 [SYN, ACK]`,
        `  1026   12.000234 192.168.1.100 → 192.168.1.1  HTTP GET /admin`,
        `  1027   12.001567 192.168.1.1 → 192.168.1.100  HTTP/1.1 200 OK`,
        `  1028   12.002345 192.168.1.100 → 192.168.1.1  TLSv1.3 Client Hello`,
        `Captured ${1024 + Number(params.duration || 30)} packets in ${params.duration || 30}s`,
      );
      summary = `Captured network traffic on ${params.interface} for ${params.duration || 30}s. Detected HTTP and TLS traffic to /admin.`;
      artifacts = ['capture.pcap'];
      break;
    case 'ettercap':
      lines.push(
        `ettercap 0.8.3.1 copyright 2001-2023 Ettercap development team`,
        `Listening on ${params.target1}...`,
        `Scanning the whole netmask for hosts...`,
        `2 hosts added to the host list...`,
        `ARP poisoning ${params.target1} <-> ${params.target2 || 'gateway'}`,
        `Sniffing started...`,
        `[*] HTTP credential captured: admin:password123 from ${params.target2}`,
      );
      summary = `MITM ARP spoofing active between ${params.target1} and ${params.target2 || 'gateway'}. Captured HTTP credentials: admin:password123.`;
      break;
    case 'responder':
      lines.push(
        `Responder 3.1.4.0`,
        `[*] Listening on ${params.interface}...`,
        `[SMB] NTLMv2-SSP Hash : ${params.target1 || 'admin'}::DESKTOP:1122334455667788`,
        `[SMB] NTLMv2-SSP Hash : user::WORKSTATION:AABBCCDDEE`,
        `[HTTP] GET Request from 192.168.1.50: /`,
        `[HTTP] Credential captured: admin:Welcome123`,
      );
      summary = `Captured 2 NTLMv2 hashes and 1 HTTP credential via LLMNR/NBT-NS poisoning.`;
      break;
    case 'mimikatz':
      lines.push(
        `  .##  ##.    mimikatz 2.2.0 (x64) #18362`,
        ` ##  ##  ##   "A La Vie, A L'Amour"`,
        `Authentication Id : 0 ; 999`,
        `Session           : Interactive`,
        `User Name         : SYSTEM`,
        `Domain            : NT AUTHORITY`,
        `NTLM              : 31d6cfe0d16ae931b73c59d7e0c089c0`,
        `Authentication Id : 0 ; 12345`,
        `User Name         : Administrator`,
        `Domain            : WORKGROUP`,
        `NTLM              : 8846f7eaee8fb117ad06bdd830b7586c`,
      );
      summary = `Extracted credentials: SYSTEM (NTLM: 31d6...), Administrator (NTLM: 8846...).`;
      break;
    case 'ssh-connect':
      lines.push(
        `Warning: Permanently added '${params.host}' (ED25519) to the list of known hosts.`,
        `${params.user}@${params.host}'s password: ********`,
        `Last login: ${new Date().toISOString()}`,
        `Linux ${params.host} 5.15.0-91-generic #101-Ubuntu SMP x86_64`,
        `${params.user}@${params.host}:~# whoami`,
        `${params.user}`,
      );
      summary = `SSH connection to ${params.user}@${params.host}:${params.port || 22} established.`;
      break;
    case 'volatility':
      lines.push(
        `Volatility 3 Framework 2.5.2`,
        `Plugin: ${params.plugin}`,
        `PID    PPID  ImageFileName   Offset(V)`,
        `4      0     System          0x1a2b3c4d`,
        `684    4     smss.exe        0x2b3c4d5e`,
        `824    684   csrss.exe       0x3c4d5e6f`,
        `904    684   wininit.exe     0x4d5e6f70`,
        `1792   824   services.exe    0x5e6f7081`,
        `Total processes: 87`,
      );
      summary = `Memory analysis complete. Found 87 processes. Top-level: System, smss.exe, csrss.exe, wininit.exe.`;
      break;
    case 'binwalk':
      lines.push(
        `Scan Time: ${new Date().toISOString()}`,
        `Signatures: 366`,
        `Target: ${params.file}`,
        ``,
        `DECIMAL     HEX         STRING`,
        `0           0x0         TLV Header`,
        `8192        0x2000      gzip compressed data`,
        `32768       0x8000      Squashfs filesystem, version 4.0`,
        `131072      0x20000     LZMA compressed data`,
        `524288      0x80000     JFFS2 filesystem`,
      );
      summary = `Analyzed ${params.file}. Found 5 embedded items: TLV header, gzip, Squashfs, LZMA, JFFS2.`;
      break;
    case 'foremost':
      lines.push(
        `Processing ${params.input}`,
        `Extracted files:`,
        `  jpg/00000000.jpg  (32 KB)`,
        `  jpg/00000001.jpg  (128 KB)`,
        `  pdf/00000000.pdf  (1.2 MB)`,
        `  zip/00000000.zip  (456 KB)`,
        `  doc/00000000.doc  (89 KB)`,
        `Total files recovered: 5`,
      );
      summary = `Recovered 5 files: 2 JPG, 1 PDF, 1 ZIP, 1 DOC from ${params.input}.`;
      break;
    case 'strings':
      lines.push(
        `/lib64/ld-linux-x86-64.so.2`,
        `libc.so.6`,
        `printf`,
        `scanf`,
        `strcpy`,
        `sprintf`,
        `GCC: (Ubuntu 11.4.0-1ubuntu1) 11.4.0`,
        `GLIBC_2.34`,
        `GLIBC_2.2.5`,
        `/etc/passwd`,
        `password`,
        `admin`,
        `root`,
      );
      summary = `Extracted readable strings. Notable: references to /etc/passwd, "password", "admin", "root".`;
      break;
    case 'recon-ng':
      lines.push(
        `[*] Recon-ng v5.1.2`,
        `[*] Loading module: ${params.module}`,
        `[*] Running against ${params.domain}...`,
        `[+] host: www.${params.domain} (185.199.108.2)`,
        `[+] host: api.${params.domain} (185.199.108.3)`,
        `[+] host: dev.${params.domain} (185.199.108.4)`,
        `[+] host: mail.${params.domain} (185.199.108.5)`,
        `[*] 4 hosts discovered`,
      );
      summary = `Recon-ng found 4 hosts for ${params.domain} using ${params.module}.`;
      break;
    case 'smbclient':
      lines.push(
        `Enter ${params.target}'s password: `,
        `Anonymous login successful`,
        ``,
        `    Sharename   Type      Comment`,
        `    ---------   ----      -------`,
        `    IPC$        IPC       IPC Service`,
        `    admin$      Disk      Remote Admin`,
        `    C$          Disk      Default share`,
        `    public      Disk      Public Files`,
        ``,
        `    Server              Comment`,
        `    ---------           -------`,
        `    WORKGROUP           Samba Server`,
      );
      summary = `Connected to ${params.target}. Found 4 shares: IPC$, admin$, C$, public.`;
      break;
    case 'nfs-enumerate':
      lines.push(
        `Exports list on ${params.target}:`,
        `/export/home   *`,
        `/var/www       192.168.1.0/24`,
        `/backup        192.168.1.100`,
      );
      summary = `Found 3 NFS exports on ${params.target}: /export/home (everyone), /var/www (subnet), /backup (single host).`;
      break;
    case 'save-report':
      lines.push(
        `Generating report...`,
        `Compiling ${params.format?.toUpperCase()} report from session data`,
        `Including raw output: ${params.includeOutput ? 'yes' : 'no'}`,
        `Report saved to: report.${params.format}`,
      );
      summary = `Report generated as ${params.format} and saved.`;
      break;
    case 'export-captures':
      lines.push(
        `Exporting captures as ${params.format}...`,
        `capture-01.pcap → ${params.format}`,
        `handshake-01.cap → ${params.format}`,
        `tcpdump.pcap → ${params.format}`,
        `Done. 3 files exported.`,
      );
      summary = `Exported 3 capture files to ${params.format} format.`;
      break;
    default:
      lines.push(`[ simulated output for ${tool.name} ]`);
      summary = `Tool ${tool.name} executed successfully.`;
  }

  return { output: lines.join('\n'), summary, parsedTargets, artifacts };
}

let resultCounter = 0;

export function createResult(
  tool: KaliTool,
  params: Record<string, string | boolean | number>,
  command: string,
  durationMs: number
): ExecutionResult {
  const sim = generateSimulatedOutput(tool, params);
  resultCounter += 1;
  return {
    id: `result-${Date.now()}-${resultCounter}`,
    toolId: tool.id,
    toolName: tool.name,
    command,
    params,
    output: sim.output,
    summary: sim.summary,
    timestamp: Date.now(),
    durationMs,
    success: true,
    artifacts: sim.artifacts,
    parsedTargets: sim.parsedTargets,
  };
}
