import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import os from 'node:os';
import { requireAuth } from './auth.js';
import { aiEnabled } from './services/ai.js';
import { query } from './db.js';
import { ean13Svg } from './services/ean13svg.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import barcodeRoutes from './routes/barcode.js';
import bloodRoutes from './routes/blood.js';
import planRoutes from './routes/plan.js';
import mealRoutes from './routes/meals.js';
import trackingRoutes from './routes/tracking.js';
import plusRecipeRoutes from './routes/plusRecipes.js';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, ai: aiEnabled() }));

// Demo barkod sayfası: bilgisayar ekranında açıp telefonun kamerasıyla okutun
app.get('/demo-barkodlar', async (req, res, next) => {
  try {
    const rows = await query("SELECT barcode, name FROM products WHERE source = 'local' ORDER BY name");
    const cards = rows.map((r) => `<div class="c"><h3>${r.name}</h3>${ean13Svg(r.barcode)}</div>`).join('');
    res.type('html').send(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MelMind Demo Barkodları</title><style>body{font-family:system-ui,sans-serif;background:#f6f8f5;margin:0;padding:24px;color:#16211b}
h1{margin:0 0 4px}p{color:#5b6b62;margin:0 0 20px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:16px}
.c{background:#fff;border:1px solid #dce4de;border-radius:16px;padding:16px;text-align:center}.c h3{margin:0 0 10px;font-size:17px}svg{display:block;margin:0 auto}</style></head>
<body><h1>MelMind demo barkodları</h1><p>Uygulamada “Barkod” sekmesini açıp bu barkodları telefonunuzun kamerasıyla okutun. Bunlar test amaçlı örnek ürünlerdir.</p>
<div class="g">${cards}</div></body></html>`);
  } catch (e) { next(e); }
});
app.use('/api/auth', authRoutes);
app.use('/api/profile', requireAuth, profileRoutes);
app.use('/api/barcode', requireAuth, barcodeRoutes);
app.use('/api/blood', requireAuth, bloodRoutes);
app.use('/api/plan', requireAuth, planRoutes);
app.use('/api/meals', requireAuth, mealRoutes);
app.use('/api/plus-recipes', requireAuth, plusRecipeRoutes);
app.use('/api', requireAuth, trackingRoutes);

app.use((req, res) => res.status(404).json({ error: 'Bulunamadı' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500 && !err.status) console.error(err);
  res.status(status).json({ error: status >= 500 && !err.status ? 'Sunucu hatası' : err.message });
});

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, '0.0.0.0', () => {
    const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
    console.log(`MelMind API çalışıyor: http://localhost:${port}`);
    for (const ip of ips) console.log(`  Telefondan erişim: http://${ip}:${port}  (mobile/.env içine EXPO_PUBLIC_API_URL olarak yazın)`);
    console.log(`  Demo barkodlar: http://localhost:${port}/demo-barkodlar`);
    console.log(`  Yapay zekâ: ${aiEnabled() ? 'açık' : 'kapalı (SCAN_AI_API_KEY yok — elle giriş çalışır)'}`);
  });
}
