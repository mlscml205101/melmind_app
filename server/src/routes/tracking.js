import { Router } from 'express';
import { query, one } from '../db.js';
import { wrap } from '../auth.js';
import { loadProfile } from '../services/profile.js';
import { BADGES, checkBadges, mealStreak } from '../services/badges.js';
import { askCoach, coachGuard, COACH_REFUSAL } from '../services/ai.js';

const r = Router();

const liters = (ml) => (ml / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
export function waterMessage(drank, goal) {
  if (drank >= goal) return `Harika! Bugün ${liters(drank)} L içtiniz, hedefinize ulaştınız 💧`;
  return `Bugün ${liters(drank)} L içtiniz, hedefiniz ${liters(goal)} L – bir bardak su zamanı!`;
}

// Ana ekran özeti
r.get('/today', wrap(async (req, res) => {
  const p = await loadProfile(req.userId);
  const m = await one(
    `SELECT COALESCE(SUM(kcal),0) kcal, COALESCE(SUM(protein_g),0) protein, COALESCE(SUM(carbs_g),0) carbs, COALESCE(SUM(fat_g),0) fat, COUNT(*) n
       FROM meals WHERE user_id = ? AND DATE(eaten_at) = CURDATE()`, [req.userId]);
  const w = await one('SELECT COALESCE(SUM(amount_ml),0) s FROM water_logs WHERE user_id = ? AND DATE(logged_at) = CURDATE()', [req.userId]);
  const s = await one('SELECT steps FROM step_logs WHERE user_id = ? AND log_date = CURDATE()', [req.userId]);
  const alerts = await query('SELECT * FROM alerts WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 5', [req.userId]);
  const water = Number(w.s);
  res.json({
    name: p.name, is_plus: p.is_plus,
    calories: { eaten: Number(m.kcal), target: p.targetKcal, protein: Math.round(m.protein), carbs: Math.round(m.carbs), fat: Math.round(m.fat), meals: m.n },
    water: { drank: water, goal: p.water_goal_ml, message: waterMessage(water, p.water_goal_ml) },
    steps: { count: s ? s.steps : 0, goal: p.step_goal },
    streak: await mealStreak(req.userId),
    alerts,
  });
}));

r.post('/water', wrap(async (req, res) => {
  const ml = Number(req.body?.amount_ml);
  if (!(ml >= 50 && ml <= 2000)) return res.status(400).json({ error: 'Miktar 50–2000 ml arasında olmalı.' });
  await query('INSERT INTO water_logs (user_id, amount_ml) VALUES (?,?)', [req.userId, ml]);
  const p = await loadProfile(req.userId);
  const w = await one('SELECT COALESCE(SUM(amount_ml),0) s FROM water_logs WHERE user_id = ? AND DATE(logged_at) = CURDATE()', [req.userId]);
  res.json({ drank: Number(w.s), goal: p.water_goal_ml, message: waterMessage(Number(w.s), p.water_goal_ml), newBadges: await checkBadges(req.userId) });
}));

// Telefonun adımsayarından gelen günlük toplam (aynı gün için üzerine yazar)
r.post('/steps', wrap(async (req, res) => {
  const steps = Math.round(Number(req.body?.steps));
  if (!(steps >= 0 && steps <= 200000)) return res.status(400).json({ error: 'Geçersiz adım sayısı.' });
  await query('INSERT INTO step_logs (user_id, log_date, steps) VALUES (?, CURDATE(), ?) ON DUPLICATE KEY UPDATE steps = VALUES(steps)', [req.userId, steps]);
  res.json({ steps, newBadges: await checkBadges(req.userId) });
}));

r.get('/badges', wrap(async (req, res) => {
  const have = await query('SELECT badge_code, earned_at FROM user_badges WHERE user_id = ?', [req.userId]);
  const map = Object.fromEntries(have.map((h) => [h.badge_code, h.earned_at]));
  res.json({ streak: await mealStreak(req.userId), badges: Object.entries(BADGES).map(([code, b]) => ({ code, ...b, earned_at: map[code] || null })) });
}));

// MelMind Plus — yapay zekâ beslenme koçu
r.post('/coach', wrap(async (req, res) => {
  const q = String(req.body?.question || '').trim();
  if (q.length < 3) return res.status(400).json({ error: 'Sorunuzu yazın.' });
  const p = await loadProfile(req.userId);
  if (!p.is_plus) return res.status(402).json({ error: 'Beslenme koçu MelMind Plus ile kullanılabilir.' });
  if (coachGuard(q)) return res.json({ answer: COACH_REFUSAL, blocked: true });
  res.json({ answer: await askCoach(q.slice(0, 1000), p), blocked: false });
}));

export default r;
