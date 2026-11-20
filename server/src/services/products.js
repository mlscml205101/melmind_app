// Barkod → ürün bilgisi. Önce yerel MySQL (önbellek / demo / kullanıcı eklemeleri), sonra Open Food Facts.
import { query, one, parseJson } from '../db.js';

const OFF_URL = process.env.OFF_BASE_URL || 'https://world.openfoodfacts.org';
const CACHE_DAYS = 30;

export function rowToProduct(r) {
  if (!r) return null;
  return {
    ...r,
    is_beverage: !!r.is_beverage,
    allergens: parseJson(r.allergens), traces: parseJson(r.traces),
    labels: parseJson(r.labels), analysis_tags: parseJson(r.analysis_tags),
  };
}

const n = (v) => (v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

/** Open Food Facts yanıtını products tablosu biçimine çevirir */
export function normalizeOff(barcode, p) {
  const nm = p.nutriments || {};
  let salt = n(nm.salt_100g);
  if (salt == null && n(nm.sodium_100g) != null) salt = n(nm.sodium_100g) * 2.5;
  let kcal = n(nm['energy-kcal_100g']);
  if (kcal == null && n(nm.energy_100g) != null) kcal = n(nm.energy_100g) / 4.184;
  const cats = p.categories_tags || [];
  return {
    barcode,
    name: p.product_name_tr || p.product_name || p.generic_name || 'İsimsiz ürün',
    brand: (p.brands || '').split(',')[0].trim() || null,
    source: 'off',
    is_beverage: cats.includes('en:beverages') && !cats.includes('en:dairies') ? 1 : 0,
    allergens: p.allergens_tags || [],
    traces: p.traces_tags || [],
    labels: p.labels_tags || [],
    analysis_tags: p.ingredients_analysis_tags || [],
    ingredients_text: p.ingredients_text_tr || p.ingredients_text || null,
    kcal_100g: kcal, sugar_100g: n(nm.sugars_100g), carbs_100g: n(nm.carbohydrates_100g), fat_100g: n(nm.fat_100g),
    sat_fat_100g: n(nm['saturated-fat_100g']), trans_fat_100g: n(nm['trans-fat_100g']), salt_100g: salt,
    protein_100g: n(nm.proteins_100g), fiber_100g: n(nm.fiber_100g),
    serving_g: n(p.serving_quantity), nova_group: n(p.nova_group),
    image_url: p.image_front_small_url || p.image_url || null,
  };
}

export async function saveProduct(p) {
  await query(
    `REPLACE INTO products (barcode, name, brand, source, is_beverage, allergens, traces, labels, analysis_tags, ingredients_text,
       kcal_100g, sugar_100g, carbs_100g, fat_100g, sat_fat_100g, trans_fat_100g, salt_100g, protein_100g, fiber_100g,
       serving_g, nova_group, image_url, fetched_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
    [p.barcode, p.name, p.brand, p.source, p.is_beverage ? 1 : 0, JSON.stringify(p.allergens || []), JSON.stringify(p.traces || []),
      JSON.stringify(p.labels || []), JSON.stringify(p.analysis_tags || []), p.ingredients_text,
      p.kcal_100g, p.sugar_100g, p.carbs_100g, p.fat_100g, p.sat_fat_100g, p.trans_fat_100g, p.salt_100g,
      p.protein_100g, p.fiber_100g, p.serving_g, p.nova_group, p.image_url]);
}

async function fetchOff(barcode) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${OFF_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`, {
      headers: { 'User-Agent': 'MelMind/0.1 (ogrenci projesi)' }, signal: ctrl.signal,
    });
    if (!res.ok) return res.status === 404 ? { notFound: true } : { error: `HTTP ${res.status}` };
    const body = await res.json();
    if (body.status !== 1 || !body.product) return { notFound: true };
    return { product: normalizeOff(barcode, body.product) };
  } catch (e) {
    return { error: e.name === 'AbortError' ? 'zaman aşımı' : e.message };
  } finally {
    clearTimeout(t);
  }
}

/** @returns {{product, from:'cache'|'off'|null, offline?:boolean}} */
export async function findProduct(barcode) {
  const cached = await one('SELECT * FROM products WHERE barcode = ?', [barcode]);
  const fresh = cached && (cached.source !== 'off' ||
    (Date.now() - new Date(cached.fetched_at).getTime()) / 864e5 < CACHE_DAYS);
  if (fresh) return { product: rowToProduct(cached), from: 'cache' };

  const r = await fetchOff(barcode);
  if (r.product) {
    await saveProduct(r.product);
    return { product: r.product, from: 'off' };
  }
  if (cached) return { product: rowToProduct(cached), from: 'cache', offline: !!r.error };
  return { product: null, from: null, offline: !!r.error, error: r.error };
}

export function isValidBarcode(code) {
  return /^\d{8,14}$/.test(code);
}
