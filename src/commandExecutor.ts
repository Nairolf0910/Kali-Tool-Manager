import type { KaliTool, ExecutionResult } from './types';

/**
 * Baut den Shell-Befehl aus der Tool-Definition und den Parametern.
 */
export function buildCommand(
  tool: KaliTool,
  params: Record<string, string | boolean | number>,
  savePath: string
): string {
  const p = params;
  // Leerzeichen am Ende entfernt, damit .join(' ') keine doppelten Leerzeichen erzeugt
  const sudo = `echo '$PASSWORD' | sudo -S`;

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
      return `${sudo} nmap --script ${p.script || 'vuln'} ${p.target}`;
    case 'searchsploit':
      return `searchsploit ${p.query}`;
    case 'theharvester':
      return `${sudo} theHarvester -d ${p.domain} -b ${p.source}`;
    case 'recon-ng':
      return `${sudo} recon-ng -r "${p.module}" -d ${p.domain}`;
    case 'dnsenum':
      return `${sudo} dnsenum ${p.domain}`;
    case 'masscan':
      return `${sudo} masscan ${p.target} -p${p.ports || '1-65535'} --rate=${p.rate || 1000} -oJ ${savePath}/masscan-results.json`;

    case 'nikto':
      return `${sudo} nikto -h ${p.target} -p ${p.port || 80} -o ${savePath}/nikto-report.txt`;
    case 'dirb':
      return `${sudo} gobuster dir -u ${p.url} -w ${p.wordlist} -x ${p.extensions}`;
    case 'enum4linux':
      return `${sudo} enum4linux -a ${p.target}`;
    case 'smbclient':
      return `${sudo} smbclient ${p.target} ${p.action || '-L'} -N`;

    case 'metasploit':
      return `${sudo} msfconsole -q -x "use ${p.module}; set RHOSTS ${p.target}; set LHOST ${p.lhost || '0.0.0.0'}; set LPORT ${p.lport || 4444}; run; exit"`;
    case 'sqlmap':
      return `${sudo} sqlmap -u "${p.url}" ${p.action} --level=${p.level} --risk=${p.risk} --batch`;
    case 'hydra': {
      const userPart = p.userList ? `-L ${p.userList}` : `-l ${p.user || 'admin'}`;
      return `${sudo} hydra ${userPart} -P ${p.passList} ${p.target} ${p.service} -o ${savePath}/hydra-${p.service}.txt`;
    }

    case 'john':
      return `${sudo} john ${p.wordlist ? `--wordlist=${p.wordlist}` : ''} ${p.format !== 'auto' ? `--format=${p.format}` : ''} ${p.hashfile}`;
    case 'hashcat': {
      const mode = String(p.mode || '0 (MD5)').split(' ')[0];
      const attackMode = String(p.attackMode || '0 (Straight)').split(' ')[0];
      return `${sudo} hashcat -m ${mode} -a ${attackMode} ${p.hashfile} ${p.wordlist}`;
    }
    case 'wordlists':
      return `${sudo} crunch ${p.minLen} ${p.maxLen} ${p.charset} -o ${savePath}/wordlist.txt`;

    case 'airmon-ng':
      return `${sudo} airmon-ng ${p.action} ${p.interface}`;
    case 'airodump-ng': {
      const parts = [sudo, 'airodump-ng'];
      if (p.band === 'a') parts.push('--band a');
      else if (p.band === 'bg') parts.push('--band bg');
      if (p.channel) parts.push(`-c ${p.channel}`);
      if (p.writeFile) parts.push(`-w ${savePath}/capture`);
      parts.push(String(p.interface));
      return parts.join(' ');
    }
    case 'aireplay-ng':
      return `${sudo} aireplay-ng --deauth ${p.count || 5} -a ${p.bssid} -c FF:FF:FF:FF:FF:FF ${p.interface}`;
    case 'aircrack-ng':
      return `${sudo} aircrack-ng -w ${p.wordlist} ${p.captureFile}`;
    case 'wifite':
      return `${sudo} wifite --iface ${p.interface} --${p.attackType}`;

    case 'wireshark-cli':
      return `${sudo} tshark -i ${p.interface} -a duration:${p.duration || 30} ${p.filter ? `-f "${p.filter}"` : ''} -w ${savePath}/capture.pcap`;
    case 'tcpdump':
      return `${sudo} tcpdump -i ${p.interface} -c ${p.count || 100} ${p.filter ? `"${p.filter}"` : ''} -w ${savePath}/tcpdump.pcap`;
    case 'ettercap':
      return `${sudo} ettercap -T -M ${p.attack} /${p.target1}// /${p.target2 || ''}//`;
    case 'responder':
      return `${sudo} responder -I ${p.interface} ${p.analyze ? '-A' : ''} -w ${savePath}/responder-logs`;

    case 'mimikatz':
      return `${sudo} mimikatz.exe "${p.action}"`;
    case 'ssh-connect':
      return `ssh ${p.keyFile ? `-i ${p.keyFile}` : ''} ${p.user}@${p.host} -p ${p.port || 22}`;
    case 'nfs-enumerate':
      return `${sudo} showmount -e ${p.target}`;

    case 'volatility':
      return `${sudo} volatility --profile=${p.profile} -f ${p.dumpFile} ${p.plugin}`;
    case 'binwalk':
      return `${sudo} binwalk ${p.extract ? '-e' : ''} ${p.file}`;
    case 'foremost':
      return `${sudo} foremost -i ${p.input} -t ${p.types} -o ${savePath}/foremost-output`;
    case 'strings':
      return `strings -n ${p.minLen || 4} ${p.file}`;

    case 'save-report':
      return `report-generator --format ${p.format} --output ${savePath}/report.${p.format} ${p.includeOutput ? '--include-output' : ''}`;
    case 'export-captures':
      return `export-captures --format ${p.format} --output ${savePath}/exports/`;

    default:
      return `${sudo} ${tool.command}`;
  }
}

let resultCounter = 0;

/**
 * Interface für die Antwort deines echten Backends
 */
export interface BackendExecutionResponse {
  stdout: string;
  stderr?: string;
  exitCode: number;
  durationMs: number;
  artifacts?: string[];
  parsedTargets?: string[];
}

/**
 * Erstellt das Ergebnis-Objekt aus der echten Backend-Antwort (ohne Simulation).
 */
export function createResult(
  tool: KaliTool,
  params: Record<string, string | boolean | number>,
  command: string,
  response: BackendExecutionResponse
): ExecutionResult {
  resultCounter += 1;
  const isSuccess = response.exitCode === 0;

  // Kombiniert stdout und eventuelle Fehlermeldungen (stderr)
  const combinedOutput = [response.stdout, response.stderr]
    .filter(Boolean)
    .join('\n--- STDERR ---\n');

  return {
    id: `result-${Date.now()}-${resultCounter}`,
    toolId: tool.id,
    toolName: tool.name,
    command,
    params,
    output: combinedOutput || '(Keine Ausgabe vom Befehl erhalten)',
    summary: isSuccess
      ? `${tool.name} wurde erfolgreich in ${(response.durationMs / 1000).toFixed(2)}s ausgeführt.`
      : `${tool.name} wurde mit Fehlercode ${response.exitCode} beendet.`,
    timestamp: Date.now(),
    durationMs: response.durationMs,
    success: isSuccess,
    artifacts: response.artifacts,
    parsedTargets: response.parsedTargets,
  };
}
