// Hazır yapay zekâ API'si (model eğitilmez — Rapor 1.3). Anahtar yoksa AI özellikleri kapalıdır,
// uygulama elle giriş ile çalışmaya devam eder.
// Sağlayıcı: AI_PROVIDER=gemini  (GEMINI_API_KEY)  veya  AI_PROVIDER=anthropic  (ANTHROPIC_API_KEY).
// AI_PROVIDER boşsa: yalnızca GEMINI_API_KEY varsa Gemini, aksi halde Anthropic kullanılır.
// SCAN_AI_* değişkenleri varsa önceliklidir (SCAN_AI_PROVIDER, SCAN_AI_API_KEY, SCAN_AI_BASE_URL, SCAN_AI_MODEL).
const env = (scan, legacy) => process.env[scan] || process.env[legacy] || '';
const anthropicKey = () => (process.env.SCAN_AI_PROVIDER || 'anthropic').toLowerCase() === 'anthropic'
  ? env('SCAN_AI_API_KEY', 'ANTHROPIC_API_KEY') : process.env.ANTHROPIC_API_KEY;
const geminiKey = () => (process.env.SCAN_AI_PROVIDER || '').toLowerCase() === 'gemini'
  ? env('SCAN_AI_API_KEY', 'GEMINI_API_KEY') : process.env.GEMINI_API_KEY;
const provider = () => (env('SCAN_AI_PROVIDER', 'AI_PROVIDER') || (geminiKey() && !anthropicKey() ? 'gemini' : 'anthropic')).toLowerCase();

// Anthropic: ANTHROPIC_BASE_URL boşsa Anthropic'in kendi adresi kullanılır. Anahtarı aracı bir satıcıdan aldıysanız
// satıcının adresini yazın. Sondaki /v1 ve /messages otomatik tamamlanır.
const BASE = (env('SCAN_AI_BASE_URL', 'ANTHROPIC_BASE_URL') || 'https://api.anthropic.com').replace(/\/+$/, '');
const API_URL = /\/messages$/.test(BASE) ? BASE : /\/v1$/.test(BASE) ? `${BASE}/messages` : `${BASE}/v1/messages`;
const model = () => env('SCAN_AI_MODEL', 'AI_MODEL') || (provider() === 'gemini' ? 'gemini-2.5-flash' : 'claude-sonnet-5-5');

export const aiEnabled = () => (provider() === 'gemini' ? !!geminiKey() : !!anthropicKey());

export class AiDisabledError extends Error {
  constructor() { super(`Yapay zekâ servisi yapılandırılmamış (SCAN_AI_API_KEY). Değerleri elle girebilirsiniz.`); this.status = 501; }
}

// Geçici hatalar (yoğunluk, hız sınırı, sunucu hatası): tekrar denenir.
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504, 529]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function aiError(res, text) {
  console.error(`[AI] ${res.status}: ${text.slice(0, 500)}`); // ham ayrıntı yalnızca sunucu logunda
  const busy = RETRYABLE.has(res.status);
  const err = new Error(busy
    ? 'Yapay zekâ servisi şu an çok yoğun. Lütfen birkaç dakika sonra tekrar deneyin.'
    : res.status === 401 || res.status === 403
      ? 'Yapay zekâ servisi anahtarı geçersiz veya yetkisiz. Sunucu ayarlarını kontrol edin.'
      : `Yapay zekâ servisi hata verdi (${res.status}). Lütfen daha sonra tekrar deneyin.`);
  err.status = busy ? 503 : 502;
  return err;
}

/** fetch + geçici hatalarda üstel bekleme ile tekrar deneme (1s, 2s, 4s). */
async function fetchWithRetry(url, options, attempts = 4) {
  let res;
  for (let i = 0; i < attempts; i++) {
    try {
      res = await fetch(url, options);
    } catch (e) {
      if (i === attempts - 1) throw Object.assign(new Error('Yapay zekâ servisine ulaşılamadı. İnternet bağlantısını kontrol edin.'), { status: 503 });
      await sleep(1000 * 2 ** i);
      continue;
    }
    if (res.ok || !RETRYABLE.has(res.status) || i === attempts - 1) return res;
    const ra = Number(res.headers.get('retry-after'));
    await sleep(ra > 0 && ra <= 10 ? ra * 1000 : 1000 * 2 ** i + Math.random() * 300);
  }
  return res;
}

// Ana model yoğunsa sırayla bu yedek modeller denenir (AI_FALLBACK_MODELS ile değiştirilebilir).
const geminiModels = () => [model(), ...(process.env.AI_FALLBACK_MODELS || 'gemini-2.5-flash-lite,gemini-2.0-flash')
  .split(',').map((m) => m.trim()).filter(Boolean)].filter((m, i, a) => a.indexOf(m) === i);

async function callGemini({ system, content, maxTokens }) {
  const parts = content.map((b) => (b.type === 'text'
    ? { text: b.text }
    : { inlineData: { mimeType: b.source.media_type, data: b.source.data } }));
  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { maxOutputTokens: maxTokens },
  });
  const models = geminiModels();
  let res;
  for (const [i, m] of models.entries()) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`;
    res = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': geminiKey() },
      body: payload,
    }, i === 0 ? 3 : 2);
    if (res.ok) break;
    // Yoğunluk/hız sınırı veya model bulunamadıysa sıradaki modele geç; diğer hatalarda dur.
    if (!(RETRYABLE.has(res.status) || res.status === 404) || i === models.length - 1) throw aiError(res, await res.text());
    console.warn(`[AI] ${m} kullanılamıyor (${res.status}), ${models[i + 1]} deneniyor`);
  }
  const body = await res.json();
  const text = (body.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n').trim();
  if (!text) throw Object.assign(new Error('AI yanıt vermedi (içerik filtrelenmiş olabilir)'), { status: 502 });
  return text;
}

async function callClaude({ system, content, maxTokens = 1024 }) {
  if (!aiEnabled()) throw new AiDisabledError();
  if (provider() === 'gemini') return callGemini({ system, content, maxTokens: Math.max(maxTokens, 2048) });
  const res = await fetchWithRetry(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicKey(),
      authorization: `Bearer ${anthropicKey()}`, // bazı aracı satıcılar bu başlığı bekler
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: model(), max_tokens: maxTokens, system, messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) throw aiError(res, await res.text());
  const body = await res.json();
  return body.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

function extractJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw Object.assign(new Error('AI yanıtı okunamadı'), { status: 502 });
  return JSON.parse(m[0]);
}

/** Kan tahlili PDF'inden değerleri okur. PDF diske YAZILMAZ (KVKK, R-04). */
export async function readBloodPdf(pdfBuffer) {
  const text = await callClaude({
    system: 'Sen bir laboratuvar raporu okuyucususun. Yalnızca raporda açıkça yazan değerleri çıkar, tahmin etme.',
    content: [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBuffer.toString('base64') } },
      { type: 'text', text: `Bu Türkçe/İngilizce kan tahlili raporundan şu değerleri mg/dL (HbA1c için %) cinsinden çıkar:
glucose (açlık kan şekeri / glukoz), hba1c, total_cholesterol, ldl, hdl, triglycerides.
Birim mmol/L ise mg/dL'ye çevir (glukoz ×18, kolesterol ×38.67, trigliserit ×88.57).
Raporda olmayan değeri null yaz. Sadece JSON döndür:
{"test_date":"YYYY-MM-DD veya null","values":{"glucose":null,"hba1c":null,"total_cholesterol":null,"ldl":null,"hdl":null,"triglycerides":null}}` },
    ],
  });
  return extractJson(text);
}

/** Tabak fotoğrafından kalori tahmini (tahmindir, kullanıcı düzenleyebilir — E-03) */
export async function analyzeMealPhoto(imageBuffer, mediaType) {
  const text = await callClaude({
    system: 'Sen bir beslenme asistanısın. Türk mutfağını iyi bilirsin. Değerleri TÜRKOMP verilerine yakın tahmin et.',
    content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBuffer.toString('base64') } },
      { type: 'text', text: `Tabaktaki yiyecekleri ve yaklaşık porsiyonları belirle. Sadece JSON döndür:
{"name":"öğünün kısa Türkçe adı","items":[{"name":"...","grams":0,"kcal":0}],"kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0}` },
    ],
  });
  return extractJson(text);
}

// Yapay zekâ koçu için kesin sınırlar (Rapor D5): teşhis, ilaç/doz, kesin iyileşme vaadi yok.
const BLOCKED = [
  /ila[cç]/i, /insülin|insulin/i, /\bdoz/i, /te[sş]his/i, /hastal[ıi]ğ?[ıi]m var m[ıi]/i, /diyabet miyim/i,
  /(b[ıi]rak|kes)(abilir|meli)\s*miyim/i, /re[cç]ete/i, /metformin|statin|tansiyon hapı/i,
];
export const COACH_REFUSAL = 'Bu soru tıbbi teşhis veya ilaç kullanımıyla ilgili. MelMind bu konularda yanıt veremez; lütfen doktorunuza veya eczacınıza danışın.';

export function coachGuard(question) {
  return BLOCKED.some((re) => re.test(question));
}

export async function askCoach(question, profile) {
  const ctx = `Kullanıcı: ${profile.age} yaş, ${profile.gender === 'male' ? 'erkek' : 'kadın'}, hedef: ${profile.goal}. ` +
    `Kronik durumlar: ${profile.conditions.join(', ') || 'yok'}. Alerjiler: ${profile.allergies.join(', ') || 'yok'}.`;
  return callClaude({
    maxTokens: 700,
    system: `Sen MelMind'ın beslenme koçusun. Türkiye Beslenme Rehberi (TÜBER 2022) ve güvenilir kaynaklara dayanarak kısa, sade Türkçe yanıt ver.
KESİN KURALLAR: Asla hastalık teşhisi koyma. Asla ilaç, doz veya insülin önerisi yapma; ilaç bırakma/değiştirme sorularına "doktorunuza danışın" de.
"Bu diyet hastalığınızı iyileştirir" gibi kesin iddialarda bulunma. Kullanıcının alerjenlerini içeren hiçbir yiyecek önerme.
Emin olmadığında diyetisyene/doktora yönlendir. ${ctx}`,
    content: [{ type: 'text', text: question }],
  });
}
