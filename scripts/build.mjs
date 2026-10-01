import { readFile, writeFile } from 'node:fs/promises';
const path = new URL('../dist/config.js', import.meta.url);
const existing = (await import(path.href)).config;
const config = {
  supabaseUrl: process.env.SUPABASE_URL || existing.supabaseUrl,
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || existing.supabaseKey,
  whatsappNumber: (process.env.WHATSAPP_NUMBER || existing.whatsappNumber).replace(/[^0-9]/g, ''),
};
if (config.supabaseKey.startsWith('sb_secret_')) throw new Error('Use a publishable key, never a secret key.');
if (config.supabaseKey.split('.').length === 3) {
  const payload = JSON.parse(Buffer.from(config.supabaseKey.split('.')[1], 'base64url'));
  if (payload.role !== 'anon') throw new Error('Only a legacy anon JWT key may be published.');
}
await writeFile(path, '// Generated public configuration.\nexport const config = ' + JSON.stringify(config, null, 2) + ';\n');
if (/^[1-9]\d{7,14}$/.test(config.whatsappNumber)) {
  const homePath = new URL('../dist/index.html', import.meta.url);
  const home = await readFile(homePath, 'utf8');
  await writeFile(homePath, home.replace(/https:\/\/wa\.me\/\d+/g, 'https://wa.me/' + config.whatsappNumber));
}
console.log(config.supabaseUrl && config.supabaseKey ? 'Public Supabase configuration ready.' : 'Static preview ready. Set Supabase configuration to enable bookings.');
