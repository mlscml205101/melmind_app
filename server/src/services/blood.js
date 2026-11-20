// Kan değeri kontrolleri ve "doktorunuza başvurun" uyarıları (Rapor Obj 2).
// Eşikler varsayılandır; diyetisyen görüşmesi (D2, D3) sonrası güncellenecektir.

export const MARKER_INFO = {
  glucose:           { label: 'Açlık kan şekeri', unit: 'mg/dL', plausible: [20, 600], better: 'lower', range: (c) => (c.includes('diabetes') ? [80, 130] : [70, 99]) },
  hba1c:             { label: 'HbA1c', unit: '%', plausible: [3, 20], better: 'lower', range: (c) => (c.includes('diabetes') ? [0, 7] : [0, 5.6]) },
  total_cholesterol: { label: 'Total kolesterol', unit: 'mg/dL', plausible: [50, 600], better: 'lower', range: () => [0, 199] },
  ldl:               { label: 'LDL kolesterol', unit: 'mg/dL', plausible: [10, 400], better: 'lower', range: (c) => (c.includes('high_cholesterol') ? [0, 99] : [0, 129]) },
  hdl:               { label: 'HDL kolesterol', unit: 'mg/dL', plausible: [5, 200], better: 'higher', range: (c, g) => [g === 'male' ? 40 : 50, 999] },
  triglycerides:     { label: 'Trigliserit', unit: 'mg/dL', plausible: [10, 2000], better: 'lower', range: () => [0, 149] },
};

/** Değer makul aralıkta mı? (yapay zekâ yanlış okursa kullanıcıya sorulur) */
export function plausibility(values) {
  const issues = [];
  for (const [m, v] of Object.entries(values)) {
    const info = MARKER_INFO[m];
    if (!info) continue;
    if (v < info.plausible[0] || v > info.plausible[1]) issues.push({ marker: m, message: `${info.label} değeri (${v}) olağandışı görünüyor, lütfen kontrol edin.` });
  }
  return issues;
}

/**
 * Yeni değerleri bir önceki tahlille ve hedef aralıkla karşılaştırır.
 * @returns {Array<{marker, message}>}
 */
export function compareBlood(newValues, previousValues, conditions = [], gender = 'female') {
  const alerts = [];
  for (const [m, v] of Object.entries(newValues)) {
    const info = MARKER_INFO[m];
    if (!info) continue;
    const [lo, hi] = info.range(conditions, gender);
    const prev = previousValues[m];
    const outside = v < lo || v > hi;
    let worse = false;
    if (prev != null && prev > 0) {
      const change = (v - prev) / prev;
      worse = info.better === 'lower' ? change > 0.03 : change < -0.03;
    }
    if (outside || worse) {
      const parts = [];
      if (worse) parts.push(`önceki tahlile göre kötüleşti (${prev} → ${v} ${info.unit})`);
      if (outside) parts.push(`hedef aralığın dışında (${v} ${info.unit})`);
      alerts.push({ marker: m, message: `${info.label} ${parts.join(' ve ')}. Lütfen doktorunuza başvurun.` });
    }
  }
  return alerts;
}
