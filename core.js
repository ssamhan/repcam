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
    this.raw = []; this.cycLo = Infinity; this.cycHi = -Infinity; this.repLo = null; this.repHi = null; this.midTime = 0; this.repMid = 0; this.lastPushT = null;
  };
  SideTracker.prototype.push = function (t, v) {
    // mediana de 5 muestras: elimina los saltos sueltos del detector antes de suavizar
    this.raw.push(v); if (this.raw.length > 5) this.raw.shift();
    const srt = this.raw.slice().sort(function (a, b) { return a - b; }); v = srt[srt.length >> 1];
    this.ema = this.ema == null ? v : this.ema + 0.45 * (v - this.ema);
    if (this.ema < this.cycLo) this.cycLo = this.ema; if (this.ema > this.cycHi) this.cycHi = this.ema;
    this.lastSeenT = t;
    const buf = this.buf; buf.push({ t: t, v: this.ema });
    while (buf.length && t - buf[0].t > 8000) buf.shift();
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < buf.length; i++) { if (buf[i].v < mn) mn = buf[i].v; if (buf[i].v > mx) mx = buf[i].v; }
    this.range = mx - mn;
    if (this.range < this.minRange) { this.zone = 'still'; this.norm = null; return false; }
    const n = (this.ema - mn) / this.range; this.norm = n;
    // zona de inicio: último 25 % del recorrido; zona opuesta: pasar la mitad del recorrido
    // (así también cuenta las reps cortas, para poder avisar "baja más")
    const sn = this.startHigh ? n : 1 - n;          // 1 = posición de inicio, 0 = extremo opuesto
    const zone = sn > 0.75 ? 'start' : sn < 0.5 ? 'opp' : 'mid';
    // tiempo lejos de ambos extremos (ni arriba ni abajo): típico al apoyar la barra o soltar el agarre
    if (this.lastPushT != null && sn > 0.2 && sn < 0.75) this.midTime += t - this.lastPushT;
    this.lastPushT = t;
    this.zone = zone;
    const start = 'start', opp = 'opp';
    if (zone !== start && this.firstMoveT == null) this.firstMoveT = t;
    if (zone === opp) this.visitedOpp = true;
    if (zone === start && this.visitedOpp) {
      this.visitedOpp = false;
      // filtra rebotes: una rep dura al menos 0,5 s
      if (this.lastRepT == null || t - this.lastRepT > 500) {
        this.count++; this.lastRepT = t; this.repLo = this.cycLo; this.repHi = this.cycHi; this.cycLo = this.ema; this.cycHi = this.ema;
        this.repMid = this.midTime; this.midTime = 0; return true;
      }
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
      // cuánto "baja" el muslo y la canilla en la imagen (relativo al tronco): no depende del ángulo de cámara
      if (f.torsoLen && v(S.hip) && v(S.kn)) { const tv = (lm[S.kn].y - lm[S.hip].y) / f.torsoLen; f.thighV = f.thighV == null ? tv : Math.max(f.thighV, tv); }
      if (f.torsoLen && v(S.kn) && v(S.an)) { const sv = (lm[S.an].y - lm[S.kn].y) / f.torsoLen; f.shinV = f.shinV == null ? sv : Math.max(f.shinV, sv); }
    });
    // distancia entre muñecas: solo con vista de frente (con vista de lado los hombros se superponen y el valor es ruido)
    if (v(11) && v(12) && v(15) && v(16)) { const sw = dist(lm[11], lm[12]); if (sw && (!f.torsoLen || sw / f.torsoLen > 0.3)) f.wristDist = dist(lm[15], lm[16]) / sw; }
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

  // ---------- postura del cuerpo: de pie, sentado, acostado, inclinado, arrodillado ----------
  function classifyPosture(f) {
    if (!f || f.torso == null) return null;
    const T = f.torso;
    if (T > 120) return 'inverted';                         // cabeza bajo la cadera: imagen al revés
    if (T >= 60) return 'lying';
    if (T > 35) return 'bent';
    // tronco vertical: lo decide cuánto bajan muslo y canilla
    if (f.thighV == null) return 'upright';                 // piernas fuera de cuadro: erguido, sin saber si de pie o sentado
    if (f.thighV < 0.45) return 'seated';
    if (f.shinV != null && f.shinV < 0.35) return 'kneeling';
    return 'standing';
  }
  const POSTURE_NAME = { standing: 'de pie', seated: 'sentado', lying: 'acostado', bent: 'inclinado', kneeling: 'arrodillado', inverted: 'imagen invertida', upright: 'erguido (no veo tus piernas)' };
  // posturas válidas para empezar cada ejercicio
  const EXPECTED = { e1: ['lying'], e2: ['bent'], e3: ['seated'], e4: ['kneeling', 'seated', 'standing'], e5: ['standing'], e6: ['standing'], e7: ['standing'],
    e8: ['standing'], e9: ['standing'], e10: ['standing'], e11: ['lying'], e12: ['standing'], e13: ['lying', 'bent'], e14: ['standing'], e15: ['seated'],
    e16: ['standing'], e17: ['standing', 'bent'], e18: ['standing'], e19: ['bent'], e20: ['seated', 'kneeling', 'bent'], e21: ['standing'],
    e22: ['seated', 'bent', 'lying'], e23: ['standing'], e24: ['lying', 'bent', 'seated'], e25: ['standing'], e26: ['lying'], e27: ['seated'], e28: ['seated'], e29: ['kneeling'] };
  const POSTURE_SAY = { standing: 'Párate', seated: 'Siéntate', lying: 'Acuéstate', bent: 'Inclínate', kneeling: 'Arrodíllate' };
  // dirección del tronco en la imagen (cadera → hombros): 0 = hacia arriba, 90 = hacia la derecha, ±180 = abajo
  function torsoDirection(lm) {
    const v = function (i) { return lm[i] && (lm[i].visibility ?? 1) >= VIS; };
    let sh = null, hip = null;
    if (v(11) && v(12) && v(23) && v(24)) { sh = mid(lm[11], lm[12]); hip = mid(lm[23], lm[24]); }
    else ['L', 'R'].forEach(function (k) { const S = SIDE[k]; if (!sh && v(S.sh) && v(S.hip)) { sh = lm[S.sh]; hip = lm[S.hip]; } });
    if (!sh) return null;
    return Math.atan2(sh.x - hip.x, hip.y - sh.y) * 180 / Math.PI;
  }
  // solo bloquea contradicciones claras: acostado vs erguido, o imagen invertida
  function postureCompatible(P, E) {
    if (!E || P == null) return true;
    if (P === 'inverted') return false;
    const vertical = P === 'standing' || P === 'seated' || P === 'kneeling' || P === 'upright';
    const lyingOnly = E.every(function (x) { return x === 'lying'; });
    const noLying = E.indexOf('lying') < 0;
    if (lyingOnly && vertical) return false;
    if (noLying && P === 'lying') return false;
    return true;
  }
  // voto de mayoría sobre ~1 s para que la postura no "parpadee"
  function PostureTracker() { this.buf = []; this.current = null; }
  PostureTracker.prototype.push = function (p) {
    this.buf.push(p); if (this.buf.length > 20) this.buf.shift();
    const cnt = {}; let best = null, bn = 0;
    this.buf.forEach(function (x) { if (!x) return; cnt[x] = (cnt[x] || 0) + 1; if (cnt[x] > bn) { bn = cnt[x]; best = x; } });
    if (best && bn >= this.buf.length * 0.6) this.current = best;
    return this.current;
  };

  // ---------- firma de postura aprendida ----------
  // Vector de rasgos comparable entre frames: no depende de la distancia a la cámara.
  const SCALE = { torso: 25, hip: 25, kneeMax: 25, kneeMin: 25, wristDist: 0.4, elbow: 25, upperArm: 25, wrRel: 0.25, elRel: 0.25 };
  function poseVector(f) {
    if (!f) return null;
    const v = { torso: f.torso, hip: f.hip, kneeMax: f.kneeMax, kneeMin: f.kneeMin, wristDist: f.wristDist, arms: {} };
    f.arms.forEach(function (a) { v.arms[a.side] = { elbow: a.elbow, upperArm: a.upperArm, wrRel: a.wrRel, elRel: a.elRel }; });
    return v;
  }
  function sq(a, b, k) { if (a == null || b == null || isNaN(a) || isNaN(b)) return null; const d = (a - b) / SCALE[k]; return d * d; }
  function armDist(a, b) { if (!a || !b) return null; let s = 0, n = 0; ['elbow', 'upperArm', 'wrRel', 'elRel'].forEach(function (k) { const d = sq(a[k], b[k], k); if (d != null) { s += d; n++; } }); return n ? { s: s, n: n } : null; }
  // distancia RMS normalizada: ~1 = cada rasgo difiere en una "unidad" (25° o 0,25 del tronco)
  function poseDistance(v, t) {
    if (!v || !t) return Infinity;
    let s = 0, n = 0;
    ['torso', 'hip', 'kneeMax', 'kneeMin', 'wristDist'].forEach(function (k) { const d = sq(v[k], t[k], k); if (d != null) { s += d; n++; } });
    let best = null;
    for (const a in v.arms) for (const b in t.arms) { const d = armDist(v.arms[a], t.arms[b]); if (d && (!best || d.s / d.n < best.s / best.n || (a === b && d.s / d.n <= best.s / best.n))) best = d; }
    // el peor de los dos grupos (tronco/piernas y brazos), para que uno no diluya al otro
    const body = n ? Math.sqrt(s / n) : null, arms = best ? Math.sqrt(best.s / best.n) : null;
    if ((n + (best ? best.n : 0)) < 2) return Infinity;
    return Math.max(body || 0, arms || 0);
  }
  function meanPose(list) {
    if (!list.length) return null;
    const out = { arms: {} };
    const avg = function (vals) { const xs = vals.filter(function (x) { return x != null && !isNaN(x); }); return xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : null; };
    ['torso', 'hip', 'kneeMax', 'kneeMin', 'wristDist'].forEach(function (k) { out[k] = avg(list.map(function (v) { return v[k]; })); });
    ['L', 'R'].forEach(function (sd) {
      const arms = list.map(function (v) { return v.arms[sd]; }).filter(Boolean);
      if (arms.length >= list.length / 2) { const a = {}; ['elbow', 'upperArm', 'wrRel', 'elRel'].forEach(function (k) { a[k] = avg(arms.map(function (x) { return x[k]; })); }); out.arms[sd] = a; }
    });
    return out;
  }
  function blendPose(old, nw, w) {
    if (!old) return nw; if (!nw) return old;
    const mix = function (a, b) { return a == null ? b : b == null ? a : a * (1 - w) + b * w; };
    const out = { arms: {} };
    ['torso', 'hip', 'kneeMax', 'kneeMin', 'wristDist'].forEach(function (k) { out[k] = mix(old[k], nw[k]); });
    ['L', 'R'].forEach(function (sd) {
      const a = old.arms && old.arms[sd], b = nw.arms && nw.arms[sd];
      if (a || b) { out.arms[sd] = {}; ['elbow', 'upperArm', 'wrRel', 'elRel'].forEach(function (k) { out.arms[sd][k] = mix(a && a[k], b && b[k]); }); }
    });
    return out;
  }

  // ---------- ritmo de la serie ----------
  // Rechaza "reps" demasiado rápidas para tu ritmo (saltos del detector) y, al cerrar la serie,
  // la última si llegó después de una pausa (soltar la barra, bajar los brazos).
  function median(a) { if (!a.length) return null; const b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }
  function Rhythm() { this.times = []; }
  Rhythm.prototype.accept = function (t, mid) {
    this.mids = this.mids || [];
    const n = this.times.length;
    if (n) {
      const iv = t - this.times[n - 1], ivs = this.intervals();
      if (iv < 600) return false;
      if (ivs.length >= 3 && iv < 0.45 * median(ivs)) return false;
    }
    this.times.push(t); this.mids.push(mid || 0); return true;
  };
  Rhythm.prototype.intervals = function () { const ts = this.times, o = []; for (let i = 1; i < ts.length; i++) o.push(ts[i] - ts[i - 1]); return o; };
  Rhythm.prototype.trailingExtra = function () {
    if (this.times.length < 4) return false;
    const ivs = this.intervals(), last = ivs[ivs.length - 1], m = median(ivs.slice(0, -1));
    // pausa larga Y quieto a medio camino (barra apoyada, brazos bajando) antes de la última
    return last > 1.45 * m && (this.mids[this.mids.length - 1] || 0) > 1200;
  };
  // recorrido de la rep comparado con tu mejor recorrido en ese ejercicio
  // devuelve null (bien), 'deep' (faltó llegar al extremo opuesto) o 'full' (faltó volver completo)
  function romCheck(startHigh, lo, hi, ref) {
    if (!ref || lo == null || hi == null) return null;
    const span = ref.hi - ref.lo; if (span <= 0) return null;
    const tol = Math.max(0.15 * span, 0.0001);
    const shortLo = lo - ref.lo > tol, shortHi = ref.hi - hi > tol;
    // el extremo opuesto al inicio es el "profundo"
    const deepShort = startHigh ? shortLo : shortHi, fullShort = startHigh ? shortHi : shortLo;
    return deepShort ? 'deep' : fullShort ? 'full' : null;
  }

  // ---------- contador con posición de inicio ----------
  // Arma el conteo cuando reconoce la posición de inicio:
  //  - con posición aprendida: postura parecida a la aprendida, sostenida 0,6 s;
  //  - sin posición aprendida: quieto ~1,2 s con las articulaciones visibles (o el patrón genérico);
  //  - siempre: botón "Estoy en posición".
  // Una vez armado, cuenta hasta perder de vista las articulaciones; después de cada serie hay que volver a armar.
  function RepCounter(ex, opts) {
    opts = opts || {};
    this.ex = ex; this.metric = ex.metric; this.gate = GATES[ex.pattern];
    this.template = opts.template || null; this.tol = opts.tolerance || 1.0; this.always = !!opts.always;
    this.baseMin = MIN_RANGE[ex.metric] || 30;
    this.minRange = opts.typicalRange ? Math.max(this.baseMin, opts.typicalRange * 0.55) : this.baseMin;
    this.needed = [].concat.apply([], Object.values(jointsFor(ex.metric)));
    // quietud: se mide con todo el cuerpo (hombros, codos, muñecas, caderas, rodillas, tobillos)
    this.body = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    this.sides = { L: new SideTracker(this.minRange, ex.startHigh), R: new SideTracker(this.minRange, ex.startHigh), C: new SideTracker(this.minRange, ex.startHigh) };
    this.reps = 0; this.base = 0; this.lastVisibleT = null; this.maxRange = 0; this.lastRep = null; this.rejected = 0;
    this.rhythm = new Rhythm(); this.romRef = opts.romRef || null; this.lastRom = null; this.romLog = [];
    this.state = 'search'; this.since = null; this.reason = 'camera';
    this.expected = EXPECTED[ex.id] || null; this.posture = new PostureTracker(); this.postureNow = null;
    this.motion = null; this.posBuf = []; this.recent = []; this.armPose = null; this.dist = null; this.armedBy = null;
  }
  RepCounter.prototype.resetTrackers = function () { this.base = this.reps; for (const k in this.sides) this.sides[k].reset(); };
  RepCounter.prototype.arm = function (t, by) {
    this.state = 'armed'; this.armedBy = by; this.since = null; this.awaySince = null; this.resetTrackers();
    this.armPose = meanPose(this.recent.slice(-15).map(function (r) { return r.v; }));
  };
  RepCounter.prototype.smoothPose = function () { return meanPose(this.recent.slice(-8).map(function (r) { return r.v; })); };
  RepCounter.prototype.manualArm = function (t) { if (this.state !== 'armed') { this.arm(t, 'manual'); return true; } return false; };
  // puntos fuera de la imagen: el detector los "inventa"; se marcan como no visibles
  function clipToFrame(lm, W, H) {
    if (!lm || !W || !H) return lm;
    const mx = W * 0.02, my = H * 0.02;
    return lm.map(function (p) { return p && (p.x < -mx || p.x > W + mx || p.y < -my || p.y > H + my) ? { x: p.x, y: p.y, visibility: 0 } : p; });
  }
  RepCounter.prototype.update = function (t, lm, quality, W, H) {
    lm = clipToFrame(lm, W, H);
    const out = { visible: false, rep: false, armed: false, disarmed: false };
    const see = quality == null ? !!lm : quality >= 0.5;
    if (see) { this.lastVisibleT = t; out.visible = true; }
    const f = see ? features(lm) : null, v = poseVector(f);
    // movimiento: cuánto se desplazaron las articulaciones del ejercicio en el último segundo,
    // relativo al tamaño del tronco (robusto al temblor del detector)
    if (see) {
      const pts = []; for (let i = 0; i < this.body.length; i++) { const p = lm[this.body[i]]; pts.push(p && (p.visibility ?? 1) >= VIS ? [p.x, p.y] : null); }
      this.posBuf.push({ t: t, pts: pts }); while (this.posBuf.length && t - this.posBuf[0].t > 1000) this.posBuf.shift();
      const sc = (f && f.torsoLen) || 100; let m = 0, n = 0;
      for (let j = 0; j < this.body.length; j++) {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, c = 0;
        for (let b = 0; b < this.posBuf.length; b++) { const p = this.posBuf[b].pts[j]; if (!p) continue; c++; if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
        if (c > 3) { m += Math.hypot(x1 - x0, y1 - y0) / sc; n++; }
      }
      this.motion = n && this.posBuf.length > 8 ? m / n : null;
    } else { this.posBuf = []; this.motion = null; }
    if (v) { this.recent.push({ t: t, v: v }); if (this.recent.length > 30) this.recent.shift(); }

    this.postureNow = this.posture.push(see && f ? classifyPosture(f) : null);
    const postureOk = postureCompatible(this.postureNow, this.expected);
    if (this.state === 'search') {
      this.reason = !see ? 'camera' : !postureOk ? 'wrongPosture' : 'posture';
      let ok = false, need = 700, by = null;
      if (see && v && postureOk) {
        if (this.always) { ok = true; need = 300; by = 'auto'; }
        else if (this.template) {
          this.dist = poseDistance(this.smoothPose(), this.template);
          ok = this.dist <= this.tol && this.motion != null && this.motion < 0.15; need = 600; by = 'template';
        } else {
          const still = this.motion != null && this.motion < 0.1;
          if (this.gate && f && this.gate.start(f)) { ok = true; need = 700; by = 'pattern'; }
          else if (still) { ok = true; need = 1000; by = 'still'; }
        }
      }
      if (ok) { if (this.since == null) this.since = t; if (t - this.since >= need) { this.arm(t, by); out.armed = true; } }
      else this.since = null;
    } else if (this.lastVisibleT == null || t - this.lastVisibleT > 1500) {
      this.state = 'search'; this.since = null; this.reason = 'camera'; out.disarmed = true;
    } else if (this.template && v && !this.always) {
      // quieto pero lejos de la posición aprendida (descansando, estirando): deja de contar
      this.dist = poseDistance(this.smoothPose(), this.template);
      const away = this.dist > this.tol * 1.8 && this.motion != null && this.motion < 0.15;
      if (away) { if (this.awaySince == null) this.awaySince = t; if (t - this.awaySince > 2000) { this.state = 'search'; this.since = null; this.awaySince = null; this.reason = 'posture'; out.disarmed = true; } }
      else this.awaySince = null;
    }

    if (this.state === 'armed' && see) {
      const vals = metricValues(this.metric, lm);
      for (const k in vals) { const s = this.sides[k]; if (s.push(t, vals[k]) && s.range > this.maxRange) this.maxRange = s.range; }
      let best = 0, bs = null; for (const k in this.sides) if (this.sides[k].count > best) { best = this.sides[k].count; bs = this.sides[k]; }
      if (this.base + best - this.rejected > this.reps) {
        if (this.rhythm.accept(t, bs.repMid)) {
          this.reps = this.base + best - this.rejected; this.lastRep = t; out.rep = true;
          this.lastRom = { lo: bs.repLo, hi: bs.repHi }; if (bs.repLo != null) this.romLog.push(this.lastRom);
          out.rom = romCheck(this.ex.startHigh, bs.repLo, bs.repHi, this.romRef || (this.romLog.length >= 4 ? this.romSpan() : null));
        } else this.rejected++;
      }
    }
    out.state = this.state; out.reason = this.reason;
    return out;
  };
  // al cerrar la serie: descarta la última rep si llegó tras una pausa
  RepCounter.prototype.finalize = function () { if (this.rhythm.trailingExtra()) { this.reps--; this.rhythm.times.pop(); this.rhythm.mids.pop(); if (this.romLog) this.romLog.pop(); return true; } return false; };
  RepCounter.prototype.romSpan = function () {
    // el mejor recorrido de la serie (2º mejor extremo, para ignorar un salto aislado)
    const L = this.romLog; if (L.length < 3) return null;
    const lo = L.map(function (x) { return x.lo; }).sort(function (a, b) { return a - b; }), hi = L.map(function (x) { return x.hi; }).sort(function (a, b) { return b - a; });
    return { lo: lo[1], hi: hi[1] };
  };
  RepCounter.prototype.holdProgress = function (t) {
    if (this.state !== 'search' || this.since == null) return 0;
    const need = this.template ? 600 : 1000; return Math.min(1, (t - this.since) / need);
  };
  RepCounter.prototype.debug = function () {
    let b = null; for (const k in this.sides) { const s = this.sides[k]; if (s.ema != null && (!b || s.range > b.range)) b = s; }
    return { state: this.state, by: this.armedBy, dist: this.dist, tol: this.tol, motion: this.motion, value: b ? b.ema : null, range: b ? b.range : null, minRange: this.minRange, template: !!this.template };
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

  // ---------- modo sensor: teléfono en el cuerpo ----------
  // Cuenta reps por el giro del miembro donde va el teléfono: ángulo entre la gravedad actual
  // y la gravedad en la posición de inicio. Funciona con cualquier orientación del teléfono.
  const PLACEMENT = {
    forearm: 'en el antebrazo, con una banda deportiva',
    upperarm: 'en el brazo, a la altura del bíceps, con un brazalete',
    thigh: 'en el muslo, con una banda o en el bolsillo de un short ajustado',
    shin: 'en la pierna, junto al tobillo, con una banda',
    torso: 'en el pecho, con una banda o bajo una camiseta ajustada',
  };
  const PATTERN_PLACE = { curl: 'forearm', pushdown: 'forearm', overhead: 'forearm', raise: 'forearm',
    press_h: 'upperarm', press_v: 'upperarm', pull: 'upperarm', row: 'upperarm', facepull: 'upperarm', fly: 'upperarm',
    squat: 'thigh', lunge: 'thigh', hipthrust: 'thigh', legext: 'shin', legcurl: 'shin', hinge: 'torso', crunch: 'torso', calf: null };

  function SensorCounter(ex, opts) {
    opts = opts || {};
    this.ex = ex; this.place = PATTERN_PLACE[ex.pattern] || null;
    this.minRange = opts.typicalRange ? Math.max(25, opts.typicalRange * 0.55) : 25;
    this.tr = new SideTracker(this.minRange, false);
    this.g = null; this.ref = null; this.gyro = null; this.stillSince = null;
    this.state = 'search'; this.reps = 0; this.lastRep = null; this.maxRange = 0; this.armedBy = null; this.reason = 'posture';
    this.lastPush = 0; this.angle = null; this.paused = false;
    this.rhythm = new Rhythm(); this.romRef = opts.romRef || null; this.romLog = []; this.lastRom = null;
  }
  SensorCounter.prototype.update = function (t, ax, ay, az, rot) {
    const out = { visible: true, rep: false, armed: false, disarmed: false };
    if (ax == null) { out.state = this.state; out.reason = this.reason; return out; }
    // gravedad filtrada (paso bajo) y velocidad de giro suavizada
    if (!this.g) this.g = [ax, ay, az]; else { this.g[0] += 0.12 * (ax - this.g[0]); this.g[1] += 0.12 * (ay - this.g[1]); this.g[2] += 0.12 * (az - this.g[2]); }
    if (rot != null) this.gyro = this.gyro == null ? rot : this.gyro + 0.2 * (rot - this.gyro);
    const n = Math.hypot(this.g[0], this.g[1], this.g[2]) || 1, gn = [this.g[0] / n, this.g[1] / n, this.g[2] / n];
    if (this.state === 'search') {
      const still = this.gyro != null && this.gyro < 18 && !this.paused;
      if (still) { if (this.stillSince == null) this.stillSince = t; if (t - this.stillSince > 900) { this.arm(t, 'still', gn); out.armed = true; } }
      else this.stillSince = null;
    }
    if (this.state === 'armed' && t - this.lastPush >= 33) {
      this.lastPush = t;
      const d = Math.max(-1, Math.min(1, gn[0] * this.ref[0] + gn[1] * this.ref[1] + gn[2] * this.ref[2]));
      this.angle = Math.acos(d) * 180 / Math.PI;
      if (this.tr.push(t, this.angle)) {
        if (this.rhythm.accept(t, this.tr.repMid)) {
          if (this.tr.range > this.maxRange) this.maxRange = this.tr.range; this.reps++; this.lastRep = t; out.rep = true;
          this.lastRom = { lo: this.tr.repLo, hi: this.tr.repHi }; this.romLog.push(this.lastRom);
          out.rom = romCheck(false, this.tr.repLo, this.tr.repHi, this.romRef || (this.romLog.length >= 4 ? this.romSpan() : null));
        }
      }
    }
    out.state = this.state; out.reason = this.reason;
    return out;
  };
  SensorCounter.prototype.arm = function (t, by, gn) { this.state = 'armed'; this.armedBy = by; this.ref = gn.slice(); this.tr.reset(); this.tr.count = 0; this.base = this.reps; };
  SensorCounter.prototype.manualArm = function (t) { if (this.state === 'armed' || !this.g) return false; const n = Math.hypot(this.g[0], this.g[1], this.g[2]) || 1; this.arm(t, 'manual', [this.g[0] / n, this.g[1] / n, this.g[2] / n]); return true; };
  SensorCounter.prototype.count = function () { return this.reps; };
  SensorCounter.prototype.finalize = RepCounter.prototype.finalize;
  SensorCounter.prototype.romSpan = RepCounter.prototype.romSpan;
  SensorCounter.prototype.lastRepT = function () { return this.lastRep; };
  SensorCounter.prototype.firstMoveT = function () { return this.tr.firstMoveT; };
  SensorCounter.prototype.typicalRange = function () { return this.maxRange || null; };
  SensorCounter.prototype.holdProgress = function (t) { return this.state === 'search' && this.stillSince != null ? Math.min(1, (t - this.stillSince) / 900) : 0; };
  SensorCounter.prototype.progress = function () { return this.tr.norm; };
  SensorCounter.prototype.debug = function () { return { state: this.state, by: this.armedBy, dist: null, tol: null, motion: this.gyro, value: this.angle, range: this.tr.range, minRange: this.minRange, template: false }; };
  // fuerza bruta del teléfono quieto (para detectar si alguien movió el trípode)
  function bumpDetector() { let base = null; return function (ax, ay, az) { const m = Math.hypot(ax, ay, az); if (base == null) base = m; base += 0.02 * (m - base); return Math.abs(m - base) > 2.5; }; }

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
    jointsFor: jointsFor, detectionQuality: detectionQuality, classifyPosture: classifyPosture, clipToFrame: clipToFrame, postureCompatible: postureCompatible, POSTURE_NAME: POSTURE_NAME, POSTURE_SAY: POSTURE_SAY, EXPECTED: EXPECTED, torsoDirection: torsoDirection, PostureTracker: PostureTracker, JOINT_HELP: JOINT_HELP, features: features, GATES: GATES, poseVector: poseVector, poseDistance: poseDistance, blendPose: blendPose,
    SensorCounter: SensorCounter, Rhythm: Rhythm, romCheck: romCheck, PLACEMENT: PLACEMENT, PATTERN_PLACE: PATTERN_PLACE, bumpDetector: bumpDetector };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RepCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
