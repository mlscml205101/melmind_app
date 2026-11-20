import { Router } from 'express';
import { query } from '../db.js';
import { wrap } from '../auth.js';
import { findProduct, saveProduct, isValidBarcode, rowToProduct } from '../services/products.js';
import { evaluateProduct, ALLERGENS } from '../services/compatibility.js';
import { loadProfile, toEvalProfile } from '../services/profile.js';
import { checkBadges } from '../services/badges.js';

const r = Router();

async function evaluateAndLog(userId, product) {
  const profile = await loadProfile(userId);
  const result = evaluateProduct(product, toEvalProfile(profile));
  await query('INSERT INTO barcode_scans (user_id, barcode, verdict, reasons) VALUES (?,?,?,?)',
    [userId, product.barcode, result.verdict, JSON.stringify(result.reasons)]);
  const newBadges = await checkBadges(userId);
  return { product, evaluation: result, newBadges };
}

// Barkod okut → ürün bul → kullanıcının diyetine uygun mu?
r.get('/:code', wrap(async (req, res) => {
  const code = String(req.params.code).trim();
  if (!isValidBarcode(code)) return res.status(400).json({ error: 'Geçersiz barkod. 8–14 haneli olmalı.' });
  const found = await findProduct(code);
  if (!found.product) {
    return res.status(404).json({
      error: found.offline ? 'Ürün veritabanına ulaşılamadı. Bilgileri elle ekleyebilirsiniz.' : 'Ürün bulunamadı. Etiketteki bilgileri ekleyerek kontrol edebilirsiniz.',
      notFound: true, offline: !!found.offline, barcode: code,
    });
  }
  res.json({ ...(await evaluateAndLog(req.userId, found.product)), from: found.from });
}));

// Bulunamayan ürünü kullanıcı etiketten ekler, ardından aynı kontrol yapılır
r.post('/products', wrap(async (req, res) => {
  const b = req.body || {};
  const code = String(b.barcode || '').trim();
  if (!isValidBarcode(code)) return res.status(400).json({ error: 'Geçersiz barkod.' });
  if (!b.name || String(b.name).trim().length < 2) return res.status(400).json({ error: 'Ürün adını girin.' });
  const allergenCodes = (b.allergens || []).filter((a) => ALLERGENS[a]);
  const tags = [...new Set(allergenCodes.flatMap((a) => ALLERGENS[a].offTags))];
  const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
  const product = {
    barcode: code, name: String(b.name).trim(), brand: b.brand || null, source: 'user', is_beverage: !!b.is_beverage,
    allergens: tags, traces: [], labels: b.gluten_free ? ['en:gluten-free'] : b.lactose_free ? ['en:lactose-free'] : [],
    analysis_tags: [], ingredients_text: b.ingredients_text || null,
    kcal_100g: num(b.kcal_100g), sugar_100g: num(b.sugar_100g), carbs_100g: num(b.carbs_100g), fat_100g: num(b.fat_100g),
    sat_fat_100g: num(b.sat_fat_100g), trans_fat_100g: null, salt_100g: num(b.salt_100g), protein_100g: num(b.protein_100g),
    fiber_100g: null, serving_g: null, nova_group: null, image_url: null,
  };
  await saveProduct(product);
  res.status(201).json(await evaluateAndLog(req.userId, product));
}));

r.get('/', wrap(async (req, res) => {
  const rows = await query(
    `SELECT s.id, s.barcode, s.verdict, s.created_at, p.name, p.brand FROM barcode_scans s
       LEFT JOIN products p ON p.barcode = s.barcode WHERE s.user_id = ? ORDER BY s.created_at DESC, s.id DESC LIMIT 30`, [req.userId]);
  res.json(rows);
}));

// Demo ürün listesi (barkod okuyucuyu test etmek için)
r.get('/demo/list', wrap(async (req, res) => {
  res.json((await query("SELECT * FROM products WHERE source = 'local' ORDER BY name")).map(rowToProduct));
}));

export default r;
