/* RepCam core: plan, rep tracker, progression. Pure logic, no DOM. */
(function (root) {
  'use strict';

  // pattern: dibujo de ejemplo + métrica de conteo
  // metric: elbow | knee | kneeMin | hip | shoulderAbd | wristDist | heel
  // startHigh: la rep empieza en el valor alto de la métrica
  const PLAN = [
    // Lunes – Torso
    ['L', 'Press banca con barra', 'Rack + banco plano', 4, '6–10', '1–2', 150, 'press_h', 'elbow', true, 2.5, 'Pecho', 'Tríceps', 'Escápulas juntas, barra al pecho medio. Usa los topes de seguridad.'],
    ['L', 'Remo con barra', 'Barra libre', 3, '8–10', '1–2', 120, 'row', 'elbow', true, 2.5, 'Espalda', 'Bíceps', 'Torso a ~45°, tira hacia el ombligo.'],
    ['L', 'Press militar sentado en Smith', 'Smith + banco a 90°', 3, '8–10', '1–2', 120, 'press_v', 'elbow', false, 2.5, 'Hombros', 'Tríceps', 'Baja la barra hasta la barbilla.'],
    ['L', 'Jalón en polea alta', 'Polea alta + barra o manijas', 3, '10–12', '1–2', 90, 'pull', 'elbow', true, 2.5, 'Espalda', 'Bíceps', 'Codos hacia los bolsillos, pecho arriba.'],
    ['L', 'Elevación lateral en polea', 'Polea baja + manija D', 3, '12–20', '0–1', 60, 'raise', 'shoulderAbd', false, 1.25, 'Hombros', '', 'Un brazo a la vez, cable por detrás del cuerpo.'],
    ['L', 'Curl con barra EZ', 'Barra EZ', 2, '10–12', '0–1', 60, 'curl', 'elbow', true, 2.5, 'Bíceps', '', 'Codos quietos a los costados.'],
    ['L', 'Extensión de tríceps en polea', 'Polea alta + cuerda', 2, '10–15', '0–1', 60, 'pushdown', 'elbow', false, 1.25, 'Tríceps', '', 'Abre la cuerda al final.'],
    // Martes – Pierna A
    ['M', 'Sentadilla con barra', 'Rack', 4, '6–10', '1–2', 150, 'squat', 'kneeMin', true, 5, 'Cuádriceps', 'Glúteo', 'Topes de seguridad a la altura del fondo.'],
    ['M', 'Peso muerto rumano con barra', 'Barra libre', 3, '8–10', '1–2', 120, 'hinge', 'hip', true, 5, 'Femoral', 'Glúteo', 'Cadera atrás, barra pegada a las piernas.'],
    ['M', 'Sentadilla en Smith pies adelantados', 'Smith', 3, '10–15', '1–2', 120, 'squat', 'kneeMin', true, 5, 'Cuádriceps', 'Glúteo', 'Reemplaza la prensa.'],
    ['M', 'Curl femoral en polea baja', 'Polea baja + tobillera', 3, '10–12', '0–1', 75, 'legcurl', 'knee', true, 1.25, 'Femoral', '', 'Boca abajo en el banco. Alternativa: curl nórdico.'],
    ['M', 'Gemelo de pie en Smith', 'Smith + disco bajo la punta', 5, '10–15', '0–1', 60, 'calf', 'heel', false, 5, 'Gemelo', '', 'Pausa 1 s abajo, estiramiento completo.'],
    // Miércoles – Empuje
    ['X', 'Press inclinado con mancuernas', 'Mancuernas + banco a 30°', 3, '8–12', '1–2', 120, 'press_h', 'elbow', true, 2, 'Pecho', 'Tríceps', 'Baja hasta sentir el estiramiento del pecho.'],
    ['X', 'Cruce de poleas (bajo a alto)', 'Doble polea + manijas D', 3, '12–15', '0–1', 75, 'fly', 'wristDist', true, 1.25, 'Pecho', '', 'Ponte de frente a la cámara.'],
    ['X', 'Press de hombro con mancuernas sentado', 'Mancuernas + banco a 90°', 3, '8–12', '1–2', 90, 'press_v', 'elbow', false, 2, 'Hombros', 'Tríceps', ''],
    ['X', 'Elevación lateral con mancuernas', 'Mancuernas', 4, '12–20', '0–1', 60, 'raise', 'shoulderAbd', false, 1, 'Hombros', '', 'Ponte de frente a la cámara.'],
    ['X', 'Extensión de tríceps sobre la cabeza en polea', 'Polea + cuerda', 3, '10–15', '0–1', 75, 'overhead', 'elbow', false, 1.25, 'Tríceps', '', 'De espaldas a la polea.'],
    // Jueves – Tirón
    ['J', 'Dominadas', 'Barra del rack (+ banda si hace falta)', 3, '6–10', '1–2', 120, 'pull', 'elbow', true, 2.5, 'Espalda', 'Bíceps', 'Si el techo no deja espacio: jalón en polea.'],
    ['J', 'Remo en landmine con agarre en V', 'Landmine + manija en V', 3, '8–12', '1–2', 120, 'row', 'elbow', true, 2.5, 'Espalda', 'Bíceps', ''],
    ['J', 'Remo a una mano en polea', 'Polea baja + manija D', 3, '10–12', '0–1', 90, 'row', 'elbow', true, 1.25, 'Espalda', 'Bíceps', 'Sentado en el suelo o arrodillado.'],
    ['J', 'Face pull en polea', 'Polea alta + cuerda', 3, '12–20', '0–1', 60, 'facepull', 'elbow', true, 1.25, 'Hombros', '', 'Deltoide posterior.'],
    ['J', 'Curl inclinado con mancuernas', 'Mancuernas + banco a 45°', 3, '10–12', '0–1', 75, 'curl', 'elbow', true, 1, 'Bíceps', '', ''],
    ['J', 'Curl martillo', 'Mancuernas', 2, '10–12', '0–1', 60, 'curl', 'elbow', true, 1, 'Bíceps', '', 'Ambos brazos a la vez para que el conteo sea exacto.'],
    // Viernes – Pierna B
    ['V', 'Hip thrust con barra', 'Barra + banco + colchoneta', 4, '8–12', '1–2', 120, 'hipthrust', 'hip', false, 5, 'Glúteo', 'Femoral', 'También sirve en el Smith.'],
    ['V', 'Sentadilla búlgara con mancuernas', 'Mancuernas + banco', 3, '8–12', '1–2', 90, 'lunge', 'kneeMin', true, 2, 'Cuádriceps', 'Glúteo', 'Series por pierna: registra cada pierna como una serie o suma ambas.'],
    ['V', 'Curl femoral en polea baja', 'Polea baja + tobillera', 3, '10–12', '0–1', 75, 'legcurl', 'knee', true, 1.25, 'Femoral', '', 'Alternativa: curl nórdico.'],
    ['V', 'Extensión de cuádriceps en polea', 'Polea baja + tobillera', 3, '12–15', '0–1', 60, 'legext', 'knee', false, 1.25, 'Cuádriceps', '', 'Sentado en el banco, un pie a la vez.'],
    ['V', 'Gemelo sentado', 'Banco + barra o mancuerna sobre rodillas', 5, '12–20', '0–1', 60, 'calf', 'heel', false, 2.5, 'Gemelo', '', ''],
    ['V', 'Crunch en polea', 'Polea alta + cuerda', 3, '10–15', '0–1', 60, 'crunch', 'hip', true, 2.5, 'Abdomen', '', 'Arrodillado, enrolla la columna.'],
  ].map(function (r, i) {
    const reps = r[4].split('–').map(Number);
    return {
      id: 'e' + (i + 1), day: r[0], name: r[1], equip: r[2], sets: r[3], repsText: r[4],
      repMin: reps[0], repMax: reps[1], rir: r[5], rest: r[6], pattern: r[7], metric: r[8],
      startHigh: r[9], inc: r[10], muscle: r[11], muscle2: r[12], notes: r[13]
    };
  });

  const DAYS = [
    { key: 'L', name: 'Lunes', session: 'Torso' },
    { key: 'M', name: 'Martes', session: 'Pierna A · cuádriceps' },
    { key: 'X', name: 'Miércoles', session: 'Empuje' },
    { key: 'J', name: 'Jueves', session: 'Tirón' },
    { key: 'V', name: 'Viernes', session: 'Pierna B · glúteo y femoral' },
  ];

  const MIN_RANGE = { elbow: 35, knee: 35, kneeMin: 35, hip: 30, shoulderAbd: 30, wristDist: 0.45, heel: 0.03 };

  // ---------- geometría ----------
  function angle(a, b, c) {
    const v1x = a.x - b.x, v1y = a.y - b.y, v2x = c.x - b.x, v2y = c.y - b.y;
    const d = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
    if (!d) return null;
    const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / d));
    return Math.acos(cos) * 180 / Math.PI;
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  const SIDE = { L: { sh: 11, el: 13, wr: 15, hip: 23, kn: 25, an: 27, heel: 29, toe: 31 },
                 R: { sh: 12, el: 14, wr: 16, hip: 24, kn: 26, an: 28, heel: 30, toe: 32 } };
  const VIS = 0.5;

  // lm: landmarks [{x,y,visibility}] ya escalados a píxeles. Devuelve {L, R} o {C}.
  function metricValues(metric, lm) {
    const out = {};
    const ok = function () { for (let i = 0; i < arguments.length; i++) { const p = lm[arguments[i]]; if (!p || (p.visibility ?? 1) < VIS) return false; } return true; };
    if (metric === 'wristDist') {
      if (ok(11, 12, 15, 16)) { const sw = dist(lm[11], lm[12]); if (sw > 0) out.C = dist(lm[15], lm[16]) / sw; }
      return out;
    }
    if (metric === 'kneeMin') {
      const vals = [];
      ['L', 'R'].forEach(function (s) { const k = SIDE[s]; if (ok(k.hip, k.kn, k.an)) vals.push(angle(lm[k.hip], lm[k.kn], lm[k.an])); });
      if (vals.length) out.C = Math.min.apply(null, vals);
      return out;
    }
    ['L', 'R'].forEach(function (s) {
      const k = SIDE[s];
      let v = null;
      if (metric === 'elbow' && ok(k.sh, k.el, k.wr)) v = angle(lm[k.sh], lm[k.el], lm[k.wr]);
      else if (metric === 'knee' && ok(k.hip, k.kn, k.an)) v = angle(lm[k.hip], lm[k.kn], lm[k.an]);
      else if (metric === 'hip' && ok(k.sh, k.hip, k.kn)) v = angle(lm[k.sh], lm[k.hip], lm[k.kn]);
      else if (metric === 'shoulderAbd' && ok(k.hip, k.sh, k.el)) v = angle(lm[k.hip], lm[k.sh], lm[k.el]);
      else if (metric === 'heel' && ok(k.hip, k.an, k.toe)) { const leg = dist(lm[k.hip], lm[k.an]); if (leg > 0) v = (lm[k.toe].y - lm[k.an].y) / leg; }
      if (v != null) out[s] = v;
    });
    return out;
  }

  // ---------- contador de repeticiones adaptativo ----------
  // Aprende el rango del movimiento en una ventana móvil; una rep = salir de la zona inicial,
  // llegar a la zona opuesta y volver.
  function SideTracker(minRange, startHigh) {
    this.minRange = minRange; this.startHigh = startHigh;
    this.reset();
  }
  SideTracker.prototype.reset = function () {
    this.buf = []; this.ema = null; this.count = 0; this.visitedOpp = false;
    this.lastRepT = null; this.firstMoveT = null; this.zone = 'none'; this.lastSeenT = null; this.range = 0; this.norm = null;
  };
  SideTracker.prototype.push = function (t, v) {
    this.ema = this.ema == null ? v : this.ema + 0.45 * (v - this.ema);
    this.lastSeenT = t;
    const buf = this.buf; buf.push({ t: t, v: this.ema });
    while (buf.length && t - buf[0].t > 8000) buf.shift();
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < buf.length; i++) { if (buf[i].v < mn) mn = buf[i].v; if (buf[i].v > mx) mx = buf[i].v; }
    this.range = mx - mn;
    if (this.range < this.minRange) { this.zone = 'still'; this.norm = null; return false; }
    const n = (this.ema - mn) / this.range; this.norm = n;
    const zone = n < 0.3 ? 'low' : n > 0.7 ? 'high' : 'mid';
    this.zone = zone;
    const start = this.startHigh ? 'high' : 'low', opp = this.startHigh ? 'low' : 'high';
    if (zone !== start && this.firstMoveT == null) this.firstMoveT = t;
    if (zone === opp) this.visitedOpp = true;
    if (zone === start && this.visitedOpp) {
      this.visitedOpp = false;
      // filtra rebotes: una rep dura al menos 0,5 s
      if (this.lastRepT == null || t - this.lastRepT > 500) { this.count++; this.lastRepT = t; return true; }
    }
    return false;
  };

  function RepCounter(ex) {
    const mr = MIN_RANGE[ex.metric] || 30;
    this.metric = ex.metric;
    this.sides = { L: new SideTracker(mr, ex.startHigh), R: new SideTracker(mr, ex.startHigh), C: new SideTracker(mr, ex.startHigh) };
    this.lastVisibleT = null;
  }
  RepCounter.prototype.reset = function () { for (const k in this.sides) this.sides[k].reset(); };
  RepCounter.prototype.update = function (t, lm) {
    const vals = lm ? metricValues(this.metric, lm) : {};
    let any = false, rep = false;
    for (const k in vals) { any = true; if (this.sides[k].push(t, vals[k])) rep = true; }
    if (any) this.lastVisibleT = t;
    return { visible: any, rep: rep };
  };
  RepCounter.prototype.best = function () {
    let b = this.sides.L;
    for (const k in this.sides) if (this.sides[k].count > b.count) b = this.sides[k];
    return b;
  };
  RepCounter.prototype.count = function () { return this.best().count; };
  RepCounter.prototype.lastRepT = function () {
    let t = null; for (const k in this.sides) { const s = this.sides[k]; if (s.lastRepT != null && (t == null || s.lastRepT > t)) t = s.lastRepT; } return t;
  };
  RepCounter.prototype.firstMoveT = function () { return this.best().firstMoveT; };
  RepCounter.prototype.progress = function () {
    // 0..1 dentro del recorrido, para la barra de la UI
    let b = null; for (const k in this.sides) { const s = this.sides[k]; if (s.norm != null && (!b || s.range > b.range)) b = s; }
    if (!b) return null;
    return b.startHigh ? 1 - b.norm : b.norm;
  };

  // ---------- calendario ----------
  function mondayOf(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parseYmd(s) { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function weekNumber(startYmd, date) {
    const s = mondayOf(parseYmd(startYmd)), m = mondayOf(date);
    return Math.max(1, Math.round((m - s) / (7 * 864e5)) + 1);
  }
  function cycleWeek(w) { return ((w - 1) % 8) + 1; }
  function isDeload(w) { return cycleWeek(w) === 8; }
  function dayKeyOf(date) { const wd = date.getDay(); return wd >= 1 && wd <= 5 ? DAYS[wd - 1].key : null; }

  function plannedSets(ex, overrides, week) {
    const base = (overrides && overrides[ex.id]) || ex.sets;
    return isDeload(week) ? Math.max(1, Math.ceil(base / 2)) : base;
  }

  // ---------- progresión ----------
  function roundTo(x, step) { return Math.round(x / step) * step; }

  // sessions: [{date, week, sets:[{weight,reps,rir}]}] ordenadas de más antigua a más reciente
  function sessionsFor(logs, exId) {
    const by = {};
    logs.forEach(function (l) { if (l.exId !== exId) return; (by[l.date] = by[l.date] || { date: l.date, week: l.week, sets: [] }).sets.push(l); });
    return Object.keys(by).sort().map(function (k) { by[k].sets.sort(function (a, b) { return a.set - b.set; }); return by[k]; });
  }

  // Devuelve {action, weight, text, detail}
  // action: start | up | keep | down | addset | deload
  function recommend(ex, logs, overrides, week, today) {
    const all = sessionsFor(logs, ex.id).filter(function (s) { return s.date !== today; });
    const planned = (overrides && overrides[ex.id]) || ex.sets;
    if (isDeload(week)) {
      const last = all[all.length - 1];
      return { action: 'deload', weight: last ? topWeight(last) : null, text: 'Semana de descarga',
        detail: 'Haz ' + plannedSets(ex, overrides, week) + ' series con el mismo peso de siempre, sin llegar cerca del fallo.' };
    }
    const work = all.filter(function (s) { return !isDeload(s.week); });
    if (!work.length) return { action: 'start', weight: null, text: 'Primera vez', detail: 'Elige un peso con el que llegues a ' + ex.repsText + ' reps dejando ' + ex.rir + ' en reserva.' };
    const last = work[work.length - 1];
    const w = topWeight(last);
    const sets = last.sets.filter(function (s) { return s.weight === w; });
    const allTop = sets.length >= planned && sets.every(function (s) { return s.reps >= ex.repMax; });
    const rirOk = sets.every(function (s) { return s.rir == null || s.rir >= 1 || ex.rir.charAt(0) === '0'; });
    const anyLow = sets.some(function (s) { return s.reps < ex.repMin; });
    if (allTop && rirOk) {
      const nw = roundTo(w + ex.inc, ex.inc < 1.25 ? 0.5 : 1.25);
      return { action: 'up', weight: nw, text: 'Sube a ' + fmtKg(nw), detail: 'La última vez llegaste a ' + ex.repMax + ' reps en todas las series con ' + fmtKg(w) + '.' };
    }
    if (anyLow && sets.filter(function (s) { return s.reps < ex.repMin; }).length >= Math.ceil(sets.length / 2)) {
      const nw = Math.max(0, roundTo(w * 0.9, ex.inc >= 2.5 ? 2.5 : 1));
      return { action: 'down', weight: nw, text: 'Baja a ' + fmtKg(nw), detail: 'La mayoría de las series quedó bajo ' + ex.repMin + ' reps con ' + fmtKg(w) + '.' };
    }
    // estancamiento: 3 sesiones con el mismo peso y sin más reps totales
    if (work.length >= 3) {
      const l3 = work.slice(-3);
      const sameW = l3.every(function (s) { return topWeight(s) === w; });
      const tot = l3.map(function (s) { return s.sets.reduce(function (a, b) { return a + (b.weight === w ? b.reps : 0); }, 0); });
      if (sameW && tot[2] <= tot[0]) {
        if (planned < ex.sets + 2) return { action: 'addset', weight: w, text: 'Agrega 1 serie', detail: 'Llevas 3 sesiones con ' + fmtKg(w) + ' sin sumar repeticiones. Más volumen suele destrabarlo.' };
        return { action: 'keep', weight: w, text: 'Mantén ' + fmtKg(w), detail: 'Estás estancado y ya subiste series. Revisa sueño, comida y técnica.' };
      }
    }
    const totReps = sets.reduce(function (a, b) { return a + b.reps; }, 0);
    return { action: 'keep', weight: w, text: 'Mantén ' + fmtKg(w), detail: 'Busca al menos 1 rep más que la última vez (' + totReps + ' en total).' };
  }
  function topWeight(session) { return session.sets.reduce(function (m, s) { return s.weight != null && s.weight > m ? s.weight : m; }, 0); }
  function fmtKg(x) { return (Math.round(x * 100) / 100).toString().replace('.', ',') + ' kg'; }

  // articulaciones que necesita ver la cámara para cada métrica
  function jointsFor(metric) {
    const s = function (keys) { return { L: keys.map(function (k) { return SIDE.L[k]; }), R: keys.map(function (k) { return SIDE.R[k]; }) }; };
    switch (metric) {
      case 'elbow': return s(['sh', 'el', 'wr']);
      case 'knee': case 'kneeMin': return s(['hip', 'kn', 'an']);
      case 'hip': return s(['sh', 'hip', 'kn']);
      case 'shoulderAbd': return s(['hip', 'sh', 'el']);
      case 'heel': return s(['hip', 'an', 'toe']);
      case 'wristDist': return { C: [11, 12, 15, 16] };
    }
    return { C: [] };
  }
  // calidad 0..1: la peor visibilidad del mejor lado
  function detectionQuality(metric, lm) {
    if (!lm) return 0;
    const j = jointsFor(metric); let best = 0;
    for (const k in j) { let mn = 1; j[k].forEach(function (i) { const v = lm[i] ? (lm[i].visibility ?? 1) : 0; if (v < mn) mn = v; }); if (mn > best) best = mn; }
    return best;
  }
  const JOINT_HELP = { elbow: 'hombro, codo y muñeca', knee: 'cadera, rodilla y tobillo', kneeMin: 'cadera, rodilla y tobillo', hip: 'hombro, cadera y rodilla',
    shoulderAbd: 'cadera, hombro y codo', heel: 'cadera, tobillo y punta del pie', wristDist: 'ambos hombros y ambas muñecas' };

  const api = { PLAN: PLAN, DAYS: DAYS, angle: angle, metricValues: metricValues, SideTracker: SideTracker, RepCounter: RepCounter,
    mondayOf: mondayOf, ymd: ymd, parseYmd: parseYmd, weekNumber: weekNumber, cycleWeek: cycleWeek, isDeload: isDeload,
    dayKeyOf: dayKeyOf, plannedSets: plannedSets, recommend: recommend, sessionsFor: sessionsFor, fmtKg: fmtKg,
    jointsFor: jointsFor, detectionQuality: detectionQuality, JOINT_HELP: JOINT_HELP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RepCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
