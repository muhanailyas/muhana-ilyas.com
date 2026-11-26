// ncs_engine.mjs: client-side inference for the NCS classifier (ncs-hier).
// Reimplements the quality rules (ncshier.data.build_long), the physiological features
// (ncshier.features.phys_features), the measurement tokens (TokenEncoder) and every deployable model:
// multinomial and hierarchical logistic regression, XGBoost, hierarchical XGBoost, the explainable boosting
// machine, NerveSet-H and the textbook rule algorithm. Parity with the analysis code is tested by
// ncshier.export. No network access, no storage. Keep the website copy identical to this file.

export const LE_ATTRS = ["sural_amp", "peroneal_amp", "peroneal_dml", "peroneal_cv", "tibial_amp", "tibial_dml", "tibial_cv", "tibial_f"];
export const UE_ATTRS = ["median_motor_amp", "median_motor_lat", "median_motor_cv", "median_sensory_amp", "median_sensory_lat", "median_sensory_cv",
  "ulnar_motor_amp", "ulnar_motor_lat", "ulnar_motor_cv", "ulnar_sensory_amp", "ulnar_sensory_lat", "ulnar_sensory_cv", "median_f", "ulnar_f"];
export const ATTRS = [...LE_ATTRS, ...UE_ATTRS];
export const COVARIATES = ["age", "sex_male", "height_cm"];
const VOCAB = [...ATTRS, ...COVARIATES];
const AMP_PAIRS = ["sural_amp", "peroneal_amp", "tibial_amp", "median_motor_amp", "median_sensory_amp", "ulnar_motor_amp", "ulnar_sensory_amp"];
const SENSORY = new Set(["sural_amp", ...UE_ATTRS.filter((a) => a.includes("_sensory_"))]);
const REGION = Object.fromEntries([...LE_ATTRS.map((a) => [a, "LE"]), ...UE_ATTRS.map((a) => [a, "UE"])]);
const NERVE = Object.fromEntries([...LE_ATTRS.map((a) => [a, a.split("_")[0]]),
  ...UE_ATTRS.map((a) => [a, a.endsWith("_f") ? a : a.split("_").slice(0, 2).join("_")])]);
export const kind = (a) => (a.endsWith("_amp") ? "amp" : a.endsWith("_cv") ? "cv" : "lat");

const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const mean = (xs) => { const v = xs.filter(isNum); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN; };
const maxNum = (xs) => { const v = xs.filter(isNum); return v.length ? Math.max(...v) : NaN; };
const minNum = (xs) => { const v = xs.filter(isNum); return v.length ? Math.min(...v) : NaN; };

// ------------------------------------------------------------------------------------------ data
/** Quality rules of the analysis. records: [{attr, side: 'R'|'L', value, nr}]. */
export function cleanRecords(records, model) {
  const notes = [];
  const out = [];
  for (const r0 of records) {
    if (!ATTRS.includes(r0.attr)) continue;
    const r = { attr: r0.attr, side: String(r0.side || "R").toUpperCase()[0], value: isNum(r0.value) ? r0.value : NaN, nr: r0.nr ? 1 : 0 };
    if (r.attr.endsWith("_amp") && r.nr === 1 && !isNum(r.value)) r.value = 0;      // no response = amplitude 0
    if (isNum(r.value)) {
      const art = (model.artefact_values || {})[r.attr] || [];
      const [lo, hi] = (model.quality || {})[r.attr] || [-Infinity, Infinity];
      if (art.includes(r.value)) { notes.push({ attr: r.attr, side: r.side, value: r.value, reason: "artefact" }); r.value = NaN; }
      else if (r.value < lo || r.value > hi) { notes.push({ attr: r.attr, side: r.side, value: r.value, reason: "implausible", range: [lo, hi] }); r.value = NaN; }
    }
    if (isNum(r.value) || r.nr === 1) out.push(r);
  }
  return { L: out, notes };
}

function abnormal(attr, value, limits) {
  const lim = limits[attr];
  if (!isNum(value) || !isNum(lim)) return NaN;
  return (kind(attr) === "lat" ? value > lim : value < lim) ? 1 : 0;
}

/** Physiological features of one examination (ncshier.features.phys_features). */
export function features(L, cov, limits) {
  const F = {};
  for (const c of COVARIATES) F[c] = isNum(cov[c]) ? cov[c] : NaN;
  const W = {};
  for (const r of L) {
    if (!isNum(r.value)) continue;
    ((W[r.attr] ??= {})[r.side] ??= []).push(r.value);
  }
  const w = (a, s) => (W[a] && W[a][s] ? mean(W[a][s]) : NaN);
  for (const a of ATTRS) {
    const v = ["R", "L"].map((s) => w(a, s));
    const lo = minNum(v), hi = maxNum(v);
    const lowBad = kind(a) !== "lat";
    F[`w_${a}`] = lowBad ? lo : hi;
    F[`b_${a}`] = lowBad ? hi : lo;
  }
  for (const a of AMP_PAIRS) {
    const r = w(a, "R"), l = w(a, "L");
    const mx = maxNum([r, l]);
    let x = isNum(r) && isNum(l) && mx > 0 ? Math.abs(r - l) / mx : NaN;
    if (mx === 0) x = 0;
    F[`asym_${a}`] = x;
  }
  const perSide = (a, b, op) => ["R", "L"].map((s) => { const x = w(a, s), y = w(b, s); return isNum(x) && isNum(y) ? op(x, y) : NaN; });
  F.mu_sens_lat_diff = maxNum(perSide("median_sensory_lat", "ulnar_sensory_lat", (x, y) => x - y));
  F.mu_motor_lat_diff = maxNum(perSide("median_motor_lat", "ulnar_motor_lat", (x, y) => x - y));
  F.mu_sens_amp_logratio = minNum(perSide("median_sensory_amp", "ulnar_sensory_amp", (x, y) => Math.log1p(x) - Math.log1p(y)));
  const sMean = mean([F.w_sural_amp, F.b_sural_amp]), uMean = mean([F.w_ulnar_sensory_amp, F.b_ulnar_sensory_amp]);
  F.sural_ulnar_logratio = isNum(sMean) && isNum(uMean) ? Math.log1p(sMean) - Math.log1p(uMean) : NaN;
  const A = L.map((r) => {
    let abn = abnormal(r.attr, r.value, limits);
    if (r.nr === 1 && r.attr.endsWith("_amp")) abn = 1;
    return { ...r, abn, region: REGION[r.attr], sens: SENSORY.has(r.attr), nerve: NERVE[r.attr] };
  });
  const byRegion = (reg) => A.filter((r) => r.region === reg);
  F.frac_abn_le = byRegion("LE").length ? mean(byRegion("LE").map((r) => r.abn)) : NaN;
  F.frac_abn_ue = byRegion("UE").length ? mean(byRegion("UE").map((r) => r.abn)) : NaN;
  F.length_gradient = F.frac_abn_le - F.frac_abn_ue;
  const leS = A.filter((r) => r.region === "LE" && r.sens), leM = A.filter((r) => r.region === "LE" && !r.sens);
  F.le_sensory_abn = leS.length ? mean(leS.map((r) => r.abn)) : NaN;
  F.le_motor_abn = leM.length ? mean(leM.map((r) => r.abn)) : NaN;
  F.le_sensorimotor = F.le_sensory_abn * F.le_motor_abn;
  if (A.length) {
    const cnt = {};
    for (const r of A) if (r.abn === 1) cnt[r.attr] = (cnt[r.attr] || 0) + 1;
    F.n_bilateral_abn = Object.values(cnt).filter((n) => n >= 2).length;
    const ns = {};
    for (const r of A) ((ns[r.nerve] ??= {})[r.side] ??= []).push(r.abn);
    F.frac_nerves_abn = mean(Object.values(ns).map((sides) => mean(Object.values(sides).map((v) => maxNum(v)))));
    F.n_no_response = A.reduce((s, r) => s + r.nr, 0);
  } else {
    F.n_bilateral_abn = NaN; F.frac_nerves_abn = NaN; F.n_no_response = NaN;
  }
  for (const k of Object.keys(F)) if (!isNum(F[k])) F[k] = NaN;
  return F;
}

/** Measurement tokens of NerveSet-H (TokenEncoder.encode). */
export function tokens(L, cov, enc, limits) {
  const tv = (a, x) => (a.endsWith("_amp") ? Math.log1p(Math.max(x, 0)) : x);
  const clip = (x) => Math.min(6, Math.max(-6, x));
  const out = [];
  for (const r of L) {
    const [mu, sd] = enc.stats[r.attr] || [0, 1];
    const z = isNum(r.value) ? clip((tv(r.attr, r.value) - mu) / sd) : 0;
    const ab = abnormal(r.attr, r.value, limits);
    out.push([VOCAB.indexOf(r.attr), r.side === "L" ? 1 : r.side === "R" ? 0 : 2, z, isNum(ab) ? ab : 0, r.nr]);
  }
  for (const c of COVARIATES) {
    if (isNum(cov[c])) { const [mu, sd] = enc.stats[c]; out.push([VOCAB.indexOf(c), 2, clip((cov[c] - mu) / sd), 0, 0]); }
  }
  if (!out.length) out.push([0, 2, 0, 0, 0]);          // an empty examination keeps one neutral token
  return out;
}

// ------------------------------------------------------------------------------------------ models
export function softmax(v) {
  const m = Math.max(...v);
  const e = v.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}
const sigmoid = (x) => 1 / (1 + Math.exp(-x));

/** Linear block: log1p for amplitudes, median imputation, standardisation, (multinomial) logistic regression. */
function linearLogits(blk, F) {
  const logits = blk.intercept.slice();
  const z = {};
  for (const f of blk.features) {
    let x = F[f.name];
    const measured = isNum(x);
    if (measured && f.log) x = Math.log1p(x);
    if (!measured) x = f.median;
    z[f.name] = { z: (x - f.mean) / f.scale, measured };
    for (let k = 0; k < logits.length; k++) logits[k] += f.coef[k] * z[f.name].z;
  }
  return { logits, z };
}
function linearProba(blk, F) {
  const { logits, z } = linearLogits(blk, F);
  return { p: logits.length === 1 ? [1 - sigmoid(logits[0]), sigmoid(logits[0])] : softmax(logits), z, logits };
}

/** XGBoost block: sum of tree leaves per output plus the base margin (float32 comparisons, as in XGBoost). */
function xgbProba(blk, F) {
  const x = blk.cols.map((c) => (isNum(F[c]) ? Math.fround(F[c]) : NaN));
  const m = blk.base.slice();
  for (const t of blk.trees) {
    let n = 0;
    while (t.f[n] >= 0) {
      const v = x[t.f[n]];
      n = Number.isNaN(v) ? t.m[n] : v < t.t[n] ? t.y[n] : t.n[n];
    }
    m[t.c] += t.v[n];
  }
  return m.length === 1 ? [1 - sigmoid(m[0]), sigmoid(m[0])] : softmax(m);
}

/** Explainable boosting machine: intercept plus one lookup per term (bin 0 = missing). */
function ebmScores(blk, F) {
  const s = blk.intercept.slice();
  const terms = [];
  for (const term of blk.terms) {
    let cell = term.scores;
    for (const fi of term.features) {
      const x = F[blk.cols[fi]];
      const cuts = blk.cuts[fi][Math.min(term.features.length - 1, blk.cuts[fi].length - 1)];
      let idx = 0;
      if (isNum(x)) { let lo = 0, hi = cuts.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (cuts[mid] <= x) lo = mid + 1; else hi = mid; } idx = lo + 1; }
      cell = cell[Math.min(idx, cell.length - 1)];
    }
    for (let k = 0; k < s.length; k++) s[k] += cell[k];
    terms.push({ features: term.features, contrib: cell });
  }
  return { s, terms };
}

function erf(x) {                                       // accurate to about 1e-15 (series and continued fraction)
  const ax = Math.abs(x);
  if (ax < 3) {
    let sum = x, term = x, n = 0;
    while (Math.abs(term) > 1e-17 * Math.abs(sum) && n < 200) { n++; term *= -x * x / n; sum += term / (2 * n + 1); }
    return (2 / Math.sqrt(Math.PI)) * sum;
  }
  let f = 0;                                            // erfc continued fraction
  for (let k = 60; k >= 1; k--) f = (k / 2) / (ax + f);
  const erfc = Math.exp(-ax * ax) / Math.sqrt(Math.PI) / (ax + f);
  return Math.sign(x) * (1 - erfc);
}
const gelu = (v) => v.map((x) => 0.5 * x * (1 + erf(x / Math.SQRT2)));
const matvec = (W, b, x) => W.map((row, i) => row.reduce((s, w, j) => s + w * x[j], b ? b[i] : 0));
const addv = (a, b) => a.map((x, i) => x + b[i]);
function layerNorm(x, g, b, eps = 1e-5) {
  const mu = x.reduce((s, v) => s + v, 0) / x.length;
  const va = x.reduce((s, v) => s + (v - mu) ** 2, 0) / x.length;
  return x.map((v, i) => ((v - mu) / Math.sqrt(va + eps)) * g[i] + b[i]);
}
function mha(Q, KV, w, heads) {                         // nn.MultiheadAttention without masks (one examination)
  const d = Q[0].length, dh = d / heads;
  const Wq = w.in_w.slice(0, d), Wk = w.in_w.slice(d, 2 * d), Wv = w.in_w.slice(2 * d);
  const bq = w.in_b.slice(0, d), bk = w.in_b.slice(d, 2 * d), bv = w.in_b.slice(2 * d);
  const q = Q.map((x) => matvec(Wq, bq, x)), k = KV.map((x) => matvec(Wk, bk, x)), v = KV.map((x) => matvec(Wv, bv, x));
  return q.map((qi) => {
    const o = new Array(d).fill(0);
    for (let h = 0; h < heads; h++) {
      const sl = (u) => u.slice(h * dh, (h + 1) * dh);
      const sc = k.map((kj) => sl(qi).reduce((s, a, i) => s + a * sl(kj)[i], 0) / Math.sqrt(dh));
      const a = softmax(sc);
      for (let j = 0; j < v.length; j++) for (let i = 0; i < dh; i++) o[h * dh + i] += a[j] * v[j][h * dh + i];
    }
    return matvec(w.out_w, w.out_b, o);
  });
}
function netLogits(net, toks, heads) {
  let h = toks.map(([a, s, ...x]) => addv(addv(net.attr[a], net.side[s]), matvec(net.val2_w, net.val2_b, gelu(matvec(net.val1_w, net.val1_b, x)))));
  for (const L of net.layers) {
    const y = h.map((v) => layerNorm(v, L.n1_g, L.n1_b));
    const at = mha(y, y, L.attn, heads);
    h = h.map((v, i) => addv(v, at[i]));
    h = h.map((v) => addv(v, matvec(L.l2_w, L.l2_b, gelu(matvec(L.l1_w, L.l1_b, layerNorm(v, L.n2_g, L.n2_b))))));
  }
  const z = layerNorm(mha([net.seed], h, net.pool, heads)[0], net.norm_g, net.norm_b);
  return matvec(net.h2_w, net.h2_b, gelu(matvec(net.h1_w, net.h1_b, z)));
}

/** Rule algorithm of Section 3.5 (RuleExpert.predict_class); returns the class and the rule that applied. */
function rule(F, limits, classes) {
  const bad = (col, a) => { const v = F[col]; return kind(a) === "lat" ? v > limits[a] : v < limits[a]; };   // false for NaN
  const f0 = (x) => (isNum(x) ? x : 0);
  const anyAbn = Math.max(f0(F.frac_abn_le), f0(F.frac_abn_ue)) > 0 || f0(F.n_no_response) > 0;
  const pnp = f0(F.le_sensory_abn) > 0 && f0(F.le_motor_abn) > 0 && f0(F.n_bilateral_abn) >= 1;
  const cts = F.mu_sens_lat_diff >= 0.5 || ((bad("w_median_sensory_lat", "median_sensory_lat") || bad("w_median_motor_lat", "median_motor_lat"))
    && !bad("w_ulnar_sensory_lat", "ulnar_sensory_lat"));
  const sensBad = ["sural_amp", "median_sensory_amp", "ulnar_sensory_amp"].some((a) => bad(`w_${a}`, a));
  const motorBad = ["peroneal_amp", "peroneal_dml", "peroneal_cv", "tibial_amp", "tibial_dml", "tibial_cv", "tibial_f", "median_motor_amp",
    "median_motor_cv", "ulnar_motor_amp", "ulnar_motor_lat", "ulnar_motor_cv", "median_f", "ulnar_f"].some((a) => bad(`w_${a}`, a));
  let c = "FOCAL", why = "Abnormal values that fit no more specific rule";
  if (!anyAbn) { c = "NORMAL"; why = "No value beyond the textbook limits"; }
  else if (pnp) { c = "GENERALISED"; why = "Abnormal sural and lower-limb motor responses with bilateral involvement"; }
  else if (cts) { c = "FOCAL"; why = "Median-ulnar latency difference of at least 0.5 ms, or abnormal median latency with a normal ulnar latency"; }
  else if (motorBad && !sensBad) { c = "ROOT"; why = "Abnormal motor or F-wave values with normal sensory responses"; }
  return { k: classes.indexOf(c), why };
}

/** Raw probabilities of one model (before temperature scaling) and model-specific explanation material. */
function rawProba(model, F, toks) {
  const P = model.payload, K = model.classes.length;
  if (model.type === "linear") { const r = linearProba(P, F); return { p: r.p, lin: r }; }
  if (model.type === "rule") {
    const r = rule(F, model.limits, model.classes);
    const p = new Array(K).fill(0.05 / (K - 1)); p[r.k] = 0.95;
    return { p, rule: r };
  }
  if (model.type === "ebm") { const r = ebmScores(P, F); return { p: softmax(r.s), ebm: r }; }
  if (model.type === "nerveset") {
    const lo = P.nets.map((n) => netLogits(n, toks, P.heads));
    const m = lo[0].map((_, k) => lo.reduce((s, l) => s + l[k], 0) / lo.length);
    return { logits: m };
  }
  if (model.type === "xgb") return { p: xgbProba(P, F) };
  if (model.type === "hier") {
    const f = (blk) => (P.base === "xgb" ? { p: xgbProba(blk, F) } : linearProba(blk, F));
    const l1 = f(P.l1), l2 = f(P.l2);
    const p = new Array(K).fill(0);
    P.children.forEach((c, i) => { p[c] = l1.p[1] * l2.p[i]; });
    P.root.forEach((c) => { p[c] = l1.p[0] / P.root.length; });
    const s = p.reduce((a, b) => a + b, 0);
    return { p: p.map((x) => x / s), hier: { l1, l2 } };
  }
  throw new Error(`unknown model type ${model.type}`);
}

function contributions(model, raw, F, top) {
  const K = model.classes.length;
  const lab = (n) => (model.labels || {})[n] || n;
  const fromLinear = (blk, r, k) => blk.features.map((f) => {
    const avg = f.coef.reduce((a, b) => a + b, 0) / f.coef.length;
    const w = f.coef.length === 1 ? (k === 1 ? f.coef[0] : -f.coef[0]) : f.coef[k] - avg;
    return { name: f.name, label: lab(f.name), value: F[f.name], measured: r.z[f.name].measured, effect: w * r.z[f.name].z };
  });
  let out = null;
  if (raw.lin) out = fromLinear(model.payload, raw.lin, top);
  else if (raw.hier && model.payload.base === "linear") {
    const P = model.payload, ci = P.children.indexOf(top);
    out = ci >= 0 ? fromLinear(P.l2, raw.hier.l2, ci) : fromLinear(P.l1, raw.hier.l1, 0);
  } else if (raw.ebm) {
    out = raw.ebm.terms.map((t) => {
      const avg = t.contrib.reduce((a, b) => a + b, 0) / K;
      const name = t.features.map((fi) => model.payload.cols[fi]).join(" × ");
      const v = t.features.length === 1 ? F[model.payload.cols[t.features[0]]] : NaN;
      return { name, label: t.features.map((fi) => lab(model.payload.cols[fi])).join(" × "), value: v, measured: t.features.length > 1 || isNum(v), effect: t.contrib[top] - avg };
    });
  }
  return out ? out.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect)) : null;
}

/** Full prediction of one model for one examination. */
export function predict(model, records, cov) {
  const { L, notes } = cleanRecords(records, model);
  const F = features(L, cov, model.limits);
  const toks = model.type === "nerveset" ? tokens(L, cov, model.payload.enc, model.limits) : null;
  const raw = rawProba(model, F, toks);
  const logp = raw.logits ? (() => { const m = Math.max(...raw.logits); const ls = Math.log(raw.logits.reduce((s, x) => s + Math.exp(x - m), 0)) + m; return raw.logits.map((x) => x - ls); })()
    : raw.p.map((x) => Math.log(Math.min(1, Math.max(1e-9, x))));
  const p = softmax(logp.map((x) => x / (model.T || 1)));      // temperature scaling, as in the analysis
  const classes = model.classes, K = classes.length;
  const top = p.indexOf(Math.max(...p));
  const isRule = model.type === "rule";
  const set = isRule || !model.conformal ? [] : classes.filter((c, k) => 1 - p[k] <= model.conformal.q[c] + 1e-12);
  const abnormalCls = model.hierarchy.ABNORMAL;
  let action = isRule ? "rule" : "refer";
  if (!isRule && set.length === 1) action = "report";
  else if (!isRule && set.length >= 2 && set.every((c) => abnormalCls.includes(c))) action = "abnormal_uncertain";
  const pAbn = classes.reduce((s, c, k) => s + (abnormalCls.includes(c) ? p[k] : 0), 0);
  const pGen = classes.includes("GENERALISED") ? p[classes.indexOf("GENERALISED")] : NaN;
  const single = set.length === 1 && set[0] === classes[top];
  const draft = {};
  if (!isRule) for (const [t, tau] of Object.entries(model.autodraft || {})) {
    draft[t] = { threshold: tau, aboveThreshold: isNum(tau) && p[top] >= tau, singleSet: single, eligible: isNum(tau) && p[top] >= tau && single };
  }
  return { model: model.key, type: model.type, p, classes, top: classes[top], set, action, pAbnormal: pAbn, pGeneralised: pGen, draft,
    contrib: contributions(model, raw, F, top), rule: raw.rule || null, notes, features: F,
    nValues: L.filter((r) => isNum(r.value)).length, nNoResponse: L.filter((r) => r.nr === 1).length,
    limbs: { LE: L.some((r) => REGION[r.attr] === "LE"), UE: L.some((r) => REGION[r.attr] === "UE") } };
}
