import { Router } from 'express';
import { query, one } from '../db.js';
import { wrap } from '../auth.js';
import { loadProfile } from '../services/profile.js';

const r = Router();

// Tarif defteri yalnızca MelMind Plus üyelerine açıktır
r.use(wrap(async (req, res, next) => {
  const p = await loadProfile(req.userId);
  if (!p.is_plus) return res.status(402).json({ error: 'Tarif defteri MelMind Plus ile kullanılabilir.' });
  next();
}));

r.get('/', wrap(async (req, res) => {
  res.json(await query('SELECT id, title, category, minutes, servings, kcal FROM plus_recipes ORDER BY sort_order, id'));
}));

r.get('/:id', wrap(async (req, res) => {
  const x = await one('SELECT * FROM plus_recipes WHERE id = ?', [req.params.id]);
  if (!x) return res.status(404).json({ error: 'Tarif bulunamadı.' });
  res.json(x);
}));

export default r;
