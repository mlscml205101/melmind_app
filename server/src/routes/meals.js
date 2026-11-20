import { Router } from 'express';
import multer from 'multer';
import { query, one } from '../db.js';
import { wrap } from '../auth.js';
import { loadProfile } from '../services/profile.js';
import { checkBadges } from '../services/badges.js';
import { analyzeMealPhoto } from '../services/ai.js';
import { findProduct } from '../services/products.js';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
export const FREE_PHOTO_LIMIT = 3;
const TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export function guessMealType(d = new Date()) {
  const h = d.getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

r.get('/', wrap(async (req, res) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : null;
  const rows = await query(
    `SELECT * FROM meals WHERE user_id = ? AND DATE(eaten_at) = ${date ? '?' : 'CURDATE()'} ORDER BY eaten_at`,
    date ? [req.userId, date] : [req.userId]);
  res.json(rows);
}));

r.post('/', wrap(async (req, res) => {
  const b = req.body || {};
  const mealType = TYPES.includes(b.meal_type) ? b.meal_type : guessMealType();
  let meal;
  if (b.barcode) {
    // Barkodlu ürün: gram × 100 g değerleri
    const grams = Number(b.grams);
    if (!(grams > 0 && grams <= 3000)) return res.status(400).json({ error: 'Gram miktarını girin.' });
    const { product } = await findProduct(String(b.barcode));
    if (!product) return res.status(404).json({ error: 'Ürün bulunamadı.' });
    const f = grams / 100;
    meal = { name: product.name, source: 'barcode', grams, kcal: Math.round((product.kcal_100g || 0) * f),
      protein_g: round1((product.protein_100g || 0) * f), carbs_g: round1((product.carbs_100g || 0) * f), fat_g: round1((product.fat_100g || 0) * f),
      barcode: product.barcode, is_estimate: product.kcal_100g == null ? 1 : 0 };
  } else {
    const kcal = Number(b.kcal);
    if (!b.name || !(kcal >= 0 && kcal <= 5000)) return res.status(400).json({ error: 'Öğün adı ve kalorisini girin.' });
    meal = { name: String(b.name).slice(0, 200), source: ['photo', 'plan'].includes(b.source) ? b.source : 'manual', grams: b.grams || null, kcal: Math.round(kcal),
      protein_g: Number(b.protein_g) || 0, carbs_g: Number(b.carbs_g) || 0, fat_g: Number(b.fat_g) || 0, barcode: null, is_estimate: b.source === 'photo' ? 1 : 0 };
  }
  const ins = await query(
    `INSERT INTO meals (user_id, meal_type, name, source, grams, kcal, protein_g, carbs_g, fat_g, barcode, is_estimate)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [req.userId, mealType, meal.name, meal.source, meal.grams, meal.kcal, meal.protein_g, meal.carbs_g, meal.fat_g, meal.barcode, meal.is_estimate]);
  const newBadges = await checkBadges(req.userId);
  res.status(201).json({ meal: await one('SELECT * FROM meals WHERE id = ?', [ins.insertId]), newBadges });
}));

r.delete('/:id', wrap(async (req, res) => {
  await query('DELETE FROM meals WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ ok: true });
}));

// Tabak fotoğrafı → AI kalori tahmini. Ücretsiz kullanıcı günde 3 analiz (MelMind Plus sınırsız)
r.get('/photo/quota', wrap(async (req, res) => res.json(await photoQuota(req.userId))));

async function photoQuota(userId) {
  const p = await loadProfile(userId);
  const used = (await one('SELECT COUNT(*) c FROM photo_analyses WHERE user_id = ? AND DATE(created_at) = CURDATE()', [userId])).c;
  return { used, limit: p.is_plus ? null : FREE_PHOTO_LIMIT, remaining: p.is_plus ? null : Math.max(0, FREE_PHOTO_LIMIT - used) };
}

r.post('/photo', upload.single('photo'), wrap(async (req, res) => {
  if (!req.file || !/^image\/(jpeg|png|webp)$/.test(req.file.mimetype)) return res.status(400).json({ error: 'JPEG/PNG fotoğraf yükleyin.' });
  const q = await photoQuota(req.userId);
  if (q.limit !== null && q.remaining <= 0) {
    return res.status(429).json({ error: `Bugünkü ${FREE_PHOTO_LIMIT} ücretsiz fotoğraf analizini kullandınız. Sınırsız analiz için MelMind Plus'a geçebilirsiniz.`, quota: q });
  }
  const result = await analyzeMealPhoto(req.file.buffer, req.file.mimetype);
  await query('INSERT INTO photo_analyses (user_id) VALUES (?)', [req.userId]);
  res.json({ ...result, is_estimate: true, note: 'Bu değerler tahminidir; kaydetmeden önce düzenleyebilirsiniz.', quota: await photoQuota(req.userId) });
}));

const round1 = (x) => Math.round(x * 10) / 10;

export default r;
