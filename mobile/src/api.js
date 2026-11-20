import AsyncStorage from '@react-native-async-storage/async-storage';

// Telefonda test ederken bilgisayarınızın yerel IP adresini yazın (sunucu açılırken konsolda gösterilir).
// mobile/.env dosyası:  EXPO_PUBLIC_API_URL=http://192.168.1.10:4000
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

let token = null;
let onUnauthorized = () => {};

export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
export async function loadToken() { token = await AsyncStorage.getItem('token'); return token; }
export async function saveToken(t) { token = t; if (t) await AsyncStorage.setItem('token', t); else await AsyncStorage.removeItem('token'); }

export class ApiError extends Error {
  constructor(message, status, body) { super(message); this.status = status; this.body = body; }
}

/**
 * Dosya yükleme XMLHttpRequest ile yapılır: yeni Expo sürümlerinde global fetch, React Native'in
 * { uri, name, type } biçimindeki FormData dosyalarını desteklemiyor ve istek hiç gönderilmeden
 * "Network request failed" hatası veriyordu.
 */
function uploadForm(url, method, headers, form, timeoutMs) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.timeout = timeoutMs;
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* JSON değil */ }
      resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, data });
    };
    xhr.onerror = () => reject(Object.assign(new Error('network'), { name: 'NetworkError' }));
    xhr.ontimeout = () => reject(Object.assign(new Error('timeout'), { name: 'AbortError' }));
    xhr.send(form);
  });
}

async function handle(status, ok, data) {
  if (status === 401 && token) onUnauthorized();
  if (!ok) throw new ApiError(data.error || `Hata (${status})`, status, data);
  return data;
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (form) {
    let r;
    try {
      r = await uploadForm(`${API_URL}/api${path}`, method, headers, form, 90000);
    } catch (e) {
      throw new ApiError(e?.name === 'AbortError'
        ? `Sunucu zamanında yanıt vermedi (${API_URL}). Tekrar deneyin.`
        : `Dosya yüklenemedi (${API_URL}). Sunucunun açık olduğundan ve telefonla aynı Wi-Fi ağında olduğunuzdan emin olun.`, 0);
    }
    return handle(r.status, r.ok, r.data);
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      res = await fetch(`${API_URL}/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctrl.signal });
    } finally { clearTimeout(timer); }
  } catch (e) {
    const timeout = e?.name === 'AbortError';
    throw new ApiError(timeout
      ? `Sunucu zamanında yanıt vermedi (${API_URL}). Tekrar deneyin.`
      : `Sunucuya bağlanılamadı (${API_URL}). Sunucunun açık olduğundan ve telefonla aynı Wi-Fi ağında olduğunuzdan emin olun.`, 0);
  }
  const data = await res.json().catch(() => ({}));
  return handle(res.status, res.ok, data);
}

/** expo-image-picker / document-picker sonucunu FormData'ya çevirir */
export function fileForm(field, asset, fallbackType) {
  const form = new FormData();
  const name = asset.fileName || asset.name || asset.uri.split('/').pop();
  // mimeType bazen boş/genel gelir (ör. application/octet-stream) → sunucu reddeder; o durumda varsayılanı kullan
  const type = asset.mimeType && asset.mimeType !== 'application/octet-stream' ? asset.mimeType : fallbackType;
  form.append(field, { uri: asset.uri, name, type });
  return form;
}
