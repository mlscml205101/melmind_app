import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool, one } from '../db.js';
import { signToken, wrap } from '../auth.js';
import { loadProfile, waterGoal } from '../services/profile.js';
import { regeneratePlan } from '../services/planner.js';
import { ALLERGENS, CONDITIONS } from '../services/compatibility.js';

const r = Router();

export function validateProfile(b, partial = false) {
  const errs = [];
  const need = (k, ok, msg) => { if ((!partial || b[k] !== undefined) && !ok) errs.push(msg); };
  need('name', typeof b.name === 'string' && b.name.trim().length >= 2, 'Ad en az 2 karakter olmalı.');
  need('age', Number(b.age) >= 13 && Number(b.age) <= 110, 'Yaş 13–110 arasında olmalı.');
  need('gender', ['female', 'male'].includes(b.gender), 'Cinsiyet seçin.');
  need('height_cm', Number(b.height_cm) >= 100 && Number(b.height_cm) <= 230, 'Boy 100–230 cm arasında olmalı.');
  need('weight_kg', Number(b.weight_kg) >= 30 && Number(b.weight_kg) <= 300, 'Kilo 30–300 kg arasında olmalı.');
  if (b.goal !== undefined && !['lose', 'maintain', 'gain'].includes(b.goal)) errs.push('Geçersiz hedef.');
  if (b.activity !== undefined && !['low', 'medium', 'high'].includes(b.activity)) errs.push('Geçersiz aktivite.');
  if (b.diet_type !== undefined && !['none', 'vegetarian', 'vegan'].includes(b.diet_type)) errs.push('Geçersiz diyet tipi.');
  if (b.conditions !== undefined && (!Array.isArray(b.conditions) || b.conditions.some((c) => !CONDITIONS[c]))) errs.push('Geçersiz hastalık kodu.');
  if (b.allergies !== undefined && (!Array.isArray(b.allergies) || b.allergies.some((a) => !ALLERGENS[a]))) errs.push('Geçersiz alerjen kodu.');
  return errs;
}

export async function saveHealthLists(conn, userId, conditions, allergies) {
  if (conditions) {
    await conn.query('DELETE FROM user_conditions WHERE user_id = ?', [userId]);
    if (conditions.length) await conn.query('INSERT INTO user_conditions (user_id, condition_code) VALUES ?', [conditions.map((c) => [userId, c])]);
  }
  if (allergies) {
    await conn.query('DELETE FROM user_allergies WHERE user_id = ?', [userId]);
    if (allergies.length) await conn.query('INSERT INTO user_allergies (user_id, allergen_code) VALUES ?', [allergies.map((a) => [userId, a])]);
  }
}

r.post('/register', wrap(async (req, res) => {
  const b = req.body || {};
  const email = String(b.email || '').trim().toLowerCase();
  const errs = validateProfile(b);
  if (!/^\S+@\S+\.\S+$/.test(email)) errs.unshift('Geçerli bir e-posta girin.');
  if (String(b.password || '').length < 6) errs.unshift('Şifre en az 6 karakter olmalı.');
  if (errs.length) return res.status(400).json({ error: errs[0], errors: errs });
  if (await one('SELECT id FROM users WHERE email = ?', [email])) return res.status(409).json({ error: 'Bu e-posta ile kayıtlı bir hesap var.' });

  const conn = await pool.getConnection();
  let userId;
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query(
      `INSERT INTO users (email, password_hash, name, age, gender, height_cm, weight_kg, goal, activity, diet_type, water_goal_ml)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [email, await bcrypt.hash(b.password, 10), b.name.trim(), b.age, b.gender, b.height_cm, b.weight_kg,
        b.goal || 'maintain', b.activity || 'low', b.diet_type || 'none', waterGoal(b.weight_kg)]);
    userId = ins.insertId;
    await saveHealthLists(conn, userId, [...new Set(b.conditions || [])], [...new Set(b.allergies || [])]);
    await conn.query('INSERT INTO weight_logs (user_id, weight_kg) VALUES (?,?)', [userId, b.weight_kg]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  await regeneratePlan(userId, 'İlk kayıt');
  res.status(201).json({ token: signToken(userId), user: await loadProfile(userId) });
}));

r.post('/login', wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const u = await one('SELECT id, password_hash FROM users WHERE email = ?', [email]);
  if (!u || !(await bcrypt.compare(String(req.body?.password || ''), u.password_hash))) {
    return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
  }
  res.json({ token: signToken(u.id), user: await loadProfile(u.id) });
}));

export default r;
