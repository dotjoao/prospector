const FRONTEND_URL = 'https://750prospectorx3000.vercel.app';

const html = await fetch(FRONTEND_URL).then((r) => r.text());
const jsMatch = html.match(/assets\/index-[^"]+\.js/);

if (!jsMatch) {
  console.error('Bundle JS nao encontrado em', FRONTEND_URL);
  process.exit(1);
}

const jsUrl = `${FRONTEND_URL}/${jsMatch[0]}`;
const text = await fetch(jsUrl).then((r) => r.text());
const render = text.match(/https?:\/\/[a-z0-9.-]+\.onrender\.com/);

console.log('Frontend:', FRONTEND_URL);
console.log('Bundle:', jsUrl);
console.log('VITE_API_URL no bundle:', render?.[0] ?? 'NAO ENCONTRADO (usa /api relativo)');
console.log('Tem /api relativo:', text.includes('"/api"') || text.includes("'/api'"));
