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
    this.minRange = minRange; this.startHigh0 = startHigh; this.startHigh = startHigh;
    this.reset();
  }
  SideTracker.prototype.reset = function () {
    this.buf = []; this.ema = null; this.count = 0; this.visitedOpp = false;
    this.lastRepT = null; this.firstMoveT = null; this.zone = 'none'; this.lastSeenT = null; this.range = 0; this.norm = null; this.frames = 0; this.okFrames = 0;
    this.startHigh = this.startHigh0; this.first = null;
    this.raw = []; this.cycLo = Infinity; this.cycHi = -Infinity; this.repLo = null; this.repHi = null; this.midTime = 0; this.repMid = 0; this.lastPushT = null;
  };
  SideTracker.prototype.push = function (t, v) {
    // mediana de 5 muestras: elimina los saltos sueltos del detector antes de suavizar
    this.raw.push(v); if (this.raw.length > 5) this.raw.shift();
    const srt = this.raw.slice().sort(function (a, b) { return a - b; }); v = srt[srt.length >> 1];
    this.ema = this.ema == null ? v : this.ema + 0.45 * (v - this.ema);
    if (this.first == null) this.first = this.ema;
    if (this.ema < this.cycLo) this.cycLo = this.ema; if (this.ema > this.cycHi) this.cycHi = this.ema;
    this.lastSeenT = t;
    const buf = this.buf; buf.push({ t: t, v: this.ema });
    while (buf.length && t - buf[0].t > 8000) buf.shift();
    let mn = Infinity, mx = -Infinity;
    if (this.robust && buf.length > 20) {
      // rango robusto: ignora un movimiento suelto (acomodarse, tomar la barra) que dura poco en la ventana
      const vs = buf.map(function (b) { return b.v; }).sort(function (a, b) { return a - b; });
      mn = vs[Math.floor(vs.length * 0.06)]; mx = vs[Math.ceil(vs.length * 0.94) - 1];
    } else for (let i = 0; i < buf.length; i++) { if (buf[i].v < mn) mn = buf[i].v; if (buf[i].v > mx) mx = buf[i].v; }
    this.range = mx - mn;
    if (this.range < this.minRange) { this.zone = 'still'; this.norm = null; return false; }
    const n = (this.ema - mn) / this.range; this.norm = n;
    // dirección desconocida: la posición al armar (primera muestra) es la de inicio
    if (this.startHigh == null) this.startHigh = this.first == null ? n > 0.5 : (this.first - mn) / this.range > 0.5;
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
  // ---------- postura 3D con gravedad ----------
  // wl: esqueleto 3D del detector (metros, x derecha, y abajo, z profundidad); up: vector "arriba" del mundo en esos ejes.
  // Mide la inclinación REAL de tronco, muslo y canilla: no depende de la altura ni del ángulo de la cámara.
  function vsub(a, b) { return [a.x - b.x, a.y - b.y, a.z - b.z]; }
  function vang(v, u) { const n = Math.hypot(v[0], v[1], v[2]) * Math.hypot(u[0], u[1], u[2]); if (!n) return null; return Math.acos(Math.max(-1, Math.min(1, (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / n))) * 180 / Math.PI; }
  function posture3DFeatures(wl, vis, up) {
    if (!wl) return null;
    const ok = function (i) { return vis(i) && wl[i]; };
    const midw = function (a, b) { return { x: (wl[a].x + wl[b].x) / 2, y: (wl[a].y + wl[b].y) / 2, z: (wl[a].z + wl[b].z) / 2 }; };
    const down = [-up[0], -up[1], -up[2]];
    const f = {};
    let sh = null, hp = null;
    if (ok(11) && ok(12)) sh = midw(11, 12); else if (ok(11)) sh = wl[11]; else if (ok(12)) sh = wl[12];
    if (ok(23) && ok(24)) hp = midw(23, 24); else if (ok(23)) hp = wl[23]; else if (ok(24)) hp = wl[24];
    if (sh && hp) f.torso = vang(vsub(sh, hp), up);
    ['L', 'R'].forEach(function (k) {
      const S = SIDE[k];
      if (ok(S.hip) && ok(S.kn)) { const a = vang(vsub(wl[S.kn], wl[S.hip]), down); if (a != null) f.thigh = f.thigh == null ? a : Math.min(f.thigh, a); }
      if (ok(S.kn) && ok(S.an)) { const a = vang(vsub(wl[S.an], wl[S.kn]), down); if (a != null) f.shin = f.shin == null ? a : Math.min(f.shin, a); }
    });
    return f;
  }
  function classifyPosture3D(f) {
    if (!f || f.torso == null) return null;
    const T = f.torso;
    if (T > 120) return 'inverted';
    // tronco horizontal: si los muslos están cerca de verticales es una bisagra (peso muerto, remo), no acostado
    if (T >= 60) return f.thigh != null && f.thigh < 55 ? 'bent' : 'lying';
    if (T > 35) return 'bent';
    if (f.thigh == null) return 'upright';
    if (f.thigh > 55) return 'seated';                   // muslo cerca de horizontal
    if (f.shin != null && f.shin > 55) return 'kneeling'; // muslo vertical, canilla horizontal
    return 'standing';
  }
  // "arriba" del mundo en los ejes de la imagen que analiza el detector
  // g: gravedad del teléfono (accelerationIncludingGravity, apunta hacia arriba); a: ángulo de pantalla; r: giro aplicado; zs: signo del eje de profundidad
  function upVector(g, a, r, zs) {
    if (!g) return [0, -1, 0];
    const n = Math.hypot(g.x, g.y, g.z) || 1, s = Math.hypot(g.x, g.y) / n;
    const phi = (Math.atan2(g.x, g.y) * 180 / Math.PI - a + r) * Math.PI / 180;
    return [Math.sin(phi) * s, -Math.cos(phi) * s, -(g.z / n) * zs];
  }

  // ---------- ángulos y medidas en 3D (no se deforman con la perspectiva) ----------
  function angle3(a, b, c) { return vang([a.x - b.x, a.y - b.y, a.z - b.z], [c.x - b.x, c.y - b.y, c.z - b.z]); }
  function dot3(v, u) { return v[0] * u[0] + v[1] * u[1] + v[2] * u[2]; }
  function metricValues3D(metric, wl, vis, up) {
    const out = {}, ok = function () { for (let i = 0; i < arguments.length; i++) if (!vis(arguments[i]) || !wl[arguments[i]]) return false; return true; };
    if (metric === 'wristDist') { if (ok(11, 12, 15, 16)) { const sw = Math.hypot.apply(null, vsub(wl[11], wl[12])); if (sw) out.C = Math.hypot.apply(null, vsub(wl[15], wl[16])) / sw; } return out; }
    if (metric === 'kneeMin') { const vals = []; ['L', 'R'].forEach(function (k) { const S = SIDE[k]; if (ok(S.hip, S.kn, S.an)) vals.push(angle3(wl[S.hip], wl[S.kn], wl[S.an])); }); if (vals.length) out.C = Math.min.apply(null, vals); return out; }
    ['L', 'R'].forEach(function (k) {
      const S = SIDE[k]; let v = null;
      if (metric === 'elbow' && ok(S.sh, S.el, S.wr)) v = angle3(wl[S.sh], wl[S.el], wl[S.wr]);
      else if (metric === 'knee' && ok(S.hip, S.kn, S.an)) v = angle3(wl[S.hip], wl[S.kn], wl[S.an]);
      else if (metric === 'hip' && ok(S.sh, S.hip, S.kn)) v = angle3(wl[S.sh], wl[S.hip], wl[S.kn]);
      else if (metric === 'shoulderAbd' && ok(S.hip, S.sh, S.el)) v = angle3(wl[S.hip], wl[S.sh], wl[S.el]);
      else if (metric === 'heel' && up && ok(S.hip, S.an, S.toe)) { const leg = Math.hypot.apply(null, vsub(wl[S.hip], wl[S.an])); if (leg) v = dot3(vsub(wl[S.an], wl[S.toe]), up) / leg; }
      if (v != null) out[k] = v;
    });
    return out;
  }
  // medidas para evaluar el recorrido de cada rep (promedio de los lados visibles)
  function romFeatures(wl, vis, up) {
    const acc = {}, add = function (k, v) { if (v == null || isNaN(v)) return; (acc[k] = acc[k] || []).push(v); };
    const ok = function () { for (let i = 0; i < arguments.length; i++) if (!vis(arguments[i]) || !wl[arguments[i]]) return false; return true; };
    const down = up ? [-up[0], -up[1], -up[2]] : null;
    ['L', 'R'].forEach(function (k) {
      const S = SIDE[k];
      if (ok(S.sh, S.el, S.wr)) { add('elbow', angle3(wl[S.sh], wl[S.el], wl[S.wr])); if (up) add('wristH', dot3(vsub(wl[S.wr], wl[S.sh]), up)); }
      if (ok(S.hip, S.kn, S.an)) add('knee', angle3(wl[S.hip], wl[S.kn], wl[S.an]));
      if (ok(S.sh, S.hip, S.kn)) add('hip', angle3(wl[S.sh], wl[S.hip], wl[S.kn]));
      if (up && ok(S.hip, S.kn)) add('hipKneeH', dot3(vsub(wl[S.hip], wl[S.kn]), up));
      if (down && ok(S.sh, S.el)) add('abd', vang(vsub(wl[S.el], wl[S.sh]), down));
      if (up && ok(S.wr, S.kn)) add('wristKneeH', dot3(vsub(wl[S.wr], wl[S.kn]), up));
    });
    const o = {}; for (const k in acc) o[k] = acc[k].reduce(function (a, b) { return a + b; }, 0) / acc[k].length;
    o.kneeMin = acc.knee ? Math.min.apply(null, acc.knee) : undefined;
    if (ok(15, 16)) o.wristDist = Math.hypot.apply(null, vsub(wl[15], wl[16]));
    if (up && ok(11, 12, 23, 24)) { const sh = { x: (wl[11].x + wl[12].x) / 2, y: (wl[11].y + wl[12].y) / 2, z: (wl[11].z + wl[12].z) / 2 }, hp = { x: (wl[23].x + wl[24].x) / 2, y: (wl[23].y + wl[24].y) / 2, z: (wl[23].z + wl[24].z) / 2 }; o.torsoTilt = vang(vsub(sh, hp), up); }
    return o;
  }
  // criterios de recorrido completo por ejercicio (en grados o metros reales). k = holgura según la exigencia.
  // deep: llegar al extremo del movimiento; full: volver completo a la posición de inicio. Devuelve true/false, o null si no se puede medir.
  const lte = function (v, t) { return v == null ? null : v <= t; }, gte = function (v, t) { return v == null ? null : v >= t; };
  // usa el criterio principal (alturas reales) y solo si no se puede medir, el secundario (ángulo)
  const prefer = function (a, b) { return a != null ? a : b; };
  const ROM3D = {
    press_h: { deep: function (m, k) { return prefer(lte(m.min.wristH, 0.12 + 0.05 * k), lte(m.min.elbow, 95 + 10 * k)); }, full: function (M, k) { return gte(M.max.elbow, 150 - 10 * k); } },
    press_v: { deep: function (m, k) { return gte(m.max.elbow, 150 - 10 * k); }, full: function (m, k) { return prefer(lte(m.min.wristH, 0.12 + 0.05 * k), lte(m.min.elbow, 85 + 10 * k)); } },
    squat: { deep: function (m, k) { return prefer(lte(m.min.hipKneeH, 0.05 + 0.05 * k), lte(m.min.knee, 95 + 10 * k)); }, full: function (m, k) { return gte(m.max.knee, 160 - 10 * k); } },
    lunge: { deep: function (m, k) { return lte(m.min.kneeMin, 100 + 10 * k); }, full: function (m, k) { return gte(m.max.knee, 150 - 10 * k); } },
    hinge: { deep: function (m, k) { return prefer(gte(m.max.torsoTilt, 45 - 10 * k), lte(m.min.wristKneeH, 0.05 + 0.05 * k)); }, full: function (m, k) { return lte(m.min.torsoTilt, 20 + 10 * k); } },
    hipthrust: { deep: function (m, k) { return gte(m.max.hip, 160 - 10 * k); }, full: function (m, k) { return lte(m.min.hip, 125 + 10 * k); } },
    pull: { deep: function (m, k) { return prefer(lte(m.min.wristH, 0.15 + 0.05 * k), lte(m.min.elbow, 75 + 10 * k)); }, full: function (m, k) { return gte(m.max.elbow, 150 - 10 * k); } },
    row: { deep: function (m, k) { return lte(m.min.elbow, 85 + 10 * k); }, full: function (m, k) { return gte(m.max.elbow, 150 - 10 * k); } },
    curl: { deep: function (m, k) { return lte(m.min.elbow, 60 + 10 * k); }, full: function (m, k) { return gte(m.max.elbow, 150 - 10 * k); } },
    pushdown: { deep: function (m, k) { return gte(m.max.elbow, 155 - 10 * k); }, full: function (m, k) { return lte(m.min.elbow, 90 + 10 * k); } },
    overhead: { deep: function (m, k) { return gte(m.max.elbow, 150 - 10 * k); }, full: function (m, k) { return lte(m.min.elbow, 80 + 10 * k); } },
    raise: { deep: function (m, k) { return gte(m.max.abd, 75 - 10 * k); }, full: function (m, k) { return lte(m.min.abd, 25 + 10 * k); } },
    fly: { deep: function (m, k) { return lte(m.min.wristDist, 0.30 + 0.08 * k); }, full: function () { return null; } },
    facepull: { deep: function (m, k) { return lte(m.min.elbow, 100 + 10 * k); }, full: function (m, k) { return gte(m.max.elbow, 150 - 10 * k); } },
    legcurl: { deep: function (m, k) { return lte(m.min.knee, 80 + 10 * k); }, full: function (m, k) { return gte(m.max.knee, 155 - 10 * k); } },
    legext: { deep: function (m, k) { return gte(m.max.knee, 160 - 10 * k); }, full: function (m, k) { return lte(m.min.knee, 100 + 10 * k); } },
  };
  // devuelve 'deep' | 'full' | null (bien) | undefined (no se pudo medir en 3D)
  function romCheck3D(pattern, ext, k) {
    const R = ROM3D[pattern]; if (!R) return undefined;
    const m = { min: ext.min, max: ext.max };
    const d = R.deep(m, k), f = R.full(m, k);
    if (d == null && f == null) return undefined;
    return d === false ? 'deep' : f === false ? 'full' : null;
  }

  // ---------- posturas calibradas por el usuario ----------
  // profile: { standing: {t3, th, sh, t2}, seated: {...}, ... } grabado con SU cámara y SU sala.
  const PKEYS = ['t3', 'th', 'sh', 't2'];
  function postureVector(f3, f2) { return { t3: f3 && f3.torso, th: f3 && f3.thigh, sh: f3 && f3.shin, t2: f2 && f2.torso }; }
  function classifyWithProfile(vec, profile) {
    if (!profile) return null;
    let best = null, bd = Infinity, n2 = 0;
    for (const name in profile) {
      const p = profile[name]; let s = 0, n = 0;
      PKEYS.forEach(function (k) { if (vec[k] != null && p[k] != null) { const d = (vec[k] - p[k]) / 20; s += d * d; n++; } });
      if (n >= 2) { n2++; const d = Math.sqrt(s / n); if (d < bd) { bd = d; best = name; } }
    }
    return n2 >= 2 && bd < 2.5 ? best : null;
  }

  // corrige al perfil calibrado cuando las piernas lo contradicen claramente
  function sanePosture(p, f) {
    if (!p || !f || f.torso == null) return p;
    if (p === 'lying' && f.thigh != null && f.thigh < 45 && f.torso < 110) return 'bent';
    if ((p === 'standing' || p === 'seated' || p === 'kneeling' || p === 'upright') && f.torso >= 70 && f.thigh != null && f.thigh >= 60) return 'lying';
    return p;
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

  // ---------- banco de señales: varias candidatas, cuenta con la más limpia ----------
  // Cada ejercicio produce entre 6 y 12 señales (ángulos 2D/3D por lado, alturas de muñeca/cadera/hombro…).
  // Se elige en vivo la de mejor relación movimiento/ruido; así una señal mala (p. ej. el codo en 3D) no bloquea el conteo.
  const ARM_PATTERNS = ['press_h', 'press_v', 'pull', 'row', 'curl', 'pushdown', 'overhead', 'facepull', 'raise', 'fly'];
  function signalCandidates(pattern, lm, wl, vis, up) {
    const o = {}, v = function (i) { return vis(i) && lm && lm[i]; };
    const mid2 = function (a, b) { return v(a) && v(b) ? { x: (lm[a].x + lm[b].x) / 2, y: (lm[a].y + lm[b].y) / 2 } : v(a) ? lm[a] : v(b) ? lm[b] : null; };
    const sh = mid2(11, 12), hp = mid2(23, 24), an = mid2(27, 28), kn = mid2(25, 26);
    const T = sh && hp ? dist(sh, hp) : null;
    const put = function (k, val, unit) { if (val != null && !isNaN(val)) o[k] = { v: val, u: unit }; };
    const arm = ARM_PATTERNS.indexOf(pattern) >= 0;
    ['L', 'R'].forEach(function (k) {
      const S = SIDE[k];
      if (arm) {
        if (v(S.sh) && v(S.el) && v(S.wr)) put('codo2D-' + k, angle(lm[S.sh], lm[S.el], lm[S.wr]), 'deg');
        if (wl && v(S.sh) && v(S.el) && v(S.wr)) put('codo3D-' + k, angle3(wl[S.sh], wl[S.el], wl[S.wr]), 'deg');
        if (pattern === 'raise' || pattern === 'facepull') {
          if (v(S.hip) && v(S.sh) && v(S.el)) put('hombro2D-' + k, angle(lm[S.hip], lm[S.sh], lm[S.el]), 'deg');
          if (wl && v(S.hip) && v(S.sh) && v(S.el)) put('hombro3D-' + k, angle3(wl[S.hip], wl[S.sh], wl[S.el]), 'deg');
        }
      } else {
        if (v(S.hip) && v(S.kn) && v(S.an)) put('rodilla2D-' + k, angle(lm[S.hip], lm[S.kn], lm[S.an]), 'deg');
        if (wl && v(S.hip) && v(S.kn) && v(S.an)) put('rodilla3D-' + k, angle3(wl[S.hip], wl[S.kn], wl[S.an]), 'deg');
        if (v(S.sh) && v(S.hip) && v(S.kn)) put('cadera2D-' + k, angle(lm[S.sh], lm[S.hip], lm[S.kn]), 'deg');
        if (wl && v(S.sh) && v(S.hip) && v(S.kn)) put('cadera3D-' + k, angle3(wl[S.sh], wl[S.hip], wl[S.kn]), 'deg');
      }
    });
    if (T) {
      if (arm) {
        const wr = mid2(15, 16); if (wr && sh) put('muñecaY', (wr.y - sh.y) / T, 'ratio');
        const el = mid2(13, 14); if (el && sh) put('codoY', (el.y - sh.y) / T, 'ratio');
        if (pattern === 'fly' && v(15) && v(16) && v(11) && v(12)) { const sw = dist(lm[11], lm[12]); if (sw) put('manos2D', dist(lm[15], lm[16]) / sw, 'ratio'); }
      } else {
        if (hp && an) put('caderaY', (an.y - hp.y) / T, 'ratio');
        if (sh && an) put('hombroY', (an.y - sh.y) / T, 'ratio');
        if (pattern === 'legcurl' || pattern === 'legext') { if (an && kn) put('tobilloY', (an.y - kn.y) / T, 'ratio'); }
        if (pattern === 'calf') {
          const hv = metricValues('heel', lm); for (const k in hv) put('talon-' + k, hv[k], 'ratio');
          // de pie: la cadera sube respecto de la punta del pie; sentado: sube la rodilla
          const to = mid2(31, 32);
          if (to && hp) put('caderaPunta', (to.y - hp.y) / T, 'ratio');
          if (to && kn) put('rodillaPunta', (to.y - kn.y) / T, 'ratio');
        }
      }
    }
    if (wl && up) {
      const rf = romFeatures(wl, vis, up);
      if (arm && rf.wristH != null) put('muñeca3D', rf.wristH, 'm');
      if (!arm && rf.hipKneeH != null) put('caderaRodilla3D', rf.hipKneeH, 'm');
      if (pattern === 'calf') {
        const m3 = function (a, b) { return vis(a) && vis(b) && wl[a] && wl[b] ? { x: (wl[a].x + wl[b].x) / 2, y: (wl[a].y + wl[b].y) / 2, z: (wl[a].z + wl[b].z) / 2 } : vis(a) && wl[a] ? wl[a] : vis(b) && wl[b] ? wl[b] : null; };
        const toe3 = m3(31, 32), hip3 = m3(23, 24), kn3 = m3(25, 26);
        if (toe3 && hip3) put('caderaPunta3D', dot3(vsub(hip3, toe3), up), 'm');
        if (toe3 && kn3) put('rodillaPunta3D', dot3(vsub(kn3, toe3), up), 'm');
      }
    }
    return o;
  }
  const MIN_AMP = { deg: 30, ratio: 0.18, m: 0.12 };
  // movimientos cortos: umbral mínimo menor (gemelos: el talón sube 5–8 cm)
  const MIN_AMP_PATTERN = { calf: { deg: 8, ratio: 0.035, m: 0.025 } };
  function minAmpFor(pattern, unit) { const o = MIN_AMP_PATTERN[pattern]; return (o && o[unit]) || MIN_AMP[unit]; }
  function Candidate(unit, startHigh, minAmp) {
    this.unit = unit; this.minAmp = minAmp || MIN_AMP[unit]; this.tr = new SideTracker(this.minAmp, startHigh); this.tr.robust = true; this.buf = []; this.snr = 0; this.amp = 0;
    this.lo = Infinity; this.hi = -Infinity;   // extremos desde la última rep contada (para detectar reps atípicas)
  }
  Candidate.prototype.push = function (t, x) {
    const b = this.buf; b.push({ t: t, x: x }); while (b.length && t - b[0].t > 6000) b.shift();
    if (b.length > 12) {
      const xs = b.map(function (p) { return p.x; }).sort(function (a, c) { return a - c; });
      this.amp = xs[Math.floor(xs.length * 0.92)] - xs[Math.floor(xs.length * 0.08)];
      // ruido: segunda diferencia (el movimiento suave casi no la tiene; el temblor del detector sí)
      const d2 = []; for (let i = 2; i < b.length; i++) d2.push(Math.abs(b[i].x - 2 * b[i - 1].x + b[i - 2].x));
      d2.sort(function (a, c) { return a - c; });
      const noise = d2[d2.length >> 1] + this.minAmp * 0.01;
      this.snr = this.amp >= this.minAmp ? this.amp / noise : 0;
    }
    const r = this.tr.push(t, x), e = this.tr.ema;
    if (e < this.lo) this.lo = e; if (e > this.hi) this.hi = e;
    return r;
  };
  // señal de referencia de cada métrica: su dirección (empieza arriba o abajo) se conoce por el ejercicio
  const REF_PREFIX = { elbow: ['codo2D-', 'codo3D-'], knee: ['rodilla2D-', 'rodilla3D-'], kneeMin: ['rodilla2D-', 'rodilla3D-'], hip: ['cadera2D-', 'cadera3D-'], shoulderAbd: ['hombro2D-', 'hombro3D-'], wristDist: ['manos2D'], heel: ['talon-'] };
  function corr(a, b) {
    const n = a.length; if (n < 20) return 0; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
    let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; sab += x * y; saa += x * x; sbb += y * y; }
    return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
  }
  function SignalBank(mode, ref, pattern) { this.pattern = pattern || null; this.c = {}; this.leader = null; this.offset = 0; this.count = 0; this.leaderReps = 0; this.mode = mode || 'consensus'; this.ref = ref || null; this.t0 = null; this.reps = []; }
  SignalBank.prototype.isRef = function (k) { return !!(this.ref && this.ref.prefixes.some(function (p) { return k.indexOf(p) === 0; })); };
  // dirección de las demás señales: se correlaciona con la de referencia (ej.: en press banca, codo estirado = muñeca arriba)
  SignalBank.prototype.resolveDir = function (t) {
    let refK = null, best = 0;
    for (const k in this.c) { const c = this.c[k]; if (this.isRef(k) && c.amp >= c.minAmp && c.snr > best) { best = c.snr; refK = k; } }
    for (const k in this.c) {
      const c = this.c[k]; if (c.dirKnown) continue;
      if (refK && c.amp >= c.minAmp) {
        const m = {}; this.c[refK].buf.forEach(function (p) { m[p.t] = p.x; });
        const a = [], b = []; c.buf.forEach(function (p) { if (m[p.t] != null) { a.push(p.x); b.push(m[p.t]); } });
        const r = corr(a, b);
        if (Math.abs(r) > 0.5) { c.tr.startHigh = r > 0 ? this.ref.startHigh : !this.ref.startHigh; c.tr.visitedOpp = false; c.dirKnown = true; continue; }
      }
      // sin referencia visible: después de 4 s se acepta la dirección deducida de la posición inicial
      if (!refK && t - c.t0 > 4000) c.dirKnown = true;
    }
  };
  SignalBank.prototype.score = function (k) {
    const c = this.c[k]; if (!c) return 0;
    const pres = c.pres.length ? c.pres.reduce(function (a, b) { return a + b; }, 0) / c.pres.length : 0;
    c.coverage = pres;
    return c.snr * pres * pres;          // señales con huecos (muñeca fuera de cuadro, tapada) pierden
  };
  SignalBank.prototype.push = function (t, cands) {
    if (this.t0 == null) this.t0 = t;
    for (const k in cands) {
      let c = this.c[k];
      if (!c) {
        const isRef = this.isRef(k);
        c = this.c[k] = new Candidate(cands[k].u, isRef ? this.ref.startHigh : null, minAmpFor(this.pattern, cands[k].u));
        c.dirKnown = isRef || !this.ref; c.t0 = t;
      }
      c.pres = c.pres || [];
      c.push(t, cands[k].v);
    }
    for (const k in this.c) { const c = this.c[k]; c.pres = c.pres || []; c.pres.push(k in cands ? 1 : 0); if (c.pres.length > 120) c.pres.shift(); }
    this.frames = (this.frames || 0) + 1;
    if (this.ref && this.frames % 10 === 0) this.resolveDir(t);
    let best = null, bs = 0;
    for (const k in this.c) { const sc = this.score(k); if (sc > bs) { bs = sc; best = k; } }
    const cur = this.leader, cs = cur ? this.score(cur) : 0;
    if (best && best !== cur) {
      // con un líder que ya cuenta bien, solo se cambia si se pierde (huecos) o queda muy por debajo
      const locked = cur && this.leaderReps >= 2 && this.c[cur].coverage > 0.6 && cs > bs * 0.4;
      const better = !cur || cs === 0 || bs > cs * 1.35;
      if (!locked && better) {
        if (this.newLeader !== best) { this.newLeader = best; this.newLeaderT = t; }
        else if (!cur || cs === 0 || t - this.newLeaderT > 1200) {
          this.offset = this.count - this.c[best].tr.count; this.leader = best; this.newLeader = null; this.leaderReps = 0;
        }
      } else this.newLeader = null;
    }
    if (this.mode === 'consensus') {
      // consenso: mediana de las cuentas de todas las señales buenas (presentes y con buen movimiento/ruido)
      const top = bs;
      const counts = [];
      const used = [];
      for (const k in this.c) { const c = this.c[k]; if (c.dirKnown && (c.coverage || 0) >= 0.7 && this.score(k) >= top * 0.3 && c.amp >= c.minAmp) { counts.push(c.tr.count); used.push(k); } }
      if (counts.length) {
        counts.sort(function (x, y) { return x - y; });
        const m = counts.length % 2 ? counts[counts.length >> 1] : Math.floor((counts[counts.length / 2 - 1] + counts[counts.length / 2]) / 2);
        if (m > this.count) { const d = m - this.count; this.count = m; this.leaderReps++; this.mark(t, used); return d; }
      }
      return 0;
    }
    if (this.leader) {
      const n = this.c[this.leader].tr.count + this.offset;
      if (n > this.count) { const d = n - this.count; this.count = n; this.leaderReps++; this.mark(t, [this.leader]); return d; }
    }
    return 0;
  };
  // guarda los extremos de cada señal en esta rep (para reconocer al final las reps atípicas: tomar o soltar la barra)
  SignalBank.prototype.mark = function (t, used) {
    const ext = {};
    for (let i = 0; i < used.length; i++) { const c = this.c[used[i]]; if (isFinite(c.lo) && isFinite(c.hi)) ext[used[i]] = [c.lo, c.hi]; }
    this.reps.push({ t: t, ext: ext });
    for (const k in this.c) { const c = this.c[k]; c.lo = c.tr.ema; c.hi = c.tr.ema; }
  };
  // recorrido habitual de cada señal (mediana de las últimas reps)
  SignalBank.prototype.envelope = function () {
    const R = this.reps.slice(-8), o = {}, ks = {};
    R.forEach(function (r) { for (const k in r.ext) ks[k] = 1; });
    for (const k in ks) {
      const xs = R.filter(function (r) { return r.ext[k]; }).map(function (r) { return r.ext[k]; }); if (xs.length < 3) continue;
      const lo = median(xs.map(function (x) { return x[0]; })), hi = median(xs.map(function (x) { return x[1]; })), amp = median(xs.map(function (x) { return x[1] - x[0]; }));
      if (amp > 0) o[k] = { lo: lo, hi: hi, amp: amp };
    }
    return o;
  };
  SignalBank.prototype.leaderTracker = function () { return this.leader ? this.c[this.leader].tr : null; };
  SignalBank.prototype.firstMoveT = function () { const tr = this.leaderTracker(); return tr ? tr.firstMoveT : null; };

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
  function romCheck(startHigh, lo, hi, ref, tolFrac) {
    if (!ref || lo == null || hi == null) return null;
    const span = ref.hi - ref.lo; if (span <= 0) return null;
    const tol = Math.max((tolFrac || 0.25) * span, 0.0001);
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
    this.rhythm = new Rhythm(); this.romRef = opts.romRef || null; this.lastRom = null; this.romLog = []; this.romSlack = opts.romSlack ?? 1; this.relTol = opts.relTol ?? 0.25; this.cyc = null; this.multi = opts.multi !== false; this.use3dRom = opts.use3dRom !== false; this.bankMode = opts.bankMode || 'consensus'; this.bank = this.newBank();
    this.state = 'search'; this.since = null; this.reason = 'camera';
    this.expected = ex.post || EXPECTED[ex.id] || null;
    // bisagras (peso muerto, rumano, swing): se empieza de pie o inclinado sobre la barra
    if (this.expected && ex.pattern === 'hinge' && this.expected.indexOf('bent') < 0) this.expected = this.expected.concat(['bent']); this.posture = new PostureTracker(); this.postureNow = null;
    this.motion = null; this.posBuf = []; this.recent = []; this.armPose = null; this.dist = null; this.armedBy = null;
  }
  RepCounter.prototype.newBank = function () { return new SignalBank(this.bankMode, REF_PREFIX[this.metric] ? { prefixes: REF_PREFIX[this.metric], startHigh: this.ex.startHigh } : null, this.ex.pattern); };
  RepCounter.prototype.resetTrackers = function () { this.base = this.reps; for (const k in this.sides) this.sides[k].reset(); this.bank = this.newBank(); this.bankBase = this.reps; this.series = {}; this.seriesFrames = 0; this.releasedT = null; this.outSince = null; };
  RepCounter.prototype.arm = function (t, by) {
    this.state = 'armed'; this.armedBy = by; this.since = null; this.awaySince = null; this.badPostSince = null; this.cyc = null; this.resetTrackers();
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
  RepCounter.prototype.update = function (t, lm, quality, W, H, post3d, ctx3) {
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

    this.postureNow = this.posture.push(post3d !== undefined ? post3d : (see && f ? classifyPosture(f) : null));
    const postureOk = postureCompatible(this.postureNow, this.expected);
    if (this.state === 'search') {
      this.reason = !see ? 'camera' : !postureOk ? 'wrongPosture' : 'posture';
      let ok = false, need = 700, by = null;
      if (this.manualOnly) { this.reason = see ? 'voice' : 'camera'; }   // empieza solo con la palabra (o el botón)
      else if (see && v && postureOk) {
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
      if (!ok && !this.manualOnly && see && v && !postureOk && this.motion != null && this.motion < 0.1) {
        if (this.badSince == null) this.badSince = t;
        if (t - this.badSince > 6000) { ok = true; need = 0; by = 'fallback'; this.since = t; out.postureFallback = true; }
      } else if (postureOk || !see) this.badSince = null;
      if (ok) { if (this.since == null) this.since = t; if (t - this.since >= need) { this.arm(t, by); this.badSince = null; out.armed = true; } }
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

    if (this.state === 'armed' && see && this.multi) {
      // modo profesional: banco de señales, cuenta con la más limpia
      const vis2 = ctx3 && ctx3.vis ? ctx3.vis : function (i) { return lm[i] && (lm[i].visibility ?? 1) >= VIS; };
      if (ctx3 && ctx3.wl) {
        const rf = romFeatures(ctx3.wl, ctx3.vis, ctx3.up), c = this.cyc || (this.cyc = { min: {}, max: {} });
        for (const k in rf) { const v0 = rf[k]; if (v0 == null || isNaN(v0)) continue; if (c.min[k] == null || v0 < c.min[k]) c.min[k] = v0; if (c.max[k] == null || v0 > c.max[k]) c.max[k] = v0; }
      }
      const cands = signalCandidates(this.ex.pattern, lm, ctx3 && ctx3.wl, vis2, ctx3 && ctx3.up);
      const SR = this.series || (this.series = {}); this.seriesFrames = (this.seriesFrames || 0) + 1;
      for (const k in cands) (SR[k] || (SR[k] = [])).push({ t: t, x: cands[k].v });
      const dn = this.bank.push(t, cands);
      if (dn) {
        // si varias señales confirman de una vez reps anteriores (al empezar), se suman todas
        if (dn > 1) this.reps += dn - 1;
        if (this.rhythm.accept(t, (this.bank.leaderTracker() || {}).repMid)) {
          const lt = this.bank.leaderTracker();
          this.reps++; this.lastRep = t; out.rep = true; out.added = dn;
          this.lastRom = lt ? { lo: lt.repLo, hi: lt.repHi } : null; if (this.lastRom && this.lastRom.lo != null) this.romLog.push(this.lastRom);
          const r3 = this.cyc && this.use3dRom ? romCheck3D(this.ex.pattern, this.cyc, this.romSlack) : undefined;
          out.rom = r3 !== undefined ? r3 : (lt ? romCheck(lt.startHigh, lt.repLo, lt.repHi, this.romLog.length >= 4 ? this.romSpan() : null, this.relTol) : null);
          out.rom3d = r3 !== undefined; this.cyc = null;
        } else this.cyc = null;
      }
      out.signal = this.bank.leader;
    } else if (this.state === 'armed' && see) {
      const use3 = ctx3 && ctx3.wl;
      const vals = use3 ? metricValues3D(this.metric, ctx3.wl, ctx3.vis, ctx3.up) : metricValues(this.metric, lm);
      if (use3) {   // extremos del ciclo actual para evaluar el recorrido en vivo
        const rf = romFeatures(ctx3.wl, ctx3.vis, ctx3.up), c = this.cyc || (this.cyc = { min: {}, max: {} });
        for (const k in rf) { const v = rf[k]; if (v == null || isNaN(v)) continue; if (c.min[k] == null || v < c.min[k]) c.min[k] = v; if (c.max[k] == null || v > c.max[k]) c.max[k] = v; }
      }
      for (const k in vals) { const s = this.sides[k]; if (s.push(t, vals[k]) && s.range > this.maxRange) this.maxRange = s.range; }
      let best = 0, bs = null; for (const k in this.sides) if (this.sides[k].count > best) { best = this.sides[k].count; bs = this.sides[k]; }
      if (this.base + best - this.rejected > this.reps) {
        if (this.rhythm.accept(t, bs.repMid)) {
          this.reps = this.base + best - this.rejected; this.lastRep = t; out.rep = true;
          this.lastRom = { lo: bs.repLo, hi: bs.repHi }; if (bs.repLo != null) this.romLog.push(this.lastRom);
          const r3 = this.cyc ? romCheck3D(this.ex.pattern, this.cyc, this.romSlack) : undefined;
          out.rom = r3 !== undefined ? r3 : romCheck(this.ex.startHigh, bs.repLo, bs.repHi, this.romRef || (this.romLog.length >= 4 ? this.romSpan() : null), this.relTol);
          out.rom3d = r3 !== undefined; this.lastCyc = this.cyc; this.cyc = null;
        } else { this.rejected++; this.cyc = null; }
      }
    }
    out.state = this.state; out.reason = this.reason;
    return out;
  };
  // al cerrar la serie: descarta la última rep si llegó tras una pausa
  // ---------- recuento de la serie completa (segunda pasada) ----------
  // Al terminar la serie se cuenta de nuevo con toda la señal a la vista (no solo el pasado):
  // extremos alternados con histéresis adaptada al tamaño típico de tus reps.
  function pct(a, q) { const b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.min(b.length - 1, Math.max(0, Math.floor(q * (b.length - 1))))]; }
  function smoothSeries(pts) {
    const x = pts.map(function (p) { return p.x; }), o = [];
    for (let i = 0; i < x.length; i++) { const w = x.slice(Math.max(0, i - 2), i + 3).sort(function (a, b) { return a - b; }); o.push(w[w.length >> 1]); }
    const o2 = []; for (let i = 0; i < o.length; i++) { const a = o[Math.max(0, i - 1)], b = o[i], c = o[Math.min(o.length - 1, i + 1)]; o2.push((a + b + c) / 3); }
    return o2;
  }
  function extrema(t, x, h) {
    // extremos alternados (máx, mín, máx…): cada uno separado del anterior por al menos h
    const E = []; let mode = 0, hiI = 0, loI = 0;
    const push = function (k, type) { E.push({ i: k, t: t[k], v: x[k], type: type }); };
    for (let i = 1; i < x.length; i++) {
      if (mode === 0) {
        if (x[i] > x[hiI]) hiI = i; if (x[i] < x[loI]) loI = i;
        if (x[hiI] - x[i] >= h && hiI < i) { push(hiI, 'max'); mode = -1; loI = i; }
        else if (x[i] - x[loI] >= h && loI < i) { push(loI, 'min'); mode = 1; hiI = i; }
      } else if (mode === 1) {
        if (x[i] > x[hiI]) hiI = i; else if (x[hiI] - x[i] >= h) { push(hiI, 'max'); mode = -1; loI = i; }
      } else {
        if (x[i] < x[loI]) loI = i; else if (x[i] - x[loI] >= h) { push(loI, 'min'); mode = 1; hiI = i; }
      }
    }
    // el último extremo pendiente (la serie terminó en él)
    if (mode === 1) push(hiI, 'max'); else if (mode === -1) push(loI, 'min');
    return E;
  }
  function offlineCycles(pts, startHigh, minAmp) {
    if (pts.length < 30) return null;
    const t = pts.map(function (p) { return p.t; }), x = smoothSeries(pts);
    const R = pct(x, 0.95) - pct(x, 0.05); if (!(R >= minAmp)) return null;
    let E = extrema(t, x, Math.max(minAmp * 0.6, R * 0.3));
    const sw = []; for (let i = 1; i < E.length; i++) sw.push(Math.abs(E[i].v - E[i - 1].v));
    if (sw.length < 2) return null;
    const S = median(sw); E = extrema(t, x, Math.max(minAmp * 0.6, S * 0.45));
    const opp = startHigh ? 'min' : 'max', st = startHigh ? 'max' : 'min', cyc = [];
    for (let i = 1; i < E.length - 1; i++) {
      if (E[i].type !== opp || E[i - 1].type !== st || E[i + 1].type !== st) continue;
      const a = E[i - 1].v, b = E[i].v, c = E[i + 1].v;
      // la vuelta debe recorrer al menos la mitad del tamaño típico (si no, no volviste a la posición de inicio)
      if (Math.abs(c - b) < S * 0.5) continue;
      cyc.push({ t: E[i + 1].t, tOpp: E[i].t, lo: Math.min(a, b, c), hi: Math.max(a, b, c), amp: Math.abs(b - (a + c) / 2) });
    }
    return { cycles: cyc, swing: S };
  }
  // quita del borde las reps atípicas: tomar la barra al empezar, soltarla al terminar (pausa larga + recorrido distinto)
  function trimEdges(list) {
    // list: [{t, ext:{k:[lo,hi]}}]
    let first = 0, last = 0;
    const atyp = function (R, i) { const st = edgeStats(R, i); return st && (st.gap > EDGE.gapAlone || (st.gap > EDGE.gap && st.frac >= EDGE.frac)); };
    let R = list.slice();
    for (let k = 0; k < 2 && R.length >= 5 && atyp(R, R.length - 1); k++) { R.pop(); last++; }
    if (R.length >= 5 && atyp(R, 0)) { R.shift(); first++; }
    return { reps: R, first: first, last: last };
  }
  let RECOUNT_CV = 0.45;
  // ritmo de la serie: segundos por rep y cuánto se enlentecieron las últimas (pérdida de velocidad ≈ cercanía al fallo)
  function tempoStats(ts) {
    if (!ts || ts.length < 5) return null;
    const iv = []; for (let i = 1; i < ts.length; i++) iv.push((ts[i] - ts[i - 1]) / 1000);
    const avg = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
    const first = avg(iv.slice(0, 3)), last = avg(iv.slice(-2)), slow = Math.round((last / first - 1) * 100);
    // estimación aproximada: sin enlentecer te sobraban varias reps; muy lento = cerca del fallo
    const rirEst = slow < 8 ? 3 : slow < 18 ? 2 : slow < 30 ? 1 : 0;
    return { tempo: Math.round(median(iv) * 10) / 10, slow: slow, rirEst: rirEst };
  }
  RepCounter.prototype.recount = function () {
    const S = this.series; if (!S || !this.bank) return null;
    const res = [], why = {};
    for (const k in S) {
      const c = this.bank.c[k]; if (!c || !c.dirKnown || c.tr.startHigh == null) { why[k] = 'dir'; continue; }
      const pts = S[k]; const span = pts.length ? pts[pts.length - 1].t - pts[0].t : 0; if (span < 3000) { why[k] = 'corta'; continue; }
      if (pts.length < 0.6 * (this.seriesFrames || 1)) { why[k] = 'huecos'; continue; }   // señal con muchos huecos
      const r = offlineCycles(pts, c.tr.startHigh, c.minAmp); if (!r || !r.cycles.length) { why[k] = 'sinciclos'; continue; }
      why[k] = r.cycles.length; res.push({ k: k, r: r });
    }
    this.recountWhy = why;
    if (!res.length) return null;
    // cada señal se recorta en sus bordes (tomar/soltar la barra) y vota con su cuenta;
    // se descartan señales rotas (muy pocas reps o ritmo irregular) y gana la cuenta más repetida
    const votes = [];
    res.forEach(function (o) {
      const k = o.k, list = o.r.cycles.map(function (c) { const e = {}; e[k] = [c.lo, c.hi]; return { t: c.tOpp, ext: e }; });
      const tr = trimEdges(list), ts = tr.reps.map(function (r) { return r.t; }), iv = [];
      for (let i = 1; i < ts.length; i++) iv.push(ts[i] - ts[i - 1]);
      const m = iv.length ? iv.reduce(function (a, b) { return a + b; }, 0) / iv.length : 0;
      const cv = iv.length > 2 ? Math.sqrt(iv.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / iv.length) / m : 0;
      why[k] = tr.reps.length + (tr.first ? ' -1ª' : '') + (tr.last ? ' -' + tr.last + 'últ' : '') + ' cv' + cv.toFixed(2);
      votes.push({ k: k, n: tr.reps.length, raw: list.length, first: tr.first, last: tr.last, cv: cv, ts: ts });
    });
    const mx = Math.max.apply(null, votes.map(function (v) { return v.n; }));
    const good = votes.filter(function (v) { return v.n >= 2 && v.n >= 0.6 * mx && v.cv < RECOUNT_CV; });
    if (!good.length) return null;          // ninguna señal confiable: queda el conteo en vivo
    const freq = {}; good.forEach(function (v) { freq[v.n] = (freq[v.n] || 0) + 1; });
    const ns = good.map(function (v) { return v.n; }).sort(function (a, b) { return a - b; }), med = ns[(ns.length - 1) >> 1];
    let best = med; for (const n in freq) if (freq[n] > freq[best] || (freq[n] === freq[best] && Math.abs(n - med) < Math.abs(best - med))) best = +n;
    const pick = good.filter(function (v) { return v.n === best; }).sort(function (a, b) { return a.cv - b.cv; });
    this.repTimes = pick[0].ts;
    return { count: best, raw: Math.max.apply(null, pick.map(function (v) { return v.raw; })), first: Math.max.apply(null, pick.map(function (v) { return v.first; })), last: Math.max.apply(null, pick.map(function (v) { return v.last; })), signals: good.length };
  };
  // rep atípica en un borde de la serie (tomar la barra al empezar, soltarla y bajar los brazos al terminar):
  // llega tras una pausa larga y su recorrido no se parece al de las demás reps
  function edgeStats(R, i) {
    const L = R.length; if (L < 5) return null;
    const mids = R.slice(1, L - 1), ivs = []; for (let j = 1; j < L - 1; j++) ivs.push(R[j].t - R[j - 1].t);
    const mi = median(ivs.slice(1)) || median(ivs); if (!mi) return null;
    const gap = i === 0 ? (R[1].t - R[0].t) / mi : (R[L - 1].t - R[L - 2].t) / mi;
    let n = 0, out = 0, over = 0, small = 0;
    for (const k in R[i].ext) {
      const xs = mids.filter(function (r) { return r.ext[k]; }).map(function (r) { return r.ext[k]; }); if (xs.length < 3) continue;
      const lo = median(xs.map(function (x) { return x[0]; })), hi = median(xs.map(function (x) { return x[1]; })), amp = median(xs.map(function (x) { return x[1] - x[0]; }));
      if (!(amp > 0)) continue;
      const e = R[i].ext[k], ov = Math.max(lo - e[0], e[1] - hi, 0) / amp, sm = (e[1] - e[0]) / amp;
      n++; over += ov; small += sm; if (ov > EDGE.over || sm < EDGE.small) out++;
    }
    return n ? { gap: gap, frac: out / n, over: over / n, small: small / n } : { gap: gap, frac: 0, over: 0, small: 1 };
  }
  const EDGE = { over: 0.25, small: 0.55, gap: 1.6, gapAlone: 2.6, frac: 0.5 };
  RepCounter.prototype.edgeDrop = function () {
    if (!this.multi || !this.bank) return { first: false, last: false };
    const R = this.bank.reps, f = edgeStats(R, 0), l = edgeStats(R, R.length - 1);
    const bad = function (x) { return !!x && (x.gap > EDGE.gapAlone || (x.gap > EDGE.gap && x.frac >= EDGE.frac)); };
    return { first: bad(f), last: bad(l), f: f, l: l };
  };
  RepCounter.prototype.finalize = function () {
    // devuelve cuántas reps descartó (0, 1 o 2)
    const rc = this.multi ? this.recount() : null;
    if (rc) {
      // segunda pasada: reemplaza el conteo en vivo (suma las reps de series anteriores en la misma activación)
      const live = this.reps, fin = (this.bankBase || 0) + rc.count; this.recountInfo = rc;
      this.reps = fin; this.droppedFirst = rc.first > 0; this.droppedLast = rc.last > 0;
      this.setStats = tempoStats(this.repTimes);
      return live - fin;
    }
    const e = this.edgeDrop(); let d = 0;
    if (e.first && this.reps > 0) { this.reps--; d++; this.droppedFirst = true; }
    if (e.last && this.reps > 0) { this.reps--; d++; if (this.rhythm.times.length) { this.rhythm.times.pop(); this.rhythm.mids.pop(); } if (this.romLog) this.romLog.pop(); this.droppedLast = true; }
    if (!e.last && this.rhythm.trailingExtra()) { this.reps--; d++; this.rhythm.times.pop(); this.rhythm.mids.pop(); if (this.romLog) this.romLog.pop(); this.droppedLast = true; }
    return d;
  };
  RepCounter.prototype.finalizeOld = function () { if (this.rhythm.trailingExtra()) { this.reps--; this.rhythm.times.pop(); this.rhythm.mids.pop(); if (this.romLog) this.romLog.pop(); return true; } return false; };
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
    if (this.multi) {
      const lt = this.bank.leaderTracker(), bk = this.bank; let nAll = 0, nSig = 0;
      for (const k in bk.c) { nAll++; const c = bk.c[k]; if ((c.coverage || 0) >= 0.7 && c.amp >= c.minAmp) nSig++; }
      return { state: this.state, by: this.armedBy, dist: this.dist, tol: this.tol, motion: this.motion, value: lt ? lt.ema : null, range: lt ? lt.range : null, minRange: lt ? lt.minRange : null, template: !!this.template, signal: bk.leader, nSig: nSig, nAll: nAll };
    }
    let b = null; for (const k in this.sides) { const s = this.sides[k]; if (s.ema != null && (!b || s.range > b.range)) b = s; }
    return { state: this.state, by: this.armedBy, dist: this.dist, tol: this.tol, motion: this.motion, value: b ? b.ema : null, range: b ? b.range : null, minRange: this.minRange, template: !!this.template };
  };
  RepCounter.prototype.count = function () { return this.reps; };
  RepCounter.prototype.lastRepT = function () { return this.lastRep; };
  RepCounter.prototype.firstMoveT = function () {
    if (this.multi) return this.bank.firstMoveT();
    let t = null; for (const k in this.sides) { const s = this.sides[k]; if (s.firstMoveT != null && (t == null || s.firstMoveT < t)) t = s.firstMoveT; } return t;
  };
  RepCounter.prototype.typicalRange = function () { return this.maxRange || null; };
  RepCounter.prototype.progress = function () {
    if (this.multi) { const tr = this.bank.leaderTracker(); return tr && tr.norm != null ? (tr.startHigh ? 1 - tr.norm : tr.norm) : null; }
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
  SensorCounter.prototype.finalize = function () { return RepCounter.prototype.finalizeOld.call(this) ? 1 : 0; };
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
  const WD_KEY = ['D', 'L', 'M', 'X', 'J', 'V', 'S'], KEY_ORDER = 'LMXJVSD';
  function dayKeyOf(date) { const k = WD_KEY[date.getDay()]; return DAYS.some(function (d) { return d.key === k; }) ? k : null; }
  // ---------- planes por persona ----------
  // plan = { name, days: [{ key, name, session, items: [ejercicio completo] }] }
  const DEFAULT_PLAN = { name: 'Plan casa de Sebastián (5 días)', template: 'sebastian', days: DAYS.map(function (d) {
    return { key: d.key, name: d.name, session: d.session, items: PLAN.filter(function (e) { return e.day === d.key; }).map(function (e) { return Object.assign({}, e); }) };
  }) };
  function setPlan(plan) {
    plan = plan || DEFAULT_PLAN;
    const days = plan.days.slice().sort(function (a, b) { return KEY_ORDER.indexOf(a.key) - KEY_ORDER.indexOf(b.key); });
    DAYS.length = 0; PLAN.length = 0;
    days.forEach(function (d) {
      DAYS.push({ key: d.key, name: d.name, session: d.session || '' });
      d.items.forEach(function (it) {
        const o = Object.assign({}, it); o.day = d.key;
        const r = String(o.repsText || '8–12').split('–').map(Number); o.repMin = r[0]; o.repMax = r[1] || r[0];
        PLAN.push(o);
      });
    });
  }

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
    if (!w) {
      // sin peso anotado no se puede progresar la carga: se guía por reps
      const tot = last.sets.reduce(function (a, b) { return a + b.reps; }, 0), top = last.sets.length && last.sets.every(function (x) { return x.reps >= ex.repMax; });
      return { action: 'noweight', weight: null, text: top ? 'Sube el peso' : 'Anota el peso',
        detail: top ? 'Llegaste a ' + ex.repMax + ' reps en todas las series: usa un poco más de peso y anótalo para seguir tu progreso.' : 'La última vez no anotaste el peso (' + tot + ' reps en total). Anótalo para que pueda decirte cuándo subir.' };
    }
    const sets = last.sets.filter(function (s) { return s.weight === w; });
    const allTop = sets.length >= planned && sets.every(function (s) { return s.reps >= ex.repMax; });
    const rirOf = function (s) { return s.rir != null ? s.rir : s.rirEst != null ? s.rirEst : null; };
    const rirOk = sets.every(function (s) { const r = rirOf(s); return r == null || r >= 1 || ex.rir.charAt(0) === '0'; });
    // reps dentro del rango pero con mucha reserva (no se enlentecieron): también toca subir
    const easy = sets.length >= planned && sets.every(function (s) { return s.reps >= ex.repMin + Math.floor((ex.repMax - ex.repMin) / 2) && rirOf(s) != null && rirOf(s) >= 3; });
    if (easy && !sets.every(function (s) { return s.reps >= ex.repMax; })) {
      const nw = roundTo(w + ex.inc, ex.inc < 1.25 ? 0.5 : 1.25);
      return { action: 'up', weight: nw, text: 'Sube a ' + fmtKg(nw), detail: 'Con ' + fmtKg(w) + ' las reps no se enlentecieron: te quedaban 3 o más en reserva.' };
    }
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
  function e1rm(w, r) { return w && r ? w * (1 + Math.min(r, 15) / 30) : null; }   // Epley, aproximado
  // series por músculo en una semana: músculo principal cuenta 1, secundario 0,5
  function muscleSets(logs, week) {
    const o = {};
    logs.filter(function (l) { return l.week === week; }).forEach(function (l) {
      const ex = PLAN.find(function (e) { return e.id === l.exId; }); if (!ex) return;
      o[ex.muscle] = (o[ex.muscle] || 0) + 1; if (ex.muscle2) o[ex.muscle2] = (o[ex.muscle2] || 0) + 0.5;
    });
    return o;
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

  const api = { PLAN: PLAN, DAYS: DAYS, DEFAULT_PLAN: DEFAULT_PLAN, setPlan: setPlan, angle: angle, metricValues: metricValues, SideTracker: SideTracker, RepCounter: RepCounter,
    mondayOf: mondayOf, ymd: ymd, parseYmd: parseYmd, weekNumber: weekNumber, cycleWeek: cycleWeek, isDeload: isDeload,
    dayKeyOf: dayKeyOf, plannedSets: plannedSets, recommend: recommend, sessionsFor: sessionsFor, fmtKg: fmtKg,
    jointsFor: jointsFor, detectionQuality: detectionQuality, classifyPosture: classifyPosture, clipToFrame: clipToFrame, posture3DFeatures: posture3DFeatures, classifyPosture3D: classifyPosture3D, upVector: upVector, metricValues3D: metricValues3D, romFeatures: romFeatures, postureVector: postureVector, classifyWithProfile: classifyWithProfile, romCheck3D: romCheck3D, ROM3D: ROM3D, postureCompatible: postureCompatible, POSTURE_NAME: POSTURE_NAME, POSTURE_SAY: POSTURE_SAY, EXPECTED: EXPECTED, torsoDirection: torsoDirection, PostureTracker: PostureTracker, JOINT_HELP: JOINT_HELP, features: features, GATES: GATES, poseVector: poseVector, poseDistance: poseDistance, blendPose: blendPose,
    SensorCounter: SensorCounter, Rhythm: Rhythm, EDGE: EDGE, sanePosture: sanePosture, e1rm: e1rm, muscleSets: muscleSets, tempoStats: tempoStats, offlineCycles: offlineCycles, SignalBank: SignalBank, signalCandidates: signalCandidates, romCheck: romCheck, PLACEMENT: PLACEMENT, PATTERN_PLACE: PATTERN_PLACE, bumpDetector: bumpDetector };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RepCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
