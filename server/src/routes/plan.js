import { Router } from 'express';
import { query, one, parseJson } from '../db.js';
import { wrap } from '../auth.js';
import { regeneratePlan } from '../services/planner.js';

const r = Router();

const recipeOut = (x) => ({ ...x, allergens: parseJson(x.allergens), tags: parseJson(x.tags) });

r.get('/current', wrap(async (req, res) => {
  let plan = await one('SELECT * FROM diet_plans WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1', [req.userId]);
  if (!plan) {
    await regeneratePlan(req.userId, 'İlk plan');
    plan = await one('SELECT * FROM diet_plans WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1', [req.userId]);
  }
  const items = await query(
    `SELECT pi.day_index, pi.meal_type, pi.portion_factor, r.* FROM plan_items pi JOIN recipes r ON r.id = pi.recipe_id
      WHERE pi.plan_id = ? ORDER BY pi.day_index, FIELD(pi.meal_type,'breakfast','lunch','dinner','snack')`, [plan.id]);
  const days = Array.from({ length: 7 }, (_, i) => ({ day_index: i, meals: [] }));
  for (const it of items) {
    const p = Number(it.portion_factor);
    days[it.day_index].meals.push({
      ...recipeOut(it), portion: p,
      kcal_portion: Math.round(it.kcal * p), protein_portion: Math.round(it.protein_g * p), carbs_portion: Math.round(it.carbs_g * p), fat_portion: Math.round(it.fat_g * p),
    });
  }
  for (const d of days) d.total_kcal = d.meals.reduce((s, m) => s + m.kcal_portion, 0);
  res.json({ id: plan.id, target_kcal: plan.target_kcal, reason: plan.reason, created_at: plan.created_at, days });
}));

r.post('/regenerate', wrap(async (req, res) => {
  await regeneratePlan(req.userId, 'Kullanıcı isteği');
  res.json({ ok: true });
}));

r.get('/recipes/:id', wrap(async (req, res) => {
  const x = await one('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
  if (!x) return res.status(404).json({ error: 'Tarif bulunamadı.' });
  res.json(recipeOut(x));
}));

export default r;
