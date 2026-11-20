const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const md = require("react-icons/md");
const { applyTheme } = require(process.env.SKILL + "/scripts/apply_theme.js");

const OUT = process.argv[2] || "MelMind_Final.pptx";

const HEX = {
  ink: "0B1F16", forest: "14432D", green: "1F7A4D", mint: "3DDC97", mintSoft: "E3F2E9",
  amber: "E8A33D", amberSoft: "FFF2DC", red: "D64545", redSoft: "FDE8E6", blue: "1E6FB8", blueSoft: "E2EEF9",
  gray: "5B6B62", line: "DCE4DE", paper: "F3F7F4", white: "FFFFFF", darkCard: "16352A",
};
const THEME = {
  name: "MelMind",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: HEX.ink, lt1: HEX.white, dk2: HEX.forest, lt2: HEX.paper,
    accent1: HEX.green, accent2: HEX.mint, accent3: HEX.amber, accent4: HEX.red,
    accent5: HEX.blue, accent6: HEX.gray, hlink: HEX.green, folHlink: "155C39",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.title = "MelMind — Final Presentation";
pres.author = "Melisa Çamli";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
// scheme shortcuts
const INK = C.text1, WHITE = C.background1, FOREST = C.text2, PAPER = C.background2;
const GREEN = C.accent1, MINT = C.accent2, AMBER = C.accent3, RED = C.accent4, BLUE = C.accent5, GRAY = C.accent6;

// ---------- icons ----------
async function icon(Comp, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ---------- layouts ----------
const footer = (dark) => ([
  { text: { text: "MelMind  ·  MEL-DSS  ·  Final Presentation", options: { x: 0.5, y: 5.22, w: 5, h: 0.25, fontSize: 9, color: dark ? MINT : GRAY, margin: 0 } } },
]);
const slideNum = (dark) => ({ x: 9.0, y: 5.22, w: 0.5, h: 0.25, fontSize: 9, color: dark ? MINT : GRAY, align: "right" });

pres.defineSlideMaster({
  title: "LIGHT_CONTENT",
  background: { color: HEX.white },
  objects: [
    ...footer(false),
    { placeholder: { options: { name: "kicker", type: "body", x: 0.5, y: 0.32, w: 9, h: 0.28, fontSize: 11, bold: true, color: GREEN, charSpacing: 3, margin: 0, valign: "top" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.58, w: 9, h: 0.62, fontSize: 30, bold: true, color: INK, margin: 0, valign: "top", align: "left" }, text: "" } },
  ],
  slideNumber: slideNum(false),
});
pres.defineSlideMaster({
  title: "DARK_CONTENT",
  background: { color: HEX.ink },
  objects: [
    ...footer(true),
    { placeholder: { options: { name: "kicker", type: "body", x: 0.5, y: 0.32, w: 9, h: 0.28, fontSize: 11, bold: true, color: MINT, charSpacing: 3, margin: 0, valign: "top" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.58, w: 9, h: 0.62, fontSize: 30, bold: true, color: WHITE, margin: 0, valign: "top", align: "left" }, text: "" } },
  ],
  slideNumber: slideNum(true),
});
pres.defineSlideMaster({
  title: "DARK_COVER",
  background: { color: HEX.ink },
  objects: [],
});

// ---------- helpers ----------
let objN = 0;
const nm = (s) => `${s}-${++objN}`;
function txt(slide, text, o) {
  slide.addText(text, { isTextBox: true, margin: 0, valign: "top", fontSize: 14, color: INK, objectName: nm("text"), ...o });
}
function card(slide, x, y, w, h, fill, o = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: o.r ?? 0.12, fill: { color: fill, transparency: o.transparency || 0 },
    line: o.line ? { color: o.line, width: 0.75 } : { type: "none" },
    shadow: o.shadow ? { type: "outer", color: "0B1F16", opacity: 0.12, blur: 8, offset: 2, angle: 90 } : undefined,
    objectName: nm(o.name || "card"),
  });
}
function iconCircle(slide, img, x, y, d, fill) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: nm("icon-bg") });
  const p = d * 0.25;
  slide.addImage({ data: img, x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: nm("icon") });
}
function newSlide(master, section, kicker, title) {
  const s = pres.addSlide({ masterName: master, sectionTitle: section });
  if (kicker) s.addText(kicker, { placeholder: "kicker" });
  if (title) s.addText(title, { placeholder: "title" });
  return s;
}

// phone mockup showing the barcode result screen
function phone(slide, I, x, y, w, h, variant) {
  const k = w / 2.5;
  card(slide, x, y, w, h, HEX.white, { r: 0.28, name: "phone-frame", transparency: 100 });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.3 * k, fill: { color: "0A0F0C" }, line: { color: "3B5247", width: 1.25 }, shadow: { type: "outer", color: "000000", opacity: 0.45, blur: 18, offset: 6, angle: 90 }, objectName: nm("phone") });
  const sx = x + 0.1 * k, sy = y + 0.1 * k, sw = w - 0.2 * k, sh = h - 0.2 * k;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: sx, y: sy, w: sw, h: sh, rectRadius: 0.22 * k, fill: { color: "F6F8F5" }, line: { type: "none" }, objectName: nm("screen") });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + w / 2 - 0.35 * k, y: sy + 0.07 * k, w: 0.7 * k, h: 0.17 * k, rectRadius: 0.08 * k, fill: { color: "0A0F0C" }, line: { type: "none" }, objectName: nm("notch") });
  const px = sx + 0.15 * k, pw = sw - 0.3 * k;
  let cy = sy + 0.38 * k;
  const f = (n) => Math.max(5, Math.round(n * k * 2) / 2);

  if (variant === "scan") {
    txt(slide, "Ürün Sonucu", { x: px, y: cy, w: pw, h: 0.25 * k, fontSize: f(10), bold: true, color: "16211B" });
    cy += 0.32 * k;
    card(slide, px, cy, pw, 0.55 * k, HEX.white, { r: 0.08 * k, line: HEX.line });
    txt(slide, "Kola (Şekerli) · 330 ml", { x: px + 0.1 * k, y: cy + 0.07 * k, w: pw - 0.2 * k, h: 0.2 * k, fontSize: f(8.5), bold: true, color: "16211B" });
    txt(slide, "Barkod 869000000105 · Open Food Facts", { x: px + 0.1 * k, y: cy + 0.3 * k, w: pw - 0.2 * k, h: 0.18 * k, fontSize: f(6.5), color: "5B6B62" });
    cy += 0.65 * k;
    card(slide, px, cy, pw, 1.12 * k, "FDE8E6", { r: 0.08 * k });
    iconCircle(slide, I.times, px + 0.1 * k, cy + 0.1 * k, 0.3 * k, "B42318");
    txt(slide, "Diyetinize uygun değil", { x: px + 0.48 * k, y: cy + 0.14 * k, w: pw - 0.55 * k, h: 0.24 * k, fontSize: f(9), bold: true, color: "B42318" });
    txt(slide, [
      { text: "Şekerli içecek: 10,6 g / 100 ml", options: { bullet: { indent: 8 }, breakLine: true } },
      { text: "Son HbA1c 7,4 — tip 2 diyabet", options: { bullet: { indent: 8 }, breakLine: true } },
      { text: "Daha uygun: Kola Şekersiz", options: { bullet: { indent: 8 } } },
    ], { x: px + 0.12 * k, y: cy + 0.5 * k, w: pw - 0.2 * k, h: 0.58 * k, fontSize: f(6.8), color: "16211B", paraSpaceAfter: 1 });
    cy += 1.22 * k;
    const rows = [["Şeker", "10,6 g", "Yüksek", "B42318", "FDE8E6"], ["Tuz", "0 g", "Düşük", "1F7A4D", "E3F2E9"], ["Doymuş yağ", "0 g", "Düşük", "1F7A4D", "E3F2E9"], ["Enerji", "42 kcal", "Orta", "A15C00", "FFF2DC"]];
    card(slide, px, cy, pw, (0.27 * rows.length + 0.12) * k, HEX.white, { r: 0.08 * k, line: HEX.line });
    rows.forEach((r, i) => {
      const ry = cy + 0.08 * k + i * 0.27 * k;
      txt(slide, r[0], { x: px + 0.1 * k, y: ry + 0.03 * k, w: 0.8 * k, h: 0.2 * k, fontSize: f(7), color: "16211B" });
      txt(slide, r[1], { x: px + 0.95 * k, y: ry + 0.03 * k, w: 0.55 * k, h: 0.2 * k, fontSize: f(7), color: "5B6B62" });
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px + pw - 0.68 * k, y: ry + 0.02 * k, w: 0.58 * k, h: 0.2 * k, rectRadius: 0.1 * k, fill: { color: r[4] }, line: { type: "none" }, objectName: nm("chip") });
      txt(slide, r[2], { x: px + pw - 0.68 * k, y: ry + 0.02 * k, w: 0.58 * k, h: 0.2 * k, fontSize: f(6.5), bold: true, color: r[3], align: "center", valign: "middle" });
    });
    cy += (0.27 * rows.length + 0.22) * k;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px, y: cy, w: pw, h: 0.36 * k, rectRadius: 0.1 * k, fill: { color: "1F7A4D" }, line: { type: "none" }, objectName: nm("btn") });
    txt(slide, "Yine de günlüğe ekle", { x: px, y: cy, w: pw, h: 0.36 * k, fontSize: f(8), bold: true, color: "FFFFFF", align: "center", valign: "middle" });
  } else {
    txt(slide, "Kan Tahlili", { x: px, y: cy, w: pw, h: 0.25 * k, fontSize: f(10), bold: true, color: "16211B" });
    txt(slide, "AI tarafından okundu · sizin onayınızla", { x: px, y: cy + 0.25 * k, w: pw, h: 0.18 * k, fontSize: f(6.5), color: "5B6B62" });
    cy += 0.55 * k;
    const vals = [["HbA1c", "7,4 %", "6,9 %", true], ["Açlık şekeri", "138 mg/dL", "121", true], ["LDL", "168 mg/dL", "171", false], ["Trigliserit", "142 mg/dL", "150", false]];
    card(slide, px, cy, pw, (0.4 * vals.length + 0.1) * k, HEX.white, { r: 0.08 * k, line: HEX.line });
    vals.forEach((v, i) => {
      const ry = cy + 0.08 * k + i * 0.4 * k;
      txt(slide, v[0], { x: px + 0.1 * k, y: ry, w: 1.0 * k, h: 0.18 * k, fontSize: f(7.5), bold: true, color: "16211B" });
      txt(slide, "önceki: " + v[2], { x: px + 0.1 * k, y: ry + 0.18 * k, w: 1.0 * k, h: 0.16 * k, fontSize: f(6), color: "5B6B62" });
      txt(slide, v[1], { x: px + 0.9 * k, y: ry + 0.04 * k, w: 0.75 * k, h: 0.22 * k, fontSize: f(8), bold: true, color: v[3] ? "B42318" : "16211B", align: "right" });
      slide.addImage({ data: v[3] ? I.upRed : I.downGreen, x: px + pw - 0.25 * k, y: ry + 0.06 * k, w: 0.15 * k, h: 0.15 * k, objectName: nm("trend") });
    });
    cy += (0.4 * vals.length + 0.2) * k;
    card(slide, px, cy, pw, 1.0 * k, "FFF2DC", { r: 0.08 * k });
    iconCircle(slide, I.steth, px + 0.1 * k, cy + 0.1 * k, 0.3 * k, "A15C00");
    txt(slide, "Doktorunuza başvurun", { x: px + 0.48 * k, y: cy + 0.15 * k, w: pw - 0.55 * k, h: 0.22 * k, fontSize: f(8.5), bold: true, color: "A15C00" });
    txt(slide, "HbA1c ve açlık şekeri önceki tahlile göre yükseldi. Değerler birlikte değerlendirildi.", { x: px + 0.12 * k, y: cy + 0.48 * k, w: pw - 0.22 * k, h: 0.48 * k, fontSize: f(6.5), color: "16211B" });
    cy += 1.1 * k;
    txt(slide, "Tıbbi tavsiye değildir · PDF saklanmadı", { x: px, y: cy, w: pw, h: 0.2 * k, fontSize: f(6), italic: true, color: "5B6B62", align: "center" });
  }
}

(async () => {
  const W = "#FFFFFF";
  const I = {
    heart: await icon(fa.FaHeartbeat), pdf: await icon(fa.FaFilePdf), plan: await icon(fa.FaClipboardList),
    camera: await icon(fa.FaCamera), barcode: await icon(fa.FaBarcode), water: await icon(fa.FaTint),
    medal: await icon(fa.FaMedal), robot: await icon(fa.FaRobot), user: await icon(fa.FaUserEdit),
    run: await icon(fa.FaRunning), elder: await icon(md.MdElderly), allergy: await icon(fa.FaAllergies),
    lock: await icon(fa.FaLock), redo: await icon(fa.FaSyncAlt), puzzle: await icon(fa.FaPuzzlePiece),
    keyboard: await icon(fa.FaKeyboard), mobile: await icon(fa.FaMobileAlt), server: await icon(fa.FaServer),
    db: await icon(fa.FaDatabase), brain: await icon(fa.FaBrain), globe: await icon(fa.FaGlobeEurope),
    sensor: await icon(fa.FaWalking), check: await icon(fa.FaCheck), times: await icon(fa.FaTimes),
    excl: await icon(fa.FaExclamation), quest: await icon(fa.FaQuestion), steth: await icon(fa.FaStethoscope),
    ban: await icon(fa.FaBan), syringe: await icon(fa.FaSyringe), layers: await icon(fa.FaLayerGroup),
    userMd: await icon(fa.FaUserMd), plug: await icon(fa.FaPlug), userCheck: await icon(fa.FaUserCheck),
    trash: await icon(fa.FaTrashAlt), cogs: await icon(fa.FaCogs), filter: await icon(fa.FaFilter),
    utensils: await icon(fa.FaUtensils), bell: await icon(fa.FaBell), flask: await icon(fa.FaFlask),
    crown: await icon(fa.FaCrown), leaf: await icon(fa.FaLeaf), arrow: await icon(fa.FaArrowRight, "#8A978F"),
    arrowMint: await icon(fa.FaArrowRight, "#3DDC97"),
    upRed: await icon(fa.FaArrowUp, "#B42318"), downGreen: await icon(fa.FaArrowDown, "#1F7A4D"),
    checkG: await icon(fa.FaCheck, "#1F7A4D"), timesR: await icon(fa.FaTimes, "#B42318"),
    exclA: await icon(fa.FaExclamation, "#A15C00"), questB: await icon(fa.FaQuestion, "#3D5A80"),
    vial: await icon(fa.FaVial), comment: await icon(fa.FaCommentMedical), wifi: await icon(fa.FaWifi),
    weigh: await icon(fa.FaWeight), docker: await icon(fa.FaDocker), shield: await icon(fa.FaShieldAlt),
  };

  // ============ 1. COVER ============
  pres.addSection({ title: "Opening" });
  let s = pres.addSlide({ masterName: "DARK_COVER", sectionTitle: "Opening" });
  s.addShape(pres.shapes.OVAL, { x: 5.55, y: -0.6, w: 5.2, h: 5.2, fill: { color: HEX.forest, transparency: 35 }, line: { type: "none" }, objectName: "glow-1" });
  s.addShape(pres.shapes.OVAL, { x: 4.9, y: 3.3, w: 2.6, h: 2.6, fill: { color: HEX.green, transparency: 75 }, line: { type: "none" }, objectName: "glow-2" });
  txt(s, "FINAL PRESENTATION  ·  FALL 2026", { x: 0.6, y: 0.75, w: 5, h: 0.3, fontSize: 12, bold: true, color: MINT, charSpacing: 4 });
  txt(s, "MelMind", { x: 0.6, y: 1.1, w: 5.2, h: 1.1, fontSize: 66, bold: true, color: WHITE, fit: "none" });
  txt(s, "An AI-supported diet decision support mobile app that reads your blood test, knows your allergies and checks every product you scan", { x: 0.6, y: 2.25, w: 4.9, h: 1.0, fontSize: 17, color: "CFE3D8" });
  const chips = [["React Native · Expo 58", 1.85], ["Node.js · MySQL 8", 1.6], ["Claude / Gemini AI", 1.65]];
  let cx = 0.6;
  for (const [t, w] of chips) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 3.45, w, h: 0.38, rectRadius: 0.19, fill: { color: HEX.darkCard }, line: { color: HEX.mint, width: 0.75 }, objectName: nm("chip") });
    txt(s, t, { x: cx, y: 3.45, w, h: 0.38, fontSize: 11, bold: true, color: MINT, align: "center", valign: "middle" });
    cx += w + 0.15;
  }
  txt(s, [
    { text: "Melisa Çamli", options: { bold: true, color: WHITE, breakLine: true } },
    { text: "2304109040  ·  Project MEL-DSS", options: { color: "9FB8AB" } },
  ], { x: 0.6, y: 4.35, w: 4.5, h: 0.6, fontSize: 13 });
  phone(s, I, 6.75, 0.35, 2.5, 4.95, "scan");
  s.addNotes("Hello, I'm Melisa. This is MelMind, an AI-supported diet decision support app. What you see on the phone is a real screen from the working prototype: a type-2 diabetic user scans a sugary cola and the app says 'not suitable for your diet', and explains why, using her last HbA1c value. In the next minutes I'll show the problem, what I built, how it works inside, how safety is enforced, and the evidence behind every requirement.");

  // ============ 2. PROBLEM ============
  pres.addSection({ title: "Problem & users" });
  s = newSlide("LIGHT_CONTENT", "Problem & users", "THE PROBLEM", "People decide what to eat with missing information");
  card(s, 0.5, 1.5, 2.85, 1.6, HEX.paper);
  txt(s, "20.2%", { x: 0.75, y: 1.62, w: 2.5, h: 0.8, fontSize: 48, bold: true, color: GREEN });
  txt(s, "of people aged 15+ in Türkiye are obese (TÜİK, 2022)", { x: 0.75, y: 2.42, w: 2.45, h: 0.6, fontSize: 12, color: GRAY });
  card(s, 0.5, 3.3, 2.85, 1.6, HEX.paper);
  txt(s, "16.5%", { x: 0.75, y: 3.42, w: 2.5, h: 0.8, fontSize: 48, bold: true, color: RED });
  txt(s, "of adults aged 20–79 have diabetes (IDF, 2024)", { x: 0.75, y: 4.22, w: 2.45, h: 0.6, fontSize: 12, color: GRAY });
  const probs = [
    [I.heart, "P1 · Health data ignored", "Apps look at weight and age only. Blood tests, allergies and diseases are skipped."],
    [I.redo, "P2 · Plans never change", "A diet list stays the same for weeks, even when the body changes."],
    [I.lock, "P3 · Useful features are paid", "Photo logging, barcode scan and plans sit behind subscriptions."],
    [I.puzzle, "P4 · Scattered and tiring", "Calories, steps, water live in different apps. People quit."],
  ];
  probs.forEach((p, i) => {
    const x = 3.65 + (i % 2) * 3.0, y = 1.5 + Math.floor(i / 2) * 1.8;
    card(s, x, y, 2.85, 1.6, HEX.white, { line: HEX.line, shadow: true });
    iconCircle(s, p[0], x + 0.2, y + 0.2, 0.5, i === 0 ? HEX.red : HEX.green);
    txt(s, p[1], { x: x + 0.82, y: y + 0.22, w: 1.95, h: 0.5, fontSize: 13, bold: true, color: INK, valign: "middle" });
    txt(s, p[2], { x: x + 0.2, y: y + 0.82, w: 2.5, h: 0.72, fontSize: 11.5, color: GRAY });
  });
  s.addNotes("Unhealthy eating is a major health problem in Türkiye: one in five adults is obese and one in six has diabetes. Yet the tools people use have four problems. P1: they ignore health data like blood tests and allergies, which can make advice unsafe. P2: plans never change. P3: the useful features are paid. P4: everything is scattered across apps, so people give up. MelMind is designed to solve exactly these four problems.");

  // ============ 3. USERS ============
  s = newSlide("LIGHT_CONTENT", "Problem & users", "WHO IT IS FOR", "Built for four groups that diet apps leave behind");
  const users = [
    [I.run, HEX.green, "Young adults", "18–35", "Need a fast, free and motivating app", "5", "of 14 respondents"],
    [I.elder, HEX.blue, "Older adults", "60+", "Need big buttons and no help from their children", "6", "of 14 — the largest group"],
    [I.heart, HEX.red, "Chronic disease", "T2 diabetes · LDL · BP", "Need advice that respects their blood values", "8", "of 14 have a diagnosis"],
    [I.allergy, HEX.amber, "Food allergies", "Lactose · gluten · nuts", "Need allergen-free plans and product warnings", "9", "of 14 are affected"],
  ];
  users.forEach((u, i) => {
    const x = 0.5 + i * 2.32;
    card(s, x, 1.5, 2.08, 3.45, HEX.paper);
    iconCircle(s, u[0], x + 0.22, 1.72, 0.62, u[1]);
    txt(s, u[2], { x: x + 0.22, y: 2.45, w: 1.75, h: 0.3, fontSize: 15, bold: true, color: INK });
    txt(s, u[3], { x: x + 0.22, y: 2.75, w: 1.75, h: 0.25, fontSize: 11, color: GREEN, bold: true });
    txt(s, u[4], { x: x + 0.22, y: 3.05, w: 1.7, h: 0.7, fontSize: 12, color: GRAY });
    txt(s, u[5], { x: x + 0.22, y: 3.85, w: 1.7, h: 0.62, fontSize: 40, bold: true, color: u[1] });
    txt(s, u[6], { x: x + 0.22, y: 4.47, w: 1.75, h: 0.3, fontSize: 10.5, color: GRAY });
  });
  s.addNotes("I designed for four groups: young adults, older adults over 60, people with a chronic disease, and people with allergies or intolerances. The big numbers come from my survey with 14 participants: six were over 60, eight have a diagnosed chronic disease and nine have an allergy or intolerance. That is why accessibility and allergen safety are core requirements, not extras. The sample is small, so I treat these as indications.");

  // ============ 4. SOLUTION ============
  pres.addSection({ title: "Solution" });
  s = newSlide("DARK_CONTENT", "Solution", "THE SOLUTION", "One free app instead of five");
  const feats = [
    [I.user, "Health profile", "Weight, height, diseases, allergies", "F-01"],
    [I.pdf, "Blood test PDF", "AI reads values, you confirm", "F-02"],
    [I.plan, "Personal plan", "Built from team recipes, allergen-safe", "F-03"],
    [I.camera, "Plate photo", "AI estimates kcal, protein, carbs, fat", "F-04"],
    [I.barcode, "Barcode check", "Suits your diet? Yes, careful or no", "F-05"],
    [I.water, "Water, steps, reminders", "\"1.2 L of 2.5 L — time for a glass!\"", "F-06"],
    [I.medal, "Badges & streaks", "7 badges keep the habit alive", "F-08"],
    [I.robot, "AI nutrition coach", "MelMind Plus — never diagnoses", "F-09"],
  ];
  feats.forEach((f, i) => {
    const x = 0.5 + (i % 4) * 2.3, y = 1.45 + Math.floor(i / 4) * 1.72;
    card(s, x, y, 2.1, 1.55, HEX.darkCard);
    iconCircle(s, f[0], x + 0.18, y + 0.18, 0.5, i === 7 ? HEX.amber : HEX.green);
    txt(s, f[3], { x: x + 1.35, y: y + 0.2, w: 0.58, h: 0.22, fontSize: 9.5, bold: true, color: MINT, align: "right" });
    txt(s, f[1], { x: x + 0.18, y: y + 0.78, w: 1.8, h: 0.28, fontSize: 13, bold: true, color: WHITE });
    txt(s, f[2], { x: x + 0.18, y: y + 1.06, w: 1.8, h: 0.45, fontSize: 10.5, color: "B9CFC3" });
  });
  txt(s, [
    { text: "+  ", options: { color: MINT, bold: true } },
    { text: "Self-updating plan & doctor warning (F-07)   ·   Large-text mode for 60+ users (F-10)", options: { color: "CFE3D8" } },
  ], { x: 0.5, y: 4.88, w: 9, h: 0.28, fontSize: 11.5 });
  s.addNotes("This is the whole product on one slide: ten functions in one app. Sign up with a health profile, optionally upload a blood test PDF that the AI reads and you confirm, get a personal plan, log meals by plate photo or barcode, track water and steps with reminders, and earn badges. The AI nutrition coach is the MelMind Plus feature. Two cross-cutting functions: the plan updates itself with a doctor warning, and a large-text mode for older users. Basic features are free, which solves P3.");

  // ============ 5. JOURNEY ============
  s = newSlide("LIGHT_CONTENT", "Solution", "USER JOURNEY", "A day with MelMind, from sign-up to safe choices");
  const steps = [
    [I.user, "Sign up", "Profile with diseases and allergies in under a minute"],
    [I.pdf, "Upload blood test", "AI extracts HbA1c, LDL, glucose; you confirm each value"],
    [I.plan, "Get a plan", "Daily calorie target and allergen-free meals"],
    [I.camera, "Log a meal", "Plate photo or barcode instead of typing"],
    [I.bell, "Stay on track", "Water, steps, badges, and a doctor warning if needed"],
  ];
  s.addShape(pres.shapes.LINE, { x: 1.1, y: 2.05, w: 7.8, h: 0, line: { color: HEX.line, width: 2, dashType: "dash" }, objectName: "journey-line" });
  steps.forEach((st, i) => {
    const x = 0.5 + i * 1.84;
    iconCircle(s, st[0], x + 0.32, 1.6, 0.9, i === 4 ? HEX.amber : HEX.green);
    s.addShape(pres.shapes.OVAL, { x: x + 0.98, y: 1.52, w: 0.32, h: 0.32, fill: { color: HEX.ink }, line: { color: HEX.white, width: 1.5 }, objectName: nm("step-num") });
    txt(s, String(i + 1), { x: x + 0.98, y: 1.52, w: 0.32, h: 0.32, fontSize: 11, bold: true, color: WHITE, align: "center", valign: "middle" });
    txt(s, st[1], { x, y: 2.7, w: 1.6, h: 0.3, fontSize: 14, bold: true, color: INK });
    txt(s, st[2], { x, y: 3.02, w: 1.6, h: 0.85, fontSize: 11.5, color: GRAY });
  });
  card(s, 0.5, 4.1, 9, 0.85, HEX.mintSoft);
  iconCircle(s, I.redo, 0.72, 4.25, 0.55, HEX.green);
  txt(s, [
    { text: "The plan regenerates itself ", options: { bold: true, color: INK } },
    { text: "the moment weight, profile or blood values change — no more weeks-old diet lists (solves P2).", options: { color: INK } },
  ], { x: 1.45, y: 4.18, w: 7.85, h: 0.7, fontSize: 13, valign: "middle" });
  s.addNotes("Here is the user journey I will show in the live demo. One: sign up with diseases and allergies. Two: optionally upload a blood test; the AI reads the values but the user confirms every one. Three: the app calculates a daily target and builds an allergen-free plan. Four: log meals with a photo or a barcode. Five: water, steps, badges, and a doctor warning when blood values get worse. And whenever any data changes, the plan regenerates immediately.");

  // ============ 6. BARCODE ENGINE ============
  pres.addSection({ title: "How it works" });
  s = newSlide("LIGHT_CONTENT", "How it works", "DEEP DIVE · BARCODE CHECK", "A transparent rule engine, not an AI guess");
  const flow = [
    [I.camera, "Camera", "EAN-13 · EAN-8 · UPC, torch, gallery, manual"],
    [I.db, "MySQL cache", "Known products served instantly (30 days)"],
    [I.globe, "Open Food Facts", "Free open data for unknown barcodes"],
    [I.cogs, "Rule engine", "Your profile + blood values + product"],
    [I.check, "Verdict + reasons", "Every decision explained"],
  ];
  flow.forEach((fl, i) => {
    const x = 0.5 + i * 1.86;
    card(s, x, 1.45, 1.6, 1.15, i === 3 ? HEX.ink : HEX.paper);
    iconCircle(s, fl[0], x + 0.15, 1.57, 0.4, i === 3 ? HEX.mint : HEX.green);
    txt(s, fl[1], { x: x + 0.62, y: 1.57, w: 0.95, h: 0.4, fontSize: 11.5, bold: true, color: i === 3 ? WHITE : INK, valign: "middle" });
    txt(s, fl[2], { x: x + 0.15, y: 2.03, w: 1.35, h: 0.52, fontSize: 9.5, color: i === 3 ? "B9CFC3" : GRAY });
    if (i < 4) s.addImage({ data: I.arrow, x: x + 1.65, y: 1.92, w: 0.16, h: 0.16, objectName: nm("arrow") });
  });
  const rules = [
    ["Allergens", "Labels + Turkish/English keywords; traces count for celiac"],
    ["Diabetes", "Sugar > 22.5 g; stricter if HbA1c ≥ 7 or glucose ≥ 130"],
    ["Blood pressure", "Salt > 1.5 g / 100 g is high"],
    ["Cholesterol", "Saturated & trans fat; stricter if LDL ≥ 160"],
    ["Vegetarian / vegan", "Meat, gelatine, milk, egg, honey detection"],
    ["Weight loss", "Portion warning for ≥ 400 kcal / 100 g"],
  ];
  rules.forEach((r, i) => {
    const x = 0.5 + (i % 2) * 2.95, y = 2.85 + Math.floor(i / 2) * 0.72;
    card(s, x, y, 2.8, 0.62, HEX.white, { line: HEX.line });
    txt(s, r[0], { x: x + 0.15, y: y + 0.06, w: 2.5, h: 0.22, fontSize: 11.5, bold: true, color: GREEN });
    txt(s, r[1], { x: x + 0.15, y: y + 0.28, w: 2.6, h: 0.32, fontSize: 9.5, color: GRAY });
  });
  const verdicts = [[I.checkG, "Suitable for your diet", "E3F2E9", "1F7A4D"], [I.exclA, "Consume with care", "FFF2DC", "A15C00"], [I.timesR, "Not suitable for your diet", "FDE8E6", "B42318"], [I.questB, "Could not be evaluated", "E7EEF7", "3D5A80"]];
  verdicts.forEach((v, i) => {
    const y = 2.85 + i * 0.535;
    card(s, 6.5, y, 3.0, 0.45, v[2], { r: 0.22 });
    s.addImage({ data: v[0], x: 6.68, y: y + 0.12, w: 0.21, h: 0.21, objectName: nm("verdict-icon") });
    txt(s, v[1], { x: 7.02, y, w: 2.4, h: 0.45, fontSize: 12, bold: true, color: v[3], valign: "middle" });
  });
  s.addNotes("This is the part I'm most proud of. The barcode check does not ask an AI — it uses a deterministic rule engine, so every verdict is explainable and testable. The camera reads the barcode, the server checks the MySQL cache, falls back to Open Food Facts, then the rule engine combines the product with the user's profile and latest blood values. Example: for a diabetic user, a medium-sugar product is 'careful', but if her last HbA1c is 7 or higher, it becomes 'not suitable'. Turkish keyword matching avoids false positives like 'karabuğday' being flagged as wheat.");

  // ============ 7. DEMO PERSONAS ============
  s = newSlide("LIGHT_CONTENT", "How it works", "LIVE DEMO SCENARIOS", "Four test users, four different answers");
  const V = { ok: [I.checkG, "E3F2E9", "1F7A4D"], no: [I.timesR, "FDE8E6", "B42318"] };
  const personas = [
    [I.heart, HEX.red, "Type 2 diabetes + hypertension", "HbA1c 7.4", [["Sugary cola", "no"], ["Sugar-free cola", "ok"], ["Sucuk (salt)", "no"]]],
    [I.allergy, HEX.amber, "Lactose intolerance", "Lactose-free plan", [["Milk chocolate", "no"], ["Lactose-free milk", "ok"], ["Chickpeas", "ok"]]],
    [I.leaf, HEX.green, "Celiac disease", "Gluten traces = unsafe", [["Whole-wheat bread", "no"], ["Gluten-free cracker", "ok"], ["Crisps (traces)", "no"]]],
    [I.flask, HEX.blue, "High cholesterol + nut allergy", "LDL 168", [["Full-fat white cheese", "no"], ["Almonds (allergy)", "no"], ["Chickpeas", "ok"]]],
  ];
  personas.forEach((p, i) => {
    const y = 1.45 + i * 0.86;
    card(s, 0.5, y, 9, 0.74, i % 2 ? HEX.white : HEX.paper, { line: i % 2 ? HEX.line : undefined });
    iconCircle(s, p[0], 0.65, y + 0.12, 0.5, p[1]);
    txt(s, p[2], { x: 1.28, y: y + 0.1, w: 2.6, h: 0.3, fontSize: 12.5, bold: true, color: INK });
    txt(s, p[3], { x: 1.28, y: y + 0.4, w: 2.6, h: 0.25, fontSize: 10.5, color: GRAY });
    p[4].forEach((pr, j) => {
      const x = 4.0 + j * 1.83, v = V[pr[1]];
      card(s, x, y + 0.16, 1.72, 0.42, v[1], { r: 0.21 });
      s.addImage({ data: v[0], x: x + 0.13, y: y + 0.29, w: 0.16, h: 0.16, objectName: nm("v") });
      txt(s, pr[0], { x: x + 0.36, y: y + 0.16, w: 1.33, h: 0.42, fontSize: 10.5, bold: true, color: v[2], valign: "middle" });
    });
  });
  s.addImage({ data: I.checkG, x: 0.5, y: 4.93, w: 0.18, h: 0.18, objectName: "tests-check" });
  txt(s, [
    { text: "10 / 10 automated tests pass ", options: { bold: true, color: GREEN } },
    { text: "(node --test) — the same scenarios run on every change", options: { color: GRAY } },
  ], { x: 0.78, y: 4.9, w: 8, h: 0.25, fontSize: 11 });
  s.addNotes("These are the four test users from my report, and they are seeded in the database so the demo is reproducible. Same product, different person, different answer: chickpeas are fine for the lactose user and the cholesterol user, but sucuk is not suitable for the hypertensive user because of salt, and crisps are unsafe for the celiac user because of gluten traces. All of these scenarios are automated tests — ten out of ten pass.");

  // ============ 8. BLOOD TEST ============
  s = newSlide("DARK_CONTENT", "How it works", "DEEP DIVE · BLOOD TEST", "From a PDF to a doctor warning, safely");
  phone(s, I, 0.75, 1.3, 2.0, 3.85, "blood");
  const bsteps = [
    [I.pdf, "AI reads only what is printed", "Claude or Gemini extracts glucose, HbA1c, LDL and more — no diagnosis."],
    [I.userCheck, "You confirm every value", "Nothing is used before you check it; corrections replace AI values."],
    [I.trash, "The PDF is never stored", "Values are kept, the file is discarded — KVKK data minimisation."],
    [I.steth, "Values read together", "Worse than before or out of range → \"Please contact your doctor\"."],
  ];
  bsteps.forEach((b, i) => {
    const y = 1.4 + i * 0.95;
    iconCircle(s, b[0], 3.4, y, 0.55, i === 3 ? HEX.amber : HEX.green);
    txt(s, b[1], { x: 4.15, y: y - 0.02, w: 5.3, h: 0.3, fontSize: 14, bold: true, color: WHITE });
    txt(s, b[2], { x: 4.15, y: y + 0.29, w: 5.3, h: 0.5, fontSize: 11.5, color: "B9CFC3" });
    if (i < 3) s.addShape(pres.shapes.LINE, { x: 3.675, y: y + 0.6, w: 0, h: 0.32, line: { color: "2E5A45", width: 1.5 }, objectName: nm("vline") });
  });
  s.addNotes("The blood test flow is built around safety. The AI only extracts values that are printed in the PDF; it never interprets or diagnoses. The user confirms every single value before it is used. The PDF itself is discarded right after reading, following KVKK data minimisation. And following the dietitian's rule, values are always shown together: when they get worse than the previous test or go out of range, the app says 'please contact your doctor' — it never judges one value alone.");

  // ============ 9. PLAN ============
  s = newSlide("LIGHT_CONTENT", "How it works", "DEEP DIVE · PERSONAL PLAN", "Plans that can never contain your allergen");
  const pstats = [["63", "recipes curated by the MelMind team", GREEN], ["0", "allergen meals in tested plans", RED], ["2", "safety layers: recipe tags + AI-independent filter", BLUE]];
  pstats.forEach((p, i) => {
    const x = 0.5 + i * 3.08;
    card(s, x, 1.45, 2.84, 1.35, HEX.paper);
    txt(s, p[0], { x: x + 0.22, y: 1.53, w: 1.1, h: 0.85, fontSize: 50, bold: true, color: p[2] });
    txt(s, p[1], { x: x + 1.25, y: 1.62, w: 1.5, h: 1.05, fontSize: 12, color: GRAY, valign: "middle" });
  });
  const pflow = [[I.user, "Profile & target", "Mifflin-St Jeor calorie and nutrient target"], [I.utensils, "Recipe pool", "Breakfast, lunch, dinner, snacks with tags"], [I.filter, "Allergen filter", "Rules, not AI: blocks every declared allergen"], [I.userMd, "Plan + expert note", "Disease or exclusion → \"follow with a dietitian\""]];
  pflow.forEach((p, i) => {
    const x = 0.5 + i * 2.35;
    card(s, x, 3.05, 2.1, 1.85, i === 2 ? HEX.ink : HEX.white, { line: i === 2 ? undefined : HEX.line, shadow: i !== 2 });
    iconCircle(s, p[0], x + 0.2, 3.25, 0.5, i === 2 ? HEX.mint : HEX.green);
    txt(s, p[1], { x: x + 0.2, y: 3.85, w: 1.8, h: 0.3, fontSize: 13, bold: true, color: i === 2 ? WHITE : INK });
    txt(s, p[2], { x: x + 0.2, y: 4.17, w: 1.75, h: 0.65, fontSize: 10.5, color: i === 2 ? "B9CFC3" : GRAY });
    if (i < 3) s.addImage({ data: I.arrow, x: x + 2.15, y: 3.9, w: 0.16, h: 0.16, objectName: nm("arrow") });
  });
  s.addNotes("The plan is built from 63 recipes prepared by the team, never invented by the AI. Each recipe is tagged with its allergens, and after the plan is created an independent rule filter checks every meal again — so even if something goes wrong upstream, an allergen cannot reach the user. My automated test confirms zero allergen meals across the test profiles. For chronic diseases or excluded foods, the plan adds a note that a doctor or dietitian must follow the diet, as the dietitian required.");

  // ============ 10. ARCHITECTURE ============
  s = newSlide("LIGHT_CONTENT", "How it works", "ARCHITECTURE", "A real three-tier system, not a mock-up");
  const tiers = [
    [I.mobile, "Mobile app", "React Native 0.88 · Expo SDK 58", ["15 screens, bottom-tab navigation", "Camera, pedometer, notifications", "Large-text accessibility mode"], 0.5],
    [I.server, "REST API", "Node.js · Express", ["31 endpoints, token auth", "Rule engine, planner, badges", "AI service with retry & fallback"], 3.65],
    [I.db, "Database", "MySQL 8 · Docker Compose", ["18 relational tables", "Product cache, plans, logs", "Seeded demo users & products"], 6.8],
  ];
  tiers.forEach((t, i) => {
    card(s, t[4], 1.45, 2.7, 2.15, i === 1 ? HEX.ink : HEX.paper);
    iconCircle(s, t[0], t[4] + 0.2, 1.62, 0.55, i === 1 ? HEX.mint : HEX.green);
    txt(s, t[1], { x: t[4] + 0.88, y: 1.62, w: 1.75, h: 0.3, fontSize: 15, bold: true, color: i === 1 ? WHITE : INK });
    txt(s, t[2], { x: t[4] + 0.88, y: 1.92, w: 1.75, h: 0.25, fontSize: 9.5, bold: true, color: i === 1 ? MINT : GREEN });
    txt(s, t[3].map((l, j) => ({ text: l, options: { bullet: true, breakLine: j < 2 } })), { x: t[4] + 0.2, y: 2.4, w: 2.4, h: 1.1, fontSize: 11, color: i === 1 ? "CFE3D8" : GRAY, paraSpaceAfter: 4 });
    if (i < 2) s.addImage({ data: I.arrow, x: t[4] + 2.79, y: 2.42, w: 0.18, h: 0.18, objectName: nm("arrow") });
  });
  const ext = [[I.brain, "AI API", "Claude or Gemini, swappable by config"], [I.globe, "Open Food Facts", "Open barcode database"], [I.sensor, "Phone sensors", "Steps, camera, local reminders"]];
  txt(s, "EXTERNAL SERVICES", { x: 0.5, y: 3.82, w: 3, h: 0.22, fontSize: 10, bold: true, color: GRAY, charSpacing: 2 });
  ext.forEach((e, i) => {
    const x = 0.5 + i * 3.15;
    card(s, x, 4.1, 2.7, 0.8, HEX.white, { line: HEX.line });
    iconCircle(s, e[0], x + 0.15, 4.22, 0.55, HEX.blue);
    txt(s, e[1], { x: x + 0.82, y: 4.2, w: 1.8, h: 0.28, fontSize: 12.5, bold: true, color: INK });
    txt(s, e[2], { x: x + 0.82, y: 4.48, w: 1.85, h: 0.38, fontSize: 10, color: GRAY });
  });
  s.addNotes("Under the hood this is a real three-tier system. The mobile app is React Native with Expo SDK 58, fifteen screens. It talks to a Node.js Express REST API with 31 endpoints, which contains the rule engine, the planner, badge logic and the AI service. Data lives in MySQL 8 with 18 relational tables, and the whole backend can start with Docker Compose. The AI provider is swappable by configuration — Claude or Gemini — and if no AI key is set, the app still fully works with manual entry.");

  // ============ 11. SAFETY ============
  pres.addSection({ title: "Safety & evidence" });
  s = newSlide("DARK_CONTENT", "Safety & evidence", "SAFETY BY DESIGN", "A dietitian's rules, enforced in code");
  const safety = [
    [I.ban, "No diagnosis, no medicine", "The app never diagnoses or suggests medicine or supplements.", "BR-02"],
    [I.syringe, "No insulin math", "No carbohydrate counting or insulin calculation — ever.", "BR-02"],
    [I.layers, "Values read together", "No warning is ever based on one blood value alone.", "BR-04"],
    [I.userMd, "Expert follow-up note", "Disease diets and food exclusions point to a dietitian.", "BR-03"],
    [I.comment, "Coach knows its limits", "Health and disease questions are sent to a doctor.", "FR-09"],
    [I.wifi, "Works without AI", "If AI or barcode service fails, manual entry still works.", "NFR-11"],
  ];
  safety.forEach((sf, i) => {
    const x = 0.5 + (i % 3) * 3.07, y = 1.45 + Math.floor(i / 3) * 1.68;
    card(s, x, y, 2.86, 1.5, HEX.darkCard);
    iconCircle(s, sf[0], x + 0.2, y + 0.2, 0.5, i < 2 ? HEX.red : HEX.green);
    txt(s, sf[3], { x: x + 1.9, y: y + 0.22, w: 0.78, h: 0.22, fontSize: 9.5, bold: true, color: MINT, align: "right" });
    txt(s, sf[1], { x: x + 0.2, y: y + 0.8, w: 2.5, h: 0.28, fontSize: 13, bold: true, color: WHITE });
    txt(s, sf[2], { x: x + 0.2, y: y + 1.08, w: 2.55, h: 0.4, fontSize: 10.5, color: "B9CFC3" });
  });
  txt(s, "Source: written interview with a university dietitian (E-08, Week 4) → business rules BR-02 to BR-05", { x: 0.5, y: 4.88, w: 9, h: 0.26, fontSize: 10.5, italic: true, color: "9FB8AB" });
  s.addNotes("Health apps can hurt people, so safety was not left to the AI. I interviewed a dietitian, and her answers became business rules that are enforced in code. The app never diagnoses or suggests medicine. It never counts carbohydrates or calculates insulin, because she warned that a small mistake there can be life-threatening. Blood values are always read together. Disease diets get an expert follow-up note. The coach refuses health questions and refers to a doctor. And if the AI service is down, the app degrades gracefully.");

  // ============ 12. EVIDENCE ============
  s = newSlide("LIGHT_CONTENT", "Safety & evidence", "EVIDENCE", "Every requirement is backed by evidence");
  card(s, 0.5, 1.45, 4.4, 3.45, HEX.paper);
  txt(s, "Most important function (n = 14)", { x: 0.7, y: 1.6, w: 4, h: 0.28, fontSize: 13, bold: true, color: INK });
  s.addChart(pres.charts.BAR, [{ name: "Votes", labels: ["Water & meal reminders", "Plan from blood values", "Plate photo calories", "Barcode scanning"], values: [5, 4, 3, 2] }], {
    x: 0.6, y: 1.95, w: 4.2, h: 2.85, barDir: "bar", catAxisOrientation: "maxMin", chartColors: [HEX.green],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt",
    catAxisLabelColor: HEX.gray, catAxisLabelFontSize: 10.5, catAxisLabelFontFace: "+mn-lt", valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLineShow: false, showLegend: false, barGapWidthPct: 55,
    objectName: "chart-function",
  });
  card(s, 5.1, 1.45, 4.4, 3.45, HEX.paper);
  txt(s, "Would upload a blood test PDF (n = 14)", { x: 5.3, y: 1.6, w: 4, h: 0.28, fontSize: 13, bold: true, color: INK });
  s.addChart(pres.charts.DOUGHNUT, [{ name: "Upload", labels: ["Yes", "Not sure", "No"], values: [7, 2, 5] }], {
    x: 5.2, y: 1.95, w: 2.4, h: 2.4, holeSize: 62, chartColors: [HEX.green, HEX.amber, "B7C4BC"],
    showValue: false, showPercent: true, dataLabelColor: HEX.white, dataLabelFontSize: 10, dataLabelFontFace: "+mn-lt", showLegend: false,
    objectName: "chart-upload",
  });
  txt(s, [
    { text: "Yes — 7", options: { bold: true, color: GREEN, breakLine: true } },
    { text: "Not sure — 2", options: { bold: true, color: AMBER, breakLine: true } },
    { text: "No — 5", options: { bold: true, color: GRAY } },
  ], { x: 7.75, y: 2.3, w: 1.65, h: 1.0, fontSize: 12.5, paraSpaceAfter: 4 });
  txt(s, "→ Upload stays optional (FR-02, BR-07)", { x: 5.3, y: 4.42, w: 4.1, h: 0.3, fontSize: 11, bold: true, color: GREEN });
  txt(s, "Survey Weeks 4–5 (E-06) · dietitian interview (E-08) · TÜİK & IDF data (E-01) · competitor review (E-02) · Week 3 AI trial (E-05)", { x: 0.5, y: 4.95, w: 9, h: 0.22, fontSize: 9.5, color: GRAY });
  s.addNotes("I didn't guess the requirements. The survey with 14 participants showed that reminders and a plan based on blood values were the most wanted functions. Half would upload a blood test PDF, but five would not share health data — so the upload stays optional. Together with the dietitian interview, national statistics, a competitor review and a technical AI trial, every requirement traces back to evidence.");

  // ============ 13. NUMBERS ============
  s = newSlide("DARK_CONTENT", "Safety & evidence", "BY THE NUMBERS", "What was built this semester");
  const nums = [["10", "functions, F-01 to F-10"], ["31", "REST API endpoints"], ["18", "MySQL tables"], ["15", "mobile screens"], ["63", "curated recipes"], ["31", "requirements: 9 FR · 13 NFR · 9 BR"], ["10/10", "automated tests passing"], ["7", "badges & daily streaks"]];
  nums.forEach((n, i) => {
    const x = 0.5 + (i % 4) * 2.3, y = 1.45 + Math.floor(i / 4) * 1.75;
    card(s, x, y, 2.1, 1.55, HEX.darkCard);
    txt(s, n[0], { x: x + 0.2, y: y + 0.15, w: 1.8, h: 0.8, fontSize: 44, bold: true, color: i === 6 ? MINT : WHITE });
    txt(s, n[1], { x: x + 0.2, y: y + 0.98, w: 1.8, h: 0.5, fontSize: 11.5, color: "B9CFC3" });
  });
  s.addNotes("To put it in numbers: ten functions, 31 API endpoints, 18 database tables, 15 mobile screens, 63 recipes, 31 written requirements, ten automated tests that all pass, and seven badges. All of it built and tested by one student in one semester.");

  // ============ 14. OBJECTIVES ============
  s = newSlide("LIGHT_CONTENT", "Safety & evidence", "MEASURABLE OBJECTIVES", "Seven objectives, each traced to a test");
  const hdr = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: HEX.forest }, fontSize: 11 } });
  const rowsData = [
    ["Obj 1", "Read blood test values", "≥ 90% correct on ~20 PDFs", "FR-02", "Planned"],
    ["Obj 2", "Safe plans, no allergens", "0 allergen meals, 100% doctor notes", "FR-03, FR-07", "Unit-tested"],
    ["Obj 3", "Self-updating plan", "Updated within 1 day of new data", "FR-07", "Implemented"],
    ["Obj 4", "Fast, accurate logging", "< 30 s per meal; ±20% kcal on 80%", "FR-04, FR-05", "Planned"],
    ["Obj 5", "Regular use", "60% log 5 of first 7 days", "FR-06, FR-08", "Planned"],
    ["Obj 6", "Easy for 60+ users", "80% succeed without help", "NFR-05", "Planned"],
    ["Obj 7", "Reliable AI coach", "≥ 90% correct, 0 dangerous", "FR-09", "Planned"],
  ];
  const statusColor = { Planned: [HEX.gray, "EEF2EF"], "Unit-tested": [HEX.green, HEX.mintSoft], Implemented: [HEX.blue, HEX.blueSoft] };
  const rows = [[hdr("ID"), hdr("Objective"), hdr("Target"), hdr("Requirement"), hdr("Status")]];
  rowsData.forEach((r, i) => {
    const bg = i % 2 ? HEX.white : HEX.paper;
    const sc = statusColor[r[4]];
    rows.push([
      { text: r[0], options: { bold: true, color: GREEN, fill: { color: bg } } },
      { text: r[1], options: { bold: true, color: INK, fill: { color: bg } } },
      { text: r[2], options: { color: INK, fill: { color: bg } } },
      { text: r[3], options: { color: GRAY, fill: { color: bg } } },
      { text: r[4], options: { bold: true, color: sc[0], fill: { color: sc[1] } } },
    ]);
  });
  s.addTable(rows, { x: 0.5, y: 1.42, w: 9, colW: [0.8, 2.2, 3.2, 1.45, 1.35], rowH: 0.43, fontSize: 11, fontFace: "Calibri", valign: "middle", border: { type: "solid", color: HEX.line, pt: 0.5 }, margin: [0, 0.08, 0, 0.08], objectName: "objectives-table" });
  s.addNotes("Every objective from week one has a numeric target, a requirement, and a planned test in the traceability matrix. Objective 2, allergen safety and doctor warnings, is already covered by automated tests. Objective 3, the self-updating plan, is implemented — the plan regenerates immediately. The remaining accuracy and usability measurements — 20 blood test PDFs, 30 weighed plates, older-adult sessions and the dietitian's rating of the coach — are scheduled for the testing weeks, and I will report the real numbers as they are.");

  // ============ 15. MARKET ============
  pres.addSection({ title: "Business & next steps" });
  s = newSlide("LIGHT_CONTENT", "Business & next steps", "POSITIONING", "What others charge for, MelMind gives for free");
  const cmp = [
    ["", "MyFitnessPal", "Lose It!", "MelMind"],
    ["Photo meal logging", "Premium", "Premium", "Free · 3/day"],
    ["Personal meal plan", "Premium+", "—", "Free"],
    ["Blood test reading", "Not mentioned", "Not mentioned", "Yes"],
    ["Allergen-safe plans & products", "Not mentioned", "Not mentioned", "Yes"],
    ["Doctor warning on worse values", "Not mentioned", "Not mentioned", "Yes"],
    ["Turkish recipes & guidelines", "—", "—", "Yes"],
  ];
  const trows = cmp.map((r, i) => r.map((c, j) => {
    if (i === 0) return { text: c, options: { bold: true, color: j === 3 ? WHITE : INK, fill: { color: j === 3 ? HEX.green : HEX.white }, align: j ? "center" : "left", fontSize: 12 } };
    const bg = j === 3 ? HEX.mintSoft : (i % 2 ? HEX.paper : HEX.white);
    return { text: c, options: { bold: j === 0 || j === 3, color: j === 3 ? GREEN : (j === 0 ? INK : GRAY), fill: { color: bg }, align: j ? "center" : "left" } };
  }));
  s.addTable(trows, { x: 0.5, y: 1.42, w: 9, colW: [3.0, 2.0, 2.0, 2.0], rowH: 0.47, fontSize: 11.5, fontFace: "Calibri", valign: "middle", border: { type: "solid", color: HEX.line, pt: 0.5 }, margin: [0, 0.1, 0, 0.1], objectName: "compare-table" });
  txt(s, "Competitor features from official pages, reviewed 11 Oct 2026 (MyFitnessPal Premium USD 79.99/yr, Premium+ USD 99.99). No novelty claimed: the contribution is the combination, localisation and free core.", { x: 0.5, y: 4.85, w: 9, h: 0.35, fontSize: 9.5, color: GRAY });
  s.addNotes("Compared with MyFitnessPal and Lose It!, photo logging and personal plans are paid there; in MelMind they are free, with three photo analyses a day. And none of the reviewed sources mention blood test reading, allergen-safe plans or a doctor warning. I don't claim a new technology — the contribution is putting these together, localised for Türkiye, with a free core.");

  // ============ 16. BUSINESS ============
  s = newSlide("LIGHT_CONTENT", "Business & next steps", "BUSINESS MODEL & COST", "Free core, optional Plus, a tiny budget");
  card(s, 0.5, 1.45, 2.9, 3.45, HEX.paper);
  txt(s, "Free", { x: 0.72, y: 1.62, w: 2.5, h: 0.45, fontSize: 24, bold: true, color: INK });
  txt(s, "0 TL — forever", { x: 0.72, y: 2.07, w: 2.5, h: 0.28, fontSize: 12, bold: true, color: GREEN });
  txt(s, ["Health profile & blood test", "Personal plan", "Barcode check", "3 plate photos per day", "Water, steps, badges"].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })), { x: 0.72, y: 2.5, w: 2.55, h: 2.2, fontSize: 12, color: INK, paraSpaceAfter: 6 });
  card(s, 3.6, 1.45, 2.9, 3.45, HEX.ink);
  s.addImage({ data: await icon(fa.FaCrown, "#E8A33D"), x: 5.95, y: 1.67, w: 0.32, h: 0.32, objectName: "crown" });
  txt(s, "MelMind Plus", { x: 3.82, y: 1.62, w: 2.2, h: 0.45, fontSize: 24, bold: true, color: WHITE });
  txt(s, "≈ 1,000 TL / year (hypothesis)", { x: 3.82, y: 2.07, w: 2.6, h: 0.28, fontSize: 12, bold: true, color: AMBER });
  txt(s, ["Everything in Free", "Unlimited plate photos", "AI nutrition coach", "Plus recipe collection", "Demo only this semester"].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })), { x: 3.82, y: 2.5, w: 2.55, h: 2.2, fontSize: 12, color: "CFE3D8", paraSpaceAfter: 6 });
  const bstats = [["≤ 4,720 TL", "total semester cash cost (Claude Pro, API, domain, reserve)", GREEN], ["5 of 14", "would pay for Plus — demand not yet proven", AMBER]];
  bstats.forEach((b, i) => {
    const y = 1.45 + i * 1.78;
    card(s, 6.7, y, 2.8, 1.67, HEX.white, { line: HEX.line, shadow: true });
    txt(s, b[0], { x: 6.9, y: y + 0.18, w: 2.5, h: 0.6, fontSize: 30, bold: true, color: b[2] });
    txt(s, b[1], { x: 6.9, y: y + 0.85, w: 2.45, h: 0.7, fontSize: 11.5, color: GRAY });
  });
  s.addNotes("The business model is freemium. All core functions are free, including three plate photos a day. MelMind Plus adds unlimited photos and the AI coach, at around 1,000 TL a year — that price is still a hypothesis. The whole semester costs at most about 4,720 TL in cash. Honestly, demand is not proven yet: 5 of 14 survey participants would pay, so the free core must be valuable on its own.");

  // ============ 17. CLOSING ============
  s = pres.addSlide({ masterName: "DARK_COVER", sectionTitle: "Business & next steps" });
  s.addShape(pres.shapes.OVAL, { x: -1.6, y: 2.6, w: 4.6, h: 4.6, fill: { color: HEX.forest, transparency: 40 }, line: { type: "none" }, objectName: "glow-3" });
  txt(s, "NEXT · WEEKS 11–13", { x: 0.6, y: 0.6, w: 4, h: 0.3, fontSize: 12, bold: true, color: MINT, charSpacing: 4 });
  txt(s, "Thank you.\nLet's see it live.", { x: 0.6, y: 0.95, w: 4.6, h: 1.7, fontSize: 40, bold: true, color: WHITE, lineSpacingMultiple: 0.95 });
  txt(s, "Questions are welcome — the app, the rule engine or the data.", { x: 0.6, y: 2.75, w: 4.2, h: 0.6, fontSize: 14, color: "CFE3D8" });
  txt(s, "Melisa Çamli  ·  2304109040", { x: 0.6, y: 4.65, w: 4, h: 0.3, fontSize: 12, bold: true, color: WHITE });
  const next = [[I.vial, "Accuracy tests", "20 blood test PDFs · 30 weighed plates vs TÜRKOMP"], [I.elder, "Older-adult sessions", "5–10 users aged 60+, every request for help noted"], [I.userMd, "Dietitian review", "Coach answers rated; numeric warning limits confirmed"], [I.medal, "2-week pilot", "Volunteers test daily logging and water goals"]];
  next.forEach((n, i) => {
    const y = 0.6 + i * 1.12;
    card(s, 5.4, y, 4.1, 0.96, HEX.darkCard);
    iconCircle(s, n[0], 5.6, y + 0.2, 0.56, i === 2 ? HEX.amber : HEX.green);
    txt(s, n[1], { x: 6.35, y: y + 0.14, w: 3.0, h: 0.3, fontSize: 14, bold: true, color: WHITE });
    txt(s, n[2], { x: 6.35, y: y + 0.45, w: 3.05, h: 0.45, fontSize: 11, color: "B9CFC3" });
  });
  s.addNotes("What comes next: accuracy tests with 20 blood test PDFs and 30 weighed plates, sessions with older adults, the dietitian's review of the coach and the numeric warning limits, and a two-week pilot with volunteers. Thank you for listening — now let me show it live on the phone. Suggested demo: log in as diyabet@melmind.test, scan the sugary cola and the sugar-free cola from the demo barcode page, then open the plan and the blood test screen.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("written", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
