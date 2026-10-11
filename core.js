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
    this.lastRepT = null; this.firstMoveT = null; this.zone = 'none'; this.lastSeenT = null; this.range = 0; this.norm = null; this.frames = 0; this.okFrames = 0;
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

  // ---------- rasgos de postura ----------
  // Ángulos y posiciones relativas que no dependen de la distancia a la cámara.
  function features(lm) {
    if (!lm) return null;
    const v = function (i) { return lm[i] && (lm[i].visibility ?? 1) >= VIS; };
    const f = { arms: [], kneeMax: null, kneeMin: null };
    // torso: el lado con mejor visibilidad (o el promedio si se ven ambos)
    let sh = null, hip = null;
    if (v(11) && v(12) && v(23) && v(24)) { sh = mid(lm[11], lm[12]); hip = mid(lm[23], lm[24]); }
    else ['L', 'R'].forEach(function (k) { const S = SIDE[k]; if (!sh && v(S.sh) && v(S.hip)) { sh = lm[S.sh]; hip = lm[S.hip]; } });
    if (sh) {
      f.torsoLen = dist(sh, hip);
      // 0° = tronco vertical, 90° = acostado
      f.torso = f.torsoLen ? Math.acos(Math.max(-1, Math.min(1, (hip.y - sh.y) / f.torsoLen))) * 180 / Math.PI : null;
    }
    const L = f.torsoLen || 1;
    ['L', 'R'].forEach(function (k) {
      const S = SIDE[k];
      if (v(S.sh) && v(S.el) && v(S.wr)) {
        const a = lm[S.sh], e = lm[S.el], w = lm[S.wr];
        const ua = Math.hypot(e.x - a.x, e.y - a.y);
        f.arms.push({
          side: k,
          elbow: angle(a, e, w),
          wrRel: (w.y - a.y) / L,          // + = muñeca bajo el hombro
          elRel: (e.y - a.y) / L,
          upperArm: ua ? Math.acos(Math.max(-1, Math.min(1, (e.y - a.y) / ua))) * 180 / Math.PI : null, // 0° = brazo colgando
          wrHip: v(S.hip) ? (w.y - lm[S.hip].y) / L : null
        });
      }
      if (v(S.hip) && v(S.kn) && v(S.an)) {
        const kn = angle(lm[S.hip], lm[S.kn], lm[S.an]);
        f.kneeMax = f.kneeMax == null ? kn : Math.max(f.kneeMax, kn);
        f.kneeMin = f.kneeMin == null ? kn : Math.min(f.kneeMin, kn);
      }
      if (f.hip == null && v(S.sh) && v(S.hip) && v(S.kn)) f.hip = angle(lm[S.sh], lm[S.hip], lm[S.kn]);
    });
    if (v(11) && v(12) && v(15) && v(16)) { const sw = dist(lm[11], lm[12]); if (sw) f.wristDist = dist(lm[15], lm[16]) / sw; }
    return f;
  }
  function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  const lt = function (a, b) { return a != null && a < b; }, gt = function (a, b) { return a != null && a > b; };
  const anyArm = function (f, fn) { return f.arms.some(fn); };

  // ---------- patrones de postura por ejercicio ----------
  // start: posición de inicio que hay que sostener ~0,7 s para empezar a contar.
  // hold: condición que debe cumplirse durante las repeticiones (si se pierde, deja de contar).
  // say: qué decirle al usuario cuando no está en posición.
  const GATES = {
    squat: { start: function (f) { return lt(f.torso, 35) && gt(f.kneeMax, 145) && anyArm(f, function (a) { return lt(a.wrRel, 0.4) && lt(a.elbow, 120); }); },
             hold: function (f) { return lt(f.torso, 70) && anyArm(f, function (a) { return lt(a.wrRel, 0.6); }); },
             say: 'Párate derecho con la barra sobre la espalda' },
    lunge: { start: function (f) { return lt(f.torso, 40) && gt(f.kneeMax, 135); },
             hold: function (f) { return lt(f.torso, 55); },
             say: 'Párate derecho con el pie de atrás en el banco' },
    hinge: { start: function (f) { return lt(f.torso, 30) && gt(f.kneeMax, 140) && anyArm(f, function (a) { return gt(a.wrRel, 0.7) && gt(a.elbow, 140); }); },
             hold: function (f) { return anyArm(f, function (a) { return gt(a.elbow, 130) && gt(a.wrRel, 0.4); }); },
             say: 'Párate derecho con la barra a la altura de los muslos' },
    hipthrust: { start: function (f) { return lt(f.kneeMin, 125) && gt(f.torso, 30); },
             hold: function (f) { return lt(f.kneeMin, 145); },
             say: 'Apoya la espalda en el banco con los pies firmes en el suelo' },
    press_h: { start: function (f) { return gt(f.torso, 45) && anyArm(f, function (a) { return gt(a.elbow, 140) && lt(a.wrRel, -0.35); }); },
             hold: function (f) { return gt(f.torso, 40); },
             say: 'Acuéstate en el banco con los brazos estirados hacia arriba' },
    press_v: { start: function (f) { return lt(f.torso, 35) && anyArm(f, function (a) { return lt(a.wrRel, 0.25) && lt(a.elbow, 120); }); },
             hold: function (f) { return lt(f.torso, 40) && anyArm(f, function (a) { return lt(a.wrRel, 0.4); }); },
             say: 'Siéntate derecho con las manos a la altura de los hombros' },
    pull: { start: function (f) { return anyArm(f, function (a) { return lt(a.wrRel, -0.5) && gt(a.elbow, 120); }); },
             hold: function (f) { return anyArm(f, function (a) { return lt(a.wrRel, 0.25); }); },
             say: 'Toma la barra con los brazos estirados arriba' },
    row: { start: function (f) { return (gt(f.torso, 25) || lt(f.hip, 130)) && anyArm(f, function (a) { return gt(a.elbow, 135); }); },
             hold: function (f) { return gt(f.torso, 20) || lt(f.hip, 135); },
             say: 'Inclínate o siéntate con los brazos estirados hacia la carga' },
    curl: { start: function (f) { return anyArm(f, function (a) { return gt(a.elbow, 140) && lt(a.upperArm, 30) && gt(a.wrRel, 0.5); }); },
             hold: function (f) { return anyArm(f, function (a) { return lt(a.upperArm, 45); }); },
             say: 'Brazos estirados abajo y codos pegados al cuerpo' },
    pushdown: { start: function (f) { return anyArm(f, function (a) { return lt(a.upperArm, 35) && lt(a.elbow, 115); }); },
             hold: function (f) { return anyArm(f, function (a) { return lt(a.upperArm, 45); }); },
             say: 'Codos pegados al cuerpo y antebrazos arriba' },
    overhead: { start: function (f) { return anyArm(f, function (a) { return lt(a.elRel, -0.25) && lt(a.elbow, 110); }); },
             hold: function (f) { return anyArm(f, function (a) { return lt(a.elRel, -0.05); }); },
             say: 'Codos arriba junto a la cabeza' },
    raise: { start: function (f) { return anyArm(f, function (a) { return lt(a.upperArm, 30) && gt(a.wrRel, 0.5); }); },
             hold: function (f) { return anyArm(f, function (a) { return gt(a.elbow, 110); }); },
             say: 'De frente a la cámara, brazos abajo a los lados' },
    fly: { start: function (f) { return gt(f.wristDist, 1.6) && anyArm(f, function (a) { return gt(a.wrRel, 0.3); }); },
             hold: function (f) { return f.wristDist != null; },
             say: 'De frente a la cámara, brazos abiertos y abajo' },
    facepull: { start: function (f) { return anyArm(f, function (a) { return gt(a.elbow, 140) && gt(a.upperArm, 50) && lt(a.wrRel, 0.4); }); },
             hold: function (f) { return anyArm(f, function (a) { return gt(a.upperArm, 40); }); },
             say: 'Brazos estirados hacia la polea a la altura de la cara' },
    legcurl: { start: function (f) { return gt(f.torso, 55) && gt(f.kneeMax, 140); },
             hold: function (f) { return gt(f.torso, 45); },
             say: 'Acuéstate boca abajo con las piernas estiradas' },
    legext: { start: function (f) { return lt(f.hip, 130) && lt(f.torso, 45) && lt(f.kneeMin, 120); },
             hold: function (f) { return lt(f.hip, 140); },
             say: 'Siéntate en el banco con la rodilla doblada' },
    calf: { start: function (f) { return (lt(f.torso, 25) && gt(f.kneeMax, 150)) || lt(f.hip, 130); },
             hold: function (f) { return (lt(f.torso, 30) && gt(f.kneeMax, 140)) || lt(f.hip, 135); },
             say: 'Quédate quieto con los talones abajo' },
    crunch: { start: function (f) { return lt(f.kneeMin, 120) && lt(f.torso, 35) && anyArm(f, function (a) { return lt(a.wrRel, 0.3); }); },
             hold: function (f) { return lt(f.kneeMin, 130); },
             say: 'Arrodíllate con la cuerda junto a la cabeza' },
  };

  // ---------- contador con compuerta de postura ----------
  // Solo cuenta después de reconocer la posición de inicio. Cada rep válida debe:
  // mantener la postura del ejercicio y tener un recorrido parecido al de tus series anteriores.
  function RepCounter(ex, typicalRange) {
    this.ex = ex; this.metric = ex.metric; this.gate = GATES[ex.pattern];
    this.baseMin = MIN_RANGE[ex.metric] || 30;
    this.minRange = typicalRange ? Math.max(this.baseMin, typicalRange * 0.55) : this.baseMin;
    this.sides = { L: new SideTracker(this.minRange, ex.startHigh), R: new SideTracker(this.minRange, ex.startHigh), C: new SideTracker(this.minRange, ex.startHigh) };
    this.reps = 0; this.base = 0; this.lastVisibleT = null; this.maxRange = 0;
    this.state = 'search'; this.startSince = null; this.badSince = null; this.reason = 'camera'; this.lastRep = null;
  }
  RepCounter.prototype.resetTrackers = function () {
    this.base = this.reps;
    for (const k in this.sides) this.sides[k].reset();
  };
  RepCounter.prototype.reset = function () {
    this.reps = 0; this.base = 0; this.lastRep = null; this.maxRange = 0;
    for (const k in this.sides) this.sides[k].reset();
    this.state = 'search'; this.startSince = null; this.badSince = null;
  };
  RepCounter.prototype.update = function (t, lm, quality) {
    const out = { visible: false, rep: false, armed: false, disarmed: false };
    const seeJoints = quality == null ? !!lm : quality >= 0.5;
    if (seeJoints) { this.lastVisibleT = t; out.visible = true; }
    const f = seeJoints ? features(lm) : null;
    const g = this.gate;
    const startOk = !!(f && g && g.start(f)), holdOk = !!(f && g && g.hold(f));

    if (this.state === 'search') {
      this.reason = !seeJoints ? 'camera' : 'posture';
      if (startOk) {
        if (this.startSince == null) this.startSince = t;
        if (t - this.startSince >= 700) { this.state = 'armed'; this.badSince = null; this.resetTrackers(); out.armed = true; }
      } else this.startSince = null;
    } else {
      const lost = this.lastVisibleT == null || t - this.lastVisibleT > 1500;
      if (!holdOk) { if (this.badSince == null) this.badSince = t; } else this.badSince = null;
      if (lost || (this.badSince != null && t - this.badSince > 1200)) {
        this.state = 'search'; this.startSince = null; this.reason = lost ? 'camera' : 'posture'; out.disarmed = true;
      }
    }

    if (this.state === 'armed' && seeJoints) {
      const vals = metricValues(this.metric, lm);
      for (const k in vals) {
        const s = this.sides[k];
        s.frames++; if (holdOk) s.okFrames++;
        if (s.push(t, vals[k])) {
          const ratio = s.frames ? s.okFrames / s.frames : 0;
          if (ratio >= 0.7) { if (s.range > this.maxRange) this.maxRange = s.range; }
          else s.count--;              // rep con mala postura: no cuenta
          s.frames = 0; s.okFrames = 0;
        }
      }
      let best = 0; for (const k in this.sides) if (this.sides[k].count > best) best = this.sides[k].count;
      if (this.base + best > this.reps) { this.reps = this.base + best; this.lastRep = t; out.rep = true; }
    }
    out.state = this.state; out.reason = this.reason;
    return out;
  };
  RepCounter.prototype.count = function () { return this.reps; };
  RepCounter.prototype.lastRepT = function () { return this.lastRep; };
  RepCounter.prototype.firstMoveT = function () {
    let t = null; for (const k in this.sides) { const s = this.sides[k]; if (s.firstMoveT != null && (t == null || s.firstMoveT < t)) t = s.firstMoveT; } return t;
  };
  RepCounter.prototype.typicalRange = function () { return this.maxRange || null; };
  RepCounter.prototype.progress = function () {
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
    jointsFor: jointsFor, detectionQuality: detectionQuality, JOINT_HELP: JOINT_HELP, features: features, GATES: GATES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RepCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
