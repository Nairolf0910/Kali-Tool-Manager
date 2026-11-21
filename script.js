import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';

const app = express();
const PORT = 3001;

// Erlaubt Anfragen vom React-Frontend (Vite läuft meistens auf Port 5173)
app.use(cors());
app.use(express.json());

app.post('/api/execute', (req, res) => {
  const { command, sudoPassword } = req.body;

  if (!command) {
    return res.status(400).json({ stderr: 'Kein Befehl übergeben.', exitCode: 1 });
  }

  // Ersetzt den Platzhalter $PASSWORD durch das echte Sudo-Passwort aus dem Frontend
  const finalCommand = sudoPassword
    ? command.replace('$PASSWORD', sudoPassword)
    : command;

  const startTime = Date.now();

  // Führt den Befehl im echten Linux-Terminal aus (maxBuffer auf 10MB für lange Scans)
  exec(finalCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    const durationMs = Date.now() - startTime;
    const exitCode = error ? (error.code || 1) : 0;

    res.json({
      stdout: stdout || '',
      stderr: stderr || (error ? error.message : ''),
      exitCode: exitCode,
      durationMs: durationMs,
    });
  });
});

app.listen(PORT, () => {
  console.log(`Kali-Backend läuft auf http://localhost:${PORT}`);
});

app.post('/api/verify-sudo', (req, res) => {
  const { sudoPassword } = req.body;
  if (!sudoPassword) {
    return res.status(400).json({ valid: false, error: 'Kein Passwort angegeben.' });
  }

  // -k setzt den sudo-Cache zurück, -S liest von stdin, -v prüft nur die Berechtigung
  const child = exec('sudo -k -S -v', (error) => {
    if (error) {
      return res.status(401).json({ valid: false, error: 'Falsches Sudo-Passwort.' });
    }
    res.json({ valid: true });
  });

  child.stdin.write(`${sudoPassword}\n`);
  child.stdin.end();
});
