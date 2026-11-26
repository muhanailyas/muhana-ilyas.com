// ncs_ui.mjs: form and result view of the ncs-hier web tool (NCS classifier), with a choice of models. Used by the website page and
// by the single-file version written by ncshier.export. Keep the website copy identical to this file.
import { predict } from "./ncs_engine.mjs";

const LIMBS = [
  { limb: "LE", title: "Lower limb", groups: [
    { name: "Sural, sensory", rows: [["sural_amp", "SNAP amplitude", "µV"]] },
    { name: "Peroneal, motor", rows: [["peroneal_amp", "CMAP amplitude", "mV"], ["peroneal_dml", "Distal latency", "ms"], ["peroneal_cv", "Conduction velocity", "m/s"]] },
    { name: "Tibial, motor", rows: [["tibial_amp", "CMAP amplitude", "mV"], ["tibial_dml", "Distal latency", "ms"], ["tibial_cv", "Conduction velocity", "m/s"], ["tibial_f", "F-wave latency", "ms"]] },
  ] },
  { limb: "UE", title: "Upper limb", groups: [
    { name: "Median, motor", rows: [["median_motor_amp", "CMAP amplitude", "mV"], ["median_motor_lat", "Distal latency", "ms"], ["median_motor_cv", "Conduction velocity", "m/s"], ["median_f", "F-wave latency", "ms"]] },
    { name: "Median, sensory", rows: [["median_sensory_amp", "SNAP amplitude", "µV"], ["median_sensory_lat", "Peak latency", "ms"], ["median_sensory_cv", "Conduction velocity", "m/s"]] },
    { name: "Ulnar, motor", rows: [["ulnar_motor_amp", "CMAP amplitude", "mV"], ["ulnar_motor_lat", "Distal latency", "ms"], ["ulnar_motor_cv", "Conduction velocity", "m/s"], ["ulnar_f", "F-wave latency", "ms"]] },
    { name: "Ulnar, sensory", rows: [["ulnar_sensory_amp", "SNAP amplitude", "µV"], ["ulnar_sensory_lat", "Peak latency", "ms"], ["ulnar_sensory_cv", "Conduction velocity", "m/s"]] },
  ] },
];
const ROWS = LIMBS.flatMap((l) => l.groups.flatMap((g) => g.rows.map((r) => ({ attr: r[0], label: `${g.name.split(",")[0]} ${r[1].toLowerCase()}`, unit: r[2] }))));
const UNIT = Object.fromEntries(ROWS.map((r) => [r.attr, r.unit]));

// Examples for the figure of the paper (?example=... in the single-file version). ncshier.export adds "cohort": a
// representative examination built from the cohort medians of one class (an aggregate, not a single patient).
// "pnp" is fictitious and is used only when the cohort example cannot be built.
export const EXAMPLES = {
  pnp: { cov: { age: 63, sex_male: 1, height_cm: 168 }, nr: { sural_amp: [1, 1] }, v: {
    peroneal_amp: [1.2, 0.9], peroneal_dml: [5.0, 5.3], peroneal_cv: [38, 37], tibial_amp: [2.1, 1.7], tibial_dml: [5.6, 5.9], tibial_cv: [37, 36],
    tibial_f: [60, 61] } },
};

const LOW_INFO = 4;      // fewer recorded values than this: the result is flagged as resting mostly on typical values
// Explanatory texts. The website admin can replace each one (settings.texts); {placeholders} are filled in by the tool.
export const TEXTS = {
  binary_heading: "Two clinical questions",
  binary_abnormal: "Is the study abnormal?",
  binary_pnp: "Is it polyneuropathy?",
  binary_auroc: "validated AUROC {auroc}",
  binary_note: "Both answers are sums of the four probabilities below, so the two views always agree. The AUROC shows how well the model ranked examinations with the condition above those without in validation (0.5 is chance, 1 is perfect).",
  multiclass_heading: "Where is the lesion? Four conclusions",
  diagram_caption: "Filled boxes are the conclusions in the 90% prediction set. A thick outline on Abnormal means that every conclusion in the set is abnormal.",
  set_heading: "What the prediction set means",
  report: "The 90% prediction set holds one conclusion, so this conclusion could be reported after review.",
  abnormal_uncertain: "The 90% prediction set holds {classes} but not normal. The study looks abnormal, but the model cannot say where the lesion lies; localise it with the clinical picture or further tests.",
  refer: "The 90% prediction set holds {classes}. Because it includes normal as well as abnormal conclusions, the model cannot narrow the conclusion enough, and a neurologist should read the study.",
  refer_empty: "The 90% prediction set is empty, so the model cannot narrow the conclusion, and a neurologist should read the study.",
  coverage: "How to read the 90% set: it is built so that, for examinations like those used to develop the model, it contains the neurologist's conclusion in about 90% of cases within each of the four conclusions. Every development examination had a conclusion from a neurologist. In validation the set contained that conclusion for {coverage} of examinations ({cov_min} to {cov_max} across the four conclusions) and missed it for {miss}. Coverage lies slightly above 90% because, with a finite sample, the method rounds towards the safe side.",
  draft_heading: "Automatic draft",
  draft_intro: "A conclusion is offered for automatic drafting, to be checked by a neurologist, only when the prediction set holds that conclusion alone and its probability is above a threshold. The threshold was chosen in validation so that the upper 95% confidence bound of the drafting error stayed at or below the error target.",
  draft_not_offered: "Not offered for this model at the {targets} error target. In validation no probability threshold kept the upper 95% confidence bound of the drafting error at or below the target: too few examinations were both confident enough and correct often enough. This reflects the data and the model, not a fault of the tool.",
  perf_heading: "Validated performance of the models in this tool",
  perf_note: "Repeated patient-grouped nested cross-validation on the development data (523 examinations, one laboratory); not yet confirmed in other laboratories. AUROC: 0.5 is chance, 1 is perfect. Macro: averaged over the four conclusions.",
  limits_note: "Abnormal if: adult limits from Preston and Shapiro (2020), Electromyography and Neuromuscular Disorders, 4th edition. They are used only to flag values and to count abnormal values; the models learn their own boundaries from the data. Limits depend on age, height, temperature and laboratory.",
};
const MISSING_DEFAULT = "Leave untested nerves empty. Each model handles a missing value the way it was trained to: the logistic regressions use the typical value of the development data, XGBoost and the explainable boosting machine follow the branch or bin learned for missing values, and NerveSet-H leaves the untested nerve out. Values outside the plausible range are ignored and listed under the result. The fewer values are entered, the more the result rests on typical values.";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pct = (x, d = 0) => (Number.isFinite(x) ? `${(100 * x).toFixed(d)}%` : "n/a");
// probabilities: never print 0% or 100%, which would overstate certainty
const prob = (x) => (!Number.isFinite(x) ? "n/a" : x < 0.005 ? "<1%" : x > 0.995 ? ">99%" : `${(100 * x).toFixed(0)}%`);
const num = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "n/a");
const cname = (model, c) => (model.class_labels || {})[c] || c;
const fill = (t, v) => String(t).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
const joinOr = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`);
const limitText = (limits, a) => {
  const lim = limits[a];
  return lim == null ? "" : `${a.endsWith("_amp") || a.endsWith("_cv") ? "&lt;" : "&gt;"} ${lim} ${esc(UNIT[a])}`;
};

function formHTML(limits, T) {
  const side = (a, s) => {
    const nr = a.endsWith("_amp") ? `<button type="button" class="ncsc-nr" data-attr="${a}" data-side="${s}" aria-pressed="false" title="No response">NR</button>` : "";
    return `<td><span class="ncsc-cell"><input type="number" inputmode="decimal" step="any" data-attr="${a}" data-side="${s}"
      aria-label="${esc(ROWS.find((r) => r.attr === a).label)}, ${s === "R" ? "right" : "left"}, ${esc(UNIT[a])}">${nr}<span class="ncsc-flag"></span></span></td>`;
  };
  const limb = (l) => `
    <fieldset class="ncsc-limb">
      <legend>${l.title}</legend>
      <table class="ncsc-table">
        <thead><tr><th scope="col">Measure</th><th scope="col">Right</th><th scope="col">Left</th><th scope="col" class="ncsc-lim">Abnormal if</th></tr></thead>
        <tbody>${l.groups.map((g) => `
          <tr class="ncsc-group"><th colspan="4" scope="rowgroup">${g.name}</th></tr>
          ${g.rows.map(([a, lab, u]) => `<tr><th scope="row">${lab} <span class="ncsc-unit">${u}</span></th>${side(a, "R")}${side(a, "L")}<td class="ncsc-lim">${limitText(limits, a)}</td></tr>`).join("")}`).join("")}
        </tbody>
      </table>
    </fieldset>`;
  return `
    <fieldset class="ncsc-patient">
      <legend>Patient</legend>
      <label>Age <span class="ncsc-unit">years</span><input type="number" inputmode="numeric" min="18" max="110" step="1" data-cov="age"></label>
      <label>Sex<select data-cov="sex_male"><option value="">Not given</option><option value="0">Female</option><option value="1">Male</option></select></label>
      <label>Height <span class="ncsc-unit">cm</span><input type="number" inputmode="numeric" min="100" max="230" step="1" data-cov="height_cm"></label>
    </fieldset>
    ${LIMBS.map(limb).join("")}
    <p class="ncsc-hint">Leave a nerve empty if it was not tested. Press NR when no response could be recorded; the amplitude is then taken as zero.
    Values outside the plausible range used in the study are ignored and listed under the result.</p>
    <p class="ncsc-hint ncsc-limits-note">${esc(T.limits_note)}</p>`;
}

function bars(model, res) {
  return `<ul class="ncsc-bars">${res.classes.map((c, k) => {
    const inSet = res.set.includes(c);
    return `<li class="${inSet ? "in" : ""}"><span class="ncsc-bar-label">${esc(cname(model, c))}</span>
      <span class="ncsc-track" aria-hidden="true"><span class="ncsc-fill" style="width:${Math.max(0.5, 100 * res.p[k]).toFixed(1)}%"></span></span>
      <span class="ncsc-val">${prob(res.p[k])}</span><span class="ncsc-tag">${inSet ? "in set" : ""}</span></li>`;
  }).join("")}</ul>`;
}

const ci2 = (pf, k) => (Number.isFinite(pf[k]) ? `${num(pf[k])}${Number.isFinite(pf[`${k}_lo`]) ? ` (95% CI ${num(pf[`${k}_lo`])} to ${num(pf[`${k}_hi`])})` : ""}` : "");

function binaryHTML(model, res, T) {
  const pf = model.performance || {};
  const isRule = res.action === "rule";
  const row = (label, p, aucKey, cls) => {
    const auc = ci2(pf, aucKey);
    const val = isRule ? (p >= 0.5 ? "Yes" : "No") : prob(p);
    return `<li class="${cls}"><span class="ncsc-bin-q">${esc(label)}</span>
      ${isRule ? "" : `<span class="ncsc-track" aria-hidden="true"><span class="ncsc-fill" style="width:${Math.max(0.5, 100 * p).toFixed(1)}%"></span></span>`}
      <span class="ncsc-val">${val}</span>${auc ? `<span class="ncsc-auc">${esc(fill(T.binary_auroc, { auroc: auc }))}</span>` : ""}</li>`;
  };
  return `<h3 class="ncsc-h3">${esc(T.binary_heading)}</h3>
    <ul class="ncsc-bin${isRule ? " rule" : ""}">${row(T.binary_abnormal, res.pAbnormal, "b1_auroc", "abn")}${row(T.binary_pnp, res.pGeneralised, "b2_auroc", "pnp")}</ul>
    <p class="ncsc-muted ncsc-bin-note">${esc(T.binary_note)}</p>`;
}

// Hierarchy of the conclusions, with the classes of the prediction set filled (SVG; colours come from the stylesheet).
function hierarchySVG(model, res) {
  const cls = res.classes, abn = model.hierarchy.ABNORMAL, norm = cls.filter((c) => !abn.includes(c));
  const pOf = (c) => res.p[cls.indexOf(c)];
  const isRule = res.action === "rule";
  const inSet = (c) => (isRule ? c === res.top : res.set.includes(c));
  const abnIn = !isRule && res.set.length > 0 && res.set.every((c) => abn.includes(c));
  const W = 660, bw = 150, bh = 48, y0 = 6, y1 = 84, y2 = 162;
  const xs = abn.map((_, i) => 210 + i * ((W - 210 - bw / 2 - 6) / Math.max(1, abn.length - 1)));
  const xAbn = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : 450, xNorm = 90, xRoot = (xNorm + xAbn) / 2;
  const split = (t) => { const i = t.indexOf(" or "); return i > 0 && t.length > 18 ? [t.slice(0, i), t.slice(i + 1)] : [t]; };
  const node = (x, y, label, p, klass) => {
    const lines = split(label);
    const ty = y + (lines.length > 1 ? 16 : 20);
    return `<g class="ncsc-node ${klass}"><rect x="${x - bw / 2}" y="${y}" width="${bw}" height="${bh}" rx="5"/>
      ${lines.map((l, i) => `<text x="${x}" y="${ty + 12 * i}" text-anchor="middle" class="lab">${esc(l)}</text>`).join("")}
      ${Number.isFinite(p) && !isRule ? `<text x="${x}" y="${y + bh - 7}" text-anchor="middle" class="p">${prob(p)}</text>` : ""}</g>`;
  };
  const edge = (x1, y1_, x2, y2_) => `<path class="ncsc-edge" d="M${x1} ${y1_ + bh} V${(y1_ + bh + y2_) / 2} H${x2} V${y2_}"/>`;
  const pAbn = abn.reduce((s, c) => s + pOf(c), 0);
  const parts = [edge(xRoot, y0, xNorm, y1), edge(xRoot, y0, xAbn, y1), ...xs.map((x) => edge(xAbn, y1, x, y2)),
    node(xRoot, y0, "Examination", NaN, "root"),
    ...norm.map((c) => node(xNorm, y1, cname(model, c), pOf(c), inSet(c) ? "in" : "")),
    node(xAbn, y1, "Abnormal", pAbn, abnIn ? "parent-in" : ""),
    ...abn.map((c, i) => node(xs[i], y2, cname(model, c), pOf(c), inSet(c) ? "in" : ""))];
  const title = isRule ? `Rule result: ${cname(model, res.top)}` : `Prediction set: ${res.set.map((c) => cname(model, c)).join(", ") || "empty"}`;
  // narrow screens: the same tree drawn as an indented list, so that the text stays readable
  const rw = 340, rh = 30, gap = 8, ind = 26;
  const items = [["Examination", NaN, "root", 0], ...norm.map((c) => [cname(model, c), pOf(c), inSet(c) ? "in" : "", 1]),
    ["Abnormal", pAbn, abnIn ? "parent-in" : "", 1], ...abn.map((c) => [cname(model, c), pOf(c), inSet(c) ? "in" : "", 2])];
  const iy = (i) => 2 + i * (rh + gap);
  const nEdges = items.map(([, , , lv], i) => {
    if (!lv) return "";
    const pi = lv === 1 ? 0 : items.findIndex(([l]) => l === "Abnormal");
    const px = (lv - 1) * ind + 12;
    return `<path class="ncsc-edge" d="M${px} ${iy(pi) + rh} V${iy(i) + rh / 2} H${lv * ind}"/>`;
  }).join("");
  const nNodes = items.map(([l, pv, k, lv], i) => `<g class="ncsc-node ${k}"><rect x="${lv * ind}" y="${iy(i)}" width="${rw - lv * ind - 2}" height="${rh}" rx="5"/>
    <text x="${lv * ind + 10}" y="${iy(i) + rh / 2 + 5}" class="lab">${esc(l)}</text>
    ${Number.isFinite(pv) && !isRule ? `<text x="${rw - 12}" y="${iy(i) + rh / 2 + 5}" text-anchor="end" class="p">${prob(pv)}</text>` : ""}</g>`).join("");
  const H2 = iy(items.length) - gap + 4;
  return `<svg class="ncsc-hier wide" viewBox="0 0 ${W} ${y2 + bh + 4}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${parts.join("")}</svg>
    <svg class="ncsc-hier narrow" viewBox="0 0 ${rw} ${H2}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${nEdges}${nNodes}</svg>`;
}

function decision(model, res, T) {
  if (res.action === "rule") {
    return `<p class="ncsc-decision">${esc(cname(model, res.top))}</p><p>Rule that applied: ${esc(res.rule.why)}. The rule algorithm gives one class and no probabilities or prediction set.</p>`;
  }
  const names = res.set.map((c) => cname(model, c).toLowerCase());
  const pf = model.performance || {};
  const byc = Object.values(pf.conformal_coverage_by_class || {}).filter(Number.isFinite);
  const covText = Number.isFinite(pf.conformal_coverage) ? `<p class="ncsc-muted ncsc-cov">${esc(fill(T.coverage, {
    coverage: pct(pf.conformal_coverage, 1), miss: pct(1 - pf.conformal_coverage, 1),
    cov_min: byc.length ? pct(Math.min(...byc), 1) : "n/a", cov_max: byc.length ? pct(Math.max(...byc), 1) : "n/a" }))}</p>` : "";
  let head, body;
  if (res.action === "report") { head = cname(model, res.set[0]); body = T.report; }
  else if (res.action === "abnormal_uncertain") { head = "Abnormal, localisation uncertain"; body = fill(T.abnormal_uncertain, { classes: joinOr(names) }); }
  else { head = "Refer to a neurologist"; body = res.set.length ? fill(T.refer, { classes: joinOr(names) }) : T.refer_empty; }
  return `<p class="ncsc-decision">${esc(head)}</p><p>${esc(body)}</p>${covText}`;
}

function draftHTML(res, T) {
  const few = res.nValues + res.nNoResponse < LOW_INFO;      // no automatic draft from an almost empty examination
  const entries = Object.entries(res.draft).sort((a, b) => Number(a[0]) - Number(b[0]));
  const none = entries.filter(([, d]) => !Number.isFinite(d.threshold)).map(([t]) => `${t}%`);
  const rows = entries.filter(([, d]) => Number.isFinite(d.threshold)).map(([t, d]) => {
    const ok = d.eligible && !few;
    const why = ok ? "" : few ? `; fewer than ${LOW_INFO} values entered` : !d.singleSet ? "; the prediction set has more than one class" : "";
    return `<li>${t}% error target: ${ok ? "<strong>eligible</strong>" : "not eligible"} (largest probability ${prob(Math.max(...res.p))}; needs at least ${pct(d.threshold, 1)}${why})</li>`;
  });
  if (none.length) rows.push(`<li>${esc(fill(T.draft_not_offered, { targets: joinOr(none) }))}</li>`);
  return rows.length ? `<h3 class="ncsc-h3">${esc(T.draft_heading)}</h3>
    <p class="ncsc-draft-intro">${esc(T.draft_intro)}</p><ul class="ncsc-list ncsc-draft">${rows.join("")}</ul>` : "";
}

function contribHTML(model, res) {
  if (res.action === "rule") return "";
  if (!res.contrib) return `<h3 class="ncsc-h3">What moved the prediction</h3><p class="ncsc-muted">Feature contributions are shown for the logistic regressions and the explainable boosting machine, not for ${esc(model.label)}.</p>`;
  const top = res.contrib.slice(0, 6);
  const mx = Math.max(...top.map((c) => Math.abs(c.effect)), 1e-9);
  const fmt = (c) => (!c.measured ? "not entered" : Number.isFinite(c.value) ? num(c.value, Math.abs(c.value) >= 10 ? 0 : 2) : "");
  return `<h3 class="ncsc-h3">What moved the prediction</h3>
    <p>Features that most raised or lowered the probability of ${esc(cname(model, res.top).toLowerCase())}, relative to the other classes. ${model.type === "ebm"
      ? "A missing value falls in the model's bin for missing values, which is neutral when such values were rare in the development data."
      : "Missing values are filled with the typical value of the development data."}</p>
    <ul class="ncsc-contrib">${top.map((c) => `<li><span class="ncsc-c-label">${esc(c.label)}${fmt(c) ? ` <span class="ncsc-unit">(${esc(fmt(c))})</span>` : ""}</span>
      <span class="ncsc-c-track" aria-hidden="true"><span class="ncsc-c-fill ${c.effect >= 0 ? "up" : "down"}" style="width:${(50 * Math.abs(c.effect) / mx).toFixed(1)}%"></span></span>
      <span class="ncsc-c-dir">${c.effect >= 0 ? "raised" : "lowered"}</span></li>`).join("")}</ul>`;
}

function notesHTML(res) {
  const out = [];
  for (const n of res.notes) {
    const lab = ROWS.find((r) => r.attr === n.attr)?.label ?? n.attr;
    out.push(n.reason === "artefact"
      ? `${esc(lab)} (${n.side === "R" ? "right" : "left"}) = ${n.value} was ignored: this exact value was a recurring extraction artefact in the development data.`
      : `${esc(lab)} (${n.side === "R" ? "right" : "left"}) = ${n.value} was ignored: outside the plausible range ${n.range[0]} to ${n.range[1]} ${esc(UNIT[n.attr])}.`);
  }
  if (res.limbs.LE !== res.limbs.UE) out.push(`Only ${res.limbs.LE ? "lower" : "upper"}-limb values were entered. The model fills the other limb with typical values, so its output leans on the limb that was tested.`);
  if (res.nValues + res.nNoResponse > 0 && res.nValues + res.nNoResponse < LOW_INFO) out.push(`Only ${res.nValues + res.nNoResponse} value${res.nValues + res.nNoResponse === 1 ? " was" : "s were"} entered. With so few values the result rests mostly on typical values of the development data; read it with caution.`);
  return out.length ? `<h3 class="ncsc-h3">Notes</h3><ul class="ncsc-list">${out.map((t) => `<li>${t}</li>`).join("")}</ul>` : "";
}

function summaryText(model, res, cov) {
  const lines = [`NCS-hier, ${model.label} (research tool; not for clinical use)`,
    `Patient: age ${cov.age ?? "n/a"}, ${cov.sex_male === 1 ? "male" : cov.sex_male === 0 ? "female" : "sex not given"}`];
  if (res.action !== "rule") lines.push(`Abnormal study ${prob(res.pAbnormal)}; polyneuropathy ${prob(res.pGeneralised)}`);
  lines.push(`Most likely: ${cname(model, res.top)}${res.action === "rule" ? "" : ` (${prob(Math.max(...res.p))})`}`);
  if (res.action !== "rule") {
    lines.push(`90% prediction set: ${res.set.map((c) => cname(model, c)).join(", ") || "empty"}`,
      `Probabilities: ${res.classes.map((c, k) => `${cname(model, c)} ${prob(res.p[k])}`).join("; ")}`);
  }
  return lines.join("\n");
}

function resultHTML(model, res, T) {
  if (!res.nValues && !res.nNoResponse) return `<p class="ncsc-empty">Enter the values of one examination.</p>`;
  const multi = `<h3 class="ncsc-h3">${esc(T.multiclass_heading)}</h3>${hierarchySVG(model, res)}
    ${res.action === "rule" ? "" : `${bars(model, res)}<p class="ncsc-muted ncsc-diagram-cap">${esc(T.diagram_caption)}</p>`}`;
  return `${binaryHTML(model, res, T)}${multi}<h3 class="ncsc-h3">${esc(T.set_heading)}</h3><div class="ncsc-set">${decision(model, res, T)}</div>
    ${draftHTML(res, T)}${contribHTML(model, res)}${notesHTML(res)}
    <p class="ncsc-actions"><button type="button" class="ncsc-btn" data-copy>Copy summary</button>
    <button type="button" class="ncsc-btn" data-compare>Compare all models</button><span class="ncsc-copied" role="status"></span></p>
    <div data-compare-out></div>`;
}

function compareHTML(models, results, labelOf) {
  return `<h3 class="ncsc-h3">All models</h3>
    <table class="ncsc-compare"><thead><tr><th scope="col">Model</th><th scope="col">Abnormal</th><th scope="col">Polyneuropathy</th><th scope="col">Most likely</th><th scope="col">Probability</th><th scope="col">90% set</th></tr></thead>
    <tbody>${results.map(([k, r]) => {
      const m = models[k], rule = r.action === "rule";
      const yn = (x) => (x >= 0.5 ? "Yes" : "No");
      return `<tr><th scope="row">${esc(labelOf(k))}</th><td>${rule ? yn(r.pAbnormal) : prob(r.pAbnormal)}</td><td>${rule ? yn(r.pGeneralised) : prob(r.pGeneralised)}</td>
        <td>${esc(cname(m, r.top))}</td><td>${rule ? "n/a" : prob(Math.max(...r.p))}</td>
        <td>${rule ? "n/a" : esc(r.set.map((c) => cname(m, c)).join(", ") || "empty")}</td></tr>`;
    }).join("")}</tbody></table>
    <p class="ncsc-muted">Models can disagree, most often between focal neuropathy and radiculopathy. Their validated performance is in each model's card.</p>`;
}

function cardHTML(model) {
  const pf = model.performance || {};
  const ci = (k) => (Number.isFinite(pf[k]) ? `${num(pf[k])}${Number.isFinite(pf[`${k}_lo`]) ? ` (95% CI ${num(pf[`${k}_lo`])} to ${num(pf[`${k}_hi`])})` : ""}` : "not yet available");
  const co = model.cohort || {};
  const pr = model.parity || {};
  const rows = [
    ["Model", `${esc(model.label)}${model.params && model.params.C != null ? `; ridge penalty C = ${model.params.C}` : ""}${model.params && model.params.max_depth != null ? `; tree depth ${model.params.max_depth}` : ""}`],
    ["Development data", co.n_exams ? `${co.n_exams} examinations of ${co.n_patients} adults, ${esc(co.centre || "")}, ${co.year_min} to ${co.year_max}${model.demo ? " (demonstration model trained on synthetic data)" : ""}` : "n/a"],
    ["Validation, two clinical questions", `Repeated patient-grouped nested cross-validation. AUROC ${ci("b1_auroc")} for abnormal vs normal and ${ci("b2_auroc")} for polyneuropathy vs the other conclusions`],
    ["Validation, four conclusions", `Macro-averaged AUROC ${ci("macro_auroc")}; macro-F1 ${ci("macro_f1")}`],
  ];
  if (model.conformal) {
    const byc = pf.conformal_coverage_by_class || {};
    const cc = Object.entries(byc).filter(([, v]) => Number.isFinite(v)).map(([c, v]) => `${cname(model, c).toLowerCase()} ${pct(v, 1)}`);
    rows.push(["Prediction sets", `Class-conditional (Mondrian) conformal sets, α = ${model.conformal.alpha}. Coverage in validation ${pct(pf.conformal_coverage, 1)}${cc.length ? ` (${cc.join(", ")})` : ""}; a single conclusion in ${pct(pf.conformal_singleton, 1)} of examinations`]);
    const dr = (t) => {
      const cv = pf[`autodraft_coverage_${t}`], er = pf[`autodraft_error_${t}`];
      if (!Number.isFinite(cv)) return `${t}% target: n/a`;
      return cv > 0 ? `${t}% target: ${pct(cv, 1)} of examinations eligible in validation, observed error ${pct(er, 1)}` : `${t}% target: no examination eligible in validation`;
    };
    rows.push(["Automatic draft", `${dr(5)}; ${dr(10)}. Drafting is offered only for targets with a threshold (see the result).`]);
  }
  rows.push(["Intended use", "Research and teaching: to show how a model of routine nerve conduction values could support the neurologist who writes the conclusion."]);
  rows.push(["Not intended for", "Diagnosis or treatment decisions; use without a neurologist; other laboratories, equipment or populations without local validation; children"]);
  rows.push(["Software check", pr.n ? `The browser reproduces the analysis code for all ${pr.n} development examinations (largest difference in a probability ${Number(pr.max_abs_diff).toExponential(1)})` : "Parity test not yet run"]);
  rows.push(["Version", `${esc(model.version || "")}, ${esc(model.created || "")}`]);
  return `<table class="ncsc-card"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join("")}</tbody></table>`;
}

function perfTableHTML(avail, labelOf, current, T) {
  const rows = avail.filter((m) => m.performance);
  if (!rows.length) return "";
  const f = (x) => (Number.isFinite(x) ? num(x) : "n/a");
  return `<h3 class="ncsc-h3">${esc(T.perf_heading)}</h3>
    <div class="ncsc-scroll"><table class="ncsc-compare ncsc-perf"><thead><tr><th scope="col">Model</th><th scope="col">Abnormal vs normal, AUROC</th>
      <th scope="col">Polyneuropathy vs others, AUROC</th><th scope="col">Four conclusions, macro-AUROC</th><th scope="col">Macro-F1</th><th scope="col">90% set: coverage</th></tr></thead>
    <tbody>${rows.map((m) => { const pf = m.performance; return `<tr class="${m.key === current ? "cur" : ""}"><th scope="row">${esc(labelOf(m.key))}</th>
      <td>${f(pf.b1_auroc)}</td><td>${f(pf.b2_auroc)}</td><td>${f(pf.macro_auroc)}</td><td>${f(pf.macro_f1)}</td><td>${Number.isFinite(pf.conformal_coverage) ? pct(pf.conformal_coverage, 1) : "n/a"}</td></tr>`; }).join("")}</tbody></table></div>
    <p class="ncsc-muted">${esc(T.perf_note)}</p>`;
}

/** Build the tool inside `root`.
 * opts.index: {default, models:[{key, label}]}; opts.loadModel(key) -> Promise<model JSON>;
 * opts.settings: {default_model, models:[{key, label, description, show}], missing_data, texts:{...TEXTS}, collaboration_title,
 *   collaboration, collaboration_link_label, collaboration_link_url} (website admin; all optional);
 * opts.example / opts.model: example and model to show at start (single-file version and figure). */
export async function mount(root, opts) {
  const st = opts.settings || {};
  const T = { ...TEXTS, ...Object.fromEntries(Object.entries(st.texts || {}).filter(([, v]) => typeof v === "string" && v.trim())) };
  const setByKey = Object.fromEntries((st.models || []).map((m) => [m.key, m]));
  const avail = opts.index.models.filter((m) => setByKey[m.key]?.show !== false);
  const order = (st.models || []).map((m) => m.key);
  avail.sort((a, b) => (order.indexOf(a.key) + 1 || 99) - (order.indexOf(b.key) + 1 || 99));
  const labelOf = (k) => setByKey[k]?.label || opts.index.models.find((m) => m.key === k)?.label || k;
  const descOf = (k) => setByKey[k]?.description || "";
  const cache = {};
  const get = async (k) => (cache[k] ??= await opts.loadModel(k));
  let key = opts.model && avail.some((m) => m.key === opts.model) ? opts.model
    : avail.some((m) => m.key === st.default_model) ? st.default_model : avail.some((m) => m.key === opts.index.default) ? opts.index.default : avail[0].key;
  let model = await get(key);

  root.innerHTML = `
    <div class="ncsc-model">
      <label>Model <select data-model>${avail.map((m) => `<option value="${m.key}"${m.key === key ? " selected" : ""}>${esc(labelOf(m.key))}</option>`).join("")}</select></label>
      <p class="ncsc-model-desc" data-model-desc>${esc(descOf(key))}</p>
    </div>
    <div class="ncsc-grid">
      <form class="ncsc-form" autocomplete="off" onsubmit="return false">${formHTML(model.limits, T)}</form>
      <section class="ncsc-result" aria-labelledby="ncsc-res-h"><h2 id="ncsc-res-h" class="ncsc-h2">Result</h2><div aria-live="polite" data-result></div></section>
    </div>
    <section class="ncsc-about"><h2 class="ncsc-h2">About the model</h2><div data-card>${cardHTML(model)}</div>
      <div data-perf>${perfTableHTML(avail, labelOf, key, T)}</div>
      <h3 class="ncsc-h3">Incomplete examinations</h3><p class="ncsc-missing">${esc(st.missing_data || MISSING_DEFAULT)}</p></section>
    ${st.collaboration ? `<section class="ncsc-collab"><h2 class="ncsc-h2">${esc(st.collaboration_title || "Collaborate on external validation")}</h2>
      <p>${esc(st.collaboration)}</p>${st.collaboration_link_url ? `<p><a href="${esc(st.collaboration_link_url)}">${esc(st.collaboration_link_label || "Get in touch")}</a></p>` : ""}</section>` : ""}`;
  const form = root.querySelector(".ncsc-form");
  const out = root.querySelector("[data-result]");
  let last = null, lastCov = {}, lastRec = [];

  const read = () => {
    const records = [];
    form.querySelectorAll("input[data-attr]").forEach((el) => {
      const nrBtn = form.querySelector(`.ncsc-nr[data-attr="${el.dataset.attr}"][data-side="${el.dataset.side}"]`);
      const nr = nrBtn && nrBtn.getAttribute("aria-pressed") === "true";
      const v = el.value === "" ? null : Number(el.value);
      if (nr || v !== null) records.push({ attr: el.dataset.attr, side: el.dataset.side, value: nr ? null : v, nr });
    });
    const cov = {};
    form.querySelectorAll("[data-cov]").forEach((el) => { cov[el.dataset.cov] = el.value === "" ? null : Number(el.value); });
    return { records, cov };
  };
  const flag = (el) => {
    const f = el.parentElement.querySelector(".ncsc-flag");
    const a = el.dataset.attr, lim = model.limits[a], v = el.value === "" ? NaN : Number(el.value);
    let t = "";
    if (Number.isFinite(v) && lim != null) {
      if ((a.endsWith("_amp") || a.endsWith("_cv")) && v < lim) t = "low";
      if (!(a.endsWith("_amp") || a.endsWith("_cv")) && v > lim) t = "high";
    }
    f.textContent = t;
    el.classList.toggle("abn", !!t);
  };
  const update = () => {
    form.querySelectorAll("input[data-attr]").forEach(flag);
    form.querySelectorAll(".ncsc-limb").forEach((fs) => {
      const used = [...fs.querySelectorAll("input")].some((el) => el.value !== "") || fs.querySelector('.ncsc-nr[aria-pressed="true"]');
      fs.classList.toggle("empty", !used);
    });
    const { records, cov } = read();
    last = predict(model, records, cov);
    lastCov = cov; lastRec = records;
    out.innerHTML = resultHTML(model, last, T);
  };
  const load = (k) => {
    const e = EXAMPLES[k];
    if (!e) return;
    for (const [c, v] of Object.entries(e.cov)) { const el = form.querySelector(`[data-cov="${c}"]`); if (el) el.value = String(v); }
    for (const [a, vs] of Object.entries(e.v)) vs.forEach((v, i) => { const el = form.querySelector(`input[data-attr="${a}"][data-side="${i ? "L" : "R"}"]`); if (el && v != null) el.value = String(v); });
    for (const [a, fl] of Object.entries(e.nr || {})) fl.forEach((on, i) => {
      if (!on) return;
      const s = i ? "L" : "R";
      form.querySelector(`.ncsc-nr[data-attr="${a}"][data-side="${s}"]`).setAttribute("aria-pressed", "true");
      const el = form.querySelector(`input[data-attr="${a}"][data-side="${s}"]`); el.value = ""; el.disabled = true;
    });
    update();
  };
  form.addEventListener("input", update);
  // number fields update on every keystroke; a "change" on leaving them would redraw the result under the pointer
  form.addEventListener("change", (ev) => { if (ev.target.tagName === "SELECT") update(); });
  root.querySelector("[data-model]").addEventListener("change", async (ev) => {
    key = ev.target.value;
    root.querySelector("[data-model-desc]").textContent = descOf(key);
    out.innerHTML = `<p class="ncsc-empty">Loading the model…</p>`;
    try { model = await get(key); } catch { out.innerHTML = "<p>The model could not be loaded.</p>"; return; }
    root.querySelector("[data-card]").innerHTML = cardHTML(model);
    root.querySelector("[data-perf]").innerHTML = perfTableHTML(avail, labelOf, key, T);
    update();
  });
  root.addEventListener("click", async (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.classList.contains("ncsc-nr")) {
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(on));
      const el = form.querySelector(`input[data-attr="${b.dataset.attr}"][data-side="${b.dataset.side}"]`);
      el.disabled = on; if (on) el.value = "";
      update();
    } else if (b.hasAttribute("data-copy") && last) {
      const s = root.querySelector(".ncsc-copied");
      (navigator.clipboard ? navigator.clipboard.writeText(summaryText(model, last, lastCov)) : Promise.reject())
        .then(() => { s.textContent = "Copied"; }, () => { s.textContent = "Copy not available in this browser"; });
    } else if (b.hasAttribute("data-compare") && last) {
      const box = root.querySelector("[data-compare-out]");
      box.innerHTML = `<p class="ncsc-muted">Loading the models…</p>`;
      const rs = [];
      for (const m of avail) {
        try { const mm = await get(m.key); rs.push([m.key, predict(mm, lastRec, lastCov)]); } catch { /* skip a model that fails to load */ }
      }
      box.innerHTML = compareHTML(cache, rs, labelOf);
    }
  });
  if (opts.example) load(opts.example); else update();
  return { load, update };
}
