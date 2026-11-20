import { Router } from 'express';
import multer from 'multer';
import { pool, query } from '../db.js';
import { wrap } from '../auth.js';
import { MARKERS, latestBlood, loadProfile } from '../services/profile.js';
import { MARKER_INFO, compareBlood, plausibility } from '../services/blood.js';
import { regeneratePlan } from '../services/planner.js';
import { checkBadges } from '../services/badges.js';
import { readBloodPdf } from '../services/ai.js';

const r = Router();
// PDF yalnızca bellekte tutulur, diske yazılmaz (KVKK — R-04)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

r.get('/markers', (req, res) => res.json(Object.entries(MARKER_INFO).map(([code, m]) => ({ code, label: m.label, unit: m.unit }))));

r.get('/', wrap(async (req, res) => {
  const tests = await query('SELECT id, test_date, source, created_at FROM blood_tests WHERE user_id = ? ORDER BY test_date DESC, id DESC', [req.userId]);
  const vals = tests.length ? await query('SELECT test_id, marker, value FROM blood_values WHERE test_id IN (?)', [tests.map((t) => t.id)]) : [];
  res.json(tests.map((t) => ({ ...t, values: Object.fromEntries(vals.filter((v) => v.test_id === t.id).map((v) => [v.marker, Number(v.value)])) })));
}));

// PDF → AI okur → kullanıcı onaylasın diye değerleri döndürür (kaydetmez)
r.post('/parse-pdf', upload.single('file'), wrap(async (req, res) => {
  if (!req.file || req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Lütfen PDF dosyası yükleyin.' });
  const parsed = await readBloodPdf(req.file.buffer);
  req.file.buffer = null;
  const values = Object.fromEntries(Object.entries(parsed.values || {}).filter(([k, v]) => MARKERS.includes(k) && v != null).map(([k, v]) => [k, Number(v)]));
  res.json({ test_date: parsed.test_date, values, issues: plausibility(values), note: 'Lütfen her değeri raporunuzla karşılaştırıp onaylayın.' });
}));

// Kullanıcının onayladığı değerleri kaydet → karşılaştır → uyarı → planı güncelle
r.post('/', wrap(async (req, res) => {
  const b = req.body || {};
  const values = {};
  for (const m of MARKERS) {
    const v = b.values?.[m];
    if (v !== undefined && v !== null && v !== '') {
      const x = Number(String(v).replace(',', '.'));
      if (!Number.isFinite(x)) return res.status(400).json({ error: `${MARKER_INFO[m].label} sayı olmalı.` });
      values[m] = x;
    }
  }
  if (!Object.keys(values).length) return res.status(400).json({ error: 'En az bir değer girin.' });
  const issues = plausibility(values);
  if (issues.length && !b.confirmed) return res.status(422).json({ error: issues[0].message, issues, needsConfirmation: true });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(b.test_date || '') ? b.test_date : new Date().toISOString().slice(0, 10);

  const previous = await latestBlood(req.userId);
  const profile = await loadProfile(req.userId);
  const conn = await pool.getConnection();
  let testId;
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query('INSERT INTO blood_tests (user_id, test_date, source) VALUES (?,?,?)',
      [req.userId, date, b.source === 'pdf_ai' ? 'pdf_ai' : 'manual']);
    testId = ins.insertId;
    await conn.query('INSERT INTO blood_values (test_id, marker, value) VALUES ?', [Object.entries(values).map(([m, v]) => [testId, m, v])]);
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

  const alerts = compareBlood(values, previous, profile.conditions, profile.gender);
  for (const a of alerts) await query('INSERT INTO alerts (user_id, type, marker, message) VALUES (?,?,?,?)', [req.userId, 'doctor', a.marker, a.message]);
  await regeneratePlan(req.userId, 'Yeni kan tahlili');
  const newBadges = await checkBadges(req.userId);
  res.status(201).json({ id: testId, alerts, newBadges });
}));

r.get('/alerts', wrap(async (req, res) => {
  res.json(await query('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20', [req.userId]));
}));

r.post('/alerts/:id/read', wrap(async (req, res) => {
  await query('UPDATE alerts SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ ok: true });
}));

export default r;
