import { Router } from 'express';
import { pool, query } from '../db.js';
import { wrap } from '../auth.js';
import { loadProfile, waterGoal } from '../services/profile.js';
import { regeneratePlan } from '../services/planner.js';
import { validateProfile, saveHealthLists } from './auth.js';
import { ALLERGENS, CONDITIONS } from '../services/compatibility.js';

const r = Router();

r.get('/me', wrap(async (req, res) => res.json(await loadProfile(req.userId))));

// Seçenek listeleri (mobil uygulamadaki onay kutuları için)
r.get('/options', (req, res) => res.json({
  allergens: Object.entries(ALLERGENS).map(([code, a]) => ({ code, label: a.label })),
  conditions: Object.entries(CONDITIONS).map(([code, label]) => ({ code, label })),
}));

r.put('/me', wrap(async (req, res) => {
  const b = req.body || {};
  const errs = validateProfile(b, true);
  if (errs.length) return res.status(400).json({ error: errs[0], errors: errs });
  const fields = ['name', 'age', 'gender', 'height_cm', 'goal', 'activity', 'diet_type', 'large_text', 'step_goal', 'water_goal_ml'];
  const sets = []; const vals = [];
  for (const f of fields) if (b[f] !== undefined) { sets.push(`${f} = ?`); vals.push(f === 'large_text' ? (b[f] ? 1 : 0) : b[f]); }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (sets.length) await conn.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.userId]);
    await saveHealthLists(conn, req.userId, b.conditions && [...new Set(b.conditions)], b.allergies && [...new Set(b.allergies)]);
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

  // Plana etki eden bir alan değiştiyse plan hemen güncellenir (Obj 3)
  const planFields = ['age', 'gender', 'height_cm', 'goal', 'activity', 'diet_type', 'conditions', 'allergies'];
  if (planFields.some((f) => b[f] !== undefined)) await regeneratePlan(req.userId, 'Profil güncellendi');
  res.json(await loadProfile(req.userId));
}));

r.post('/weight', wrap(async (req, res) => {
  const w = Number(req.body?.weight_kg);
  if (!(w >= 30 && w <= 300)) return res.status(400).json({ error: 'Kilo 30–300 kg arasında olmalı.' });
  await query('INSERT INTO weight_logs (user_id, weight_kg) VALUES (?,?)', [req.userId, w]);
  await query('UPDATE users SET weight_kg = ?, water_goal_ml = ? WHERE id = ?', [w, waterGoal(w), req.userId]);
  await regeneratePlan(req.userId, `Kilo güncellendi (${w} kg)`);
  res.json(await loadProfile(req.userId));
}));

r.get('/weight', wrap(async (req, res) => {
  res.json(await query('SELECT weight_kg, logged_at FROM weight_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 30', [req.userId]));
}));

// Prototip: MelMind Plus'ı aç/kapat (gerçek ödeme entegrasyonu kapsam dışı)
r.post('/plus', wrap(async (req, res) => {
  await query('UPDATE users SET is_plus = ? WHERE id = ?', [req.body?.active ? 1 : 0, req.userId]);
  res.json(await loadProfile(req.userId));
}));

export default r;
