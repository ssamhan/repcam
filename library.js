/* RepCam: biblioteca de ejercicios, equipo y plantillas de planes. Sin DOM. */
(function (root) {
  'use strict';

  // Equipo disponible (lo marca cada persona en su perfil). "corporal" siempre está.
  const EQUIP = {
    barra: 'Barra libre / EZ', rack: 'Rack', banco: 'Banco', mancuernas: 'Mancuernas', polea: 'Polea',
    smith: 'Smith', maquina: 'Máquinas de gimnasio', banda: 'Elásticos', kettlebell: 'Kettlebell',
    landmine: 'Landmine', barra_dominadas: 'Barra de dominadas', paralelas: 'Paralelas para fondos', corporal: 'Peso corporal (suelo)',
  };
  const CAT_NAME = { barra: 'Barra', mancuernas: 'Mancuernas', polea: 'Polea', maquina: 'Máquina', smith: 'Smith', banda: 'Elástico', corporal: 'Peso corporal', kettlebell: 'Kettlebell', landmine: 'Landmine' };

  // [id, nombre, categoría, requiere, equipo (texto), patrón, métrica, empieza alto, incremento kg, músculo, músculo 2, posturas, dibujo, reps, descanso s, nota, opciones]
  // patrón y métrica definen cómo cuenta la cámara; "posturas" son las válidas para empezar.
  const L = [
    // --- Pecho
    ['bench_bb', 'Press banca con barra', 'barra', ['banco', 'rack'], 'Rack + banco plano', 'press_h', 'elbow', true, 2.5, 'Pecho', 'Tríceps', ['lying'], null, '6–10', 150, 'Escápulas juntas, barra al pecho medio. Usa los topes de seguridad.'],
    ['incline_bb', 'Press inclinado con barra', 'barra', ['banco', 'rack'], 'Rack + banco a 30°', 'press_h', 'elbow', true, 2.5, 'Pecho', 'Hombros', ['lying', 'seated', 'bent'], null, '6–10', 150, 'Banco a 30°, barra a la parte alta del pecho.', { rom3d: false }],
    ['bench_db', 'Press banca con mancuernas', 'mancuernas', ['banco'], 'Mancuernas + banco plano', 'press_h', 'elbow', true, 2, 'Pecho', 'Tríceps', ['lying'], null, '8–12', 120, 'Baja hasta sentir el estiramiento del pecho.'],
    ['incline_db', 'Press inclinado con mancuernas', 'mancuernas', ['banco'], 'Mancuernas + banco a 30°', 'press_h', 'elbow', true, 2, 'Pecho', 'Tríceps', ['lying', 'seated', 'bent'], null, '8–12', 120, 'Baja hasta sentir el estiramiento del pecho.', { rom3d: false }],
    ['bench_smith', 'Press banca en Smith', 'smith', ['banco'], 'Smith + banco plano', 'press_h', 'elbow', true, 2.5, 'Pecho', 'Tríceps', ['lying'], null, '6–10', 150, 'Barra al pecho medio.'],
    ['incline_smith', 'Press inclinado en Smith', 'smith', ['banco'], 'Smith + banco a 30°', 'press_h', 'elbow', true, 2.5, 'Pecho', 'Hombros', ['lying', 'seated', 'bent'], null, '8–12', 120, '', { rom3d: false }],
    ['chest_machine', 'Press de pecho en máquina', 'maquina', [], 'Máquina de press de pecho', 'press_h', 'elbow', false, 2.5, 'Pecho', 'Tríceps', ['seated'], 'press_seat', '8–12', 120, 'Manillas a la altura del pecho medio.', { rom3d: false, start: 'sentado, manos junto al pecho' }],
    ['pushup', 'Flexiones de brazos', 'corporal', [], 'Suelo', 'press_h', 'elbow', true, 0, 'Pecho', 'Tríceps', ['lying', 'bent'], 'pushup', '8–20', 90, 'Cuerpo recto de talones a cabeza. Si son fáciles, pies en un banco o elástico en la espalda.', { rom3d: false, start: 'brazos estirados, cuerpo recto' }],
    ['pushup_band', 'Flexiones con elástico', 'banda', [], 'Elástico por la espalda', 'press_h', 'elbow', true, 0, 'Pecho', 'Tríceps', ['lying', 'bent'], 'pushup', '8–15', 90, 'Pasa el elástico por la espalda y sujétalo bajo las manos.', { rom3d: false, start: 'brazos estirados, cuerpo recto' }],
    ['dips', 'Fondos en paralelas', 'corporal', ['paralelas'], 'Paralelas', 'pushdown', 'elbow', true, 2.5, 'Pecho', 'Tríceps', ['standing', 'kneeling'], 'dip', '6–12', 120, 'Inclínate un poco adelante para cargar el pecho.', { rom3d: false, start: 'arriba, brazos estirados' }],
    ['fly_cable', 'Cruce de poleas (bajo a alto)', 'polea', [], 'Doble polea + manijas D', 'fly', 'wristDist', true, 1.25, 'Pecho', '', ['standing'], null, '12–15', 75, 'Ponte de frente a la cámara.'],
    ['fly_db', 'Aperturas con mancuernas', 'mancuernas', ['banco'], 'Mancuernas + banco', 'fly', 'wristDist', true, 1, 'Pecho', '', ['lying'], null, '10–15', 75, 'Codos levemente flexionados durante todo el recorrido.', { rom3d: false }],
    ['pec_deck', 'Aperturas en máquina (pec deck)', 'maquina', [], 'Máquina pec deck', 'fly', 'wristDist', true, 2.5, 'Pecho', '', ['seated'], null, '10–15', 75, 'Ponte de frente a la cámara.', { rom3d: false }],
    ['fly_band', 'Aperturas con elástico', 'banda', [], 'Elástico anclado atrás', 'fly', 'wristDist', true, 0, 'Pecho', '', ['standing'], null, '12–20', 60, 'Ponte de frente a la cámara.', { rom3d: false }],
    // --- Espalda
    ['pullup', 'Dominadas', 'corporal', ['barra_dominadas'], 'Barra de dominadas', 'pull', 'elbow', true, 2.5, 'Espalda', 'Bíceps', ['standing', 'kneeling'], null, '6–10', 120, 'Pecho hacia la barra, baja completo.'],
    ['chinup', 'Dominadas supinas', 'corporal', ['barra_dominadas'], 'Barra de dominadas', 'pull', 'elbow', true, 2.5, 'Espalda', 'Bíceps', ['standing', 'kneeling'], null, '6–10', 120, 'Palmas hacia ti.'],
    ['pullup_band', 'Dominadas asistidas con elástico', 'banda', ['barra_dominadas'], 'Barra + elástico', 'pull', 'elbow', true, 0, 'Espalda', 'Bíceps', ['standing', 'kneeling'], null, '6–12', 120, 'Usa un elástico más delgado a medida que progresas.'],
    ['latpull', 'Jalón en polea alta', 'polea', [], 'Polea alta + barra o manijas', 'pull', 'elbow', true, 2.5, 'Espalda', 'Bíceps', ['kneeling', 'seated', 'standing'], null, '10–12', 90, 'Codos hacia los bolsillos, pecho arriba.'],
    ['latpull_machine', 'Jalón en máquina', 'maquina', [], 'Máquina de jalón', 'pull', 'elbow', true, 2.5, 'Espalda', 'Bíceps', ['seated'], null, '10–12', 90, 'Codos hacia los bolsillos, pecho arriba.'],
    ['row_bb', 'Remo con barra', 'barra', [], 'Barra libre', 'row', 'elbow', true, 2.5, 'Espalda', 'Bíceps', ['bent'], null, '8–10', 120, 'Torso a ~45°, tira hacia el ombligo.'],
    ['row_db', 'Remo con mancuerna a una mano', 'mancuernas', ['banco'], 'Mancuerna + banco', 'row', 'elbow', true, 2, 'Espalda', 'Bíceps', ['bent', 'kneeling'], null, '8–12', 90, 'Rodilla y mano en el banco. De lado a la cámara.'],
    ['row_cable', 'Remo sentado en polea', 'polea', [], 'Polea baja + manija V', 'row', 'elbow', true, 2.5, 'Espalda', 'Bíceps', ['seated'], null, '10–12', 90, 'Pecho arriba, lleva los codos atrás.'],
    ['row_machine', 'Remo en máquina', 'maquina', [], 'Máquina de remo', 'row', 'elbow', true, 2.5, 'Espalda', 'Bíceps', ['seated'], null, '10–12', 90, ''],
    ['row_landmine', 'Remo en landmine con agarre en V', 'landmine', [], 'Landmine + manija en V', 'row', 'elbow', true, 2.5, 'Espalda', 'Bíceps', ['bent'], null, '8–12', 120, ''],
    ['row_band', 'Remo con elástico', 'banda', [], 'Elástico anclado al frente', 'row', 'elbow', true, 0, 'Espalda', 'Bíceps', ['seated', 'standing'], null, '12–20', 60, 'Sentado en el suelo con el elástico en los pies, o de pie anclado a una puerta.', { rom3d: false }],
    ['inverted_row', 'Remo invertido', 'corporal', ['rack'], 'Barra del rack a la altura de la cadera (o TRX)', 'row', 'elbow', true, 0, 'Espalda', 'Bíceps', ['lying', 'bent'], 'invrow', '8–15', 90, 'Cuerpo recto, pecho a la barra.', { rom3d: false, start: 'colgado, brazos estirados' }],
    ['facepull', 'Face pull en polea', 'polea', [], 'Polea alta + cuerda', 'facepull', 'elbow', true, 1.25, 'Hombros', 'Espalda', ['standing'], null, '12–20', 60, 'Deltoide posterior.'],
    ['facepull_band', 'Face pull con elástico', 'banda', [], 'Elástico anclado alto', 'facepull', 'elbow', true, 0, 'Hombros', 'Espalda', ['standing'], null, '15–25', 60, '', { rom3d: false }],
    ['pullapart_band', 'Separación de elástico (pull-apart)', 'banda', [], 'Elástico', 'fly', 'wristDist', false, 0, 'Hombros', 'Espalda', ['standing'], 'pullapart', '15–25', 60, 'Brazos estirados a la altura del pecho. De frente a la cámara.', { rom3d: false, start: 'manos juntas al frente' }],
    ['rear_fly_db', 'Pájaros con mancuernas', 'mancuernas', [], 'Mancuernas', 'raise', 'shoulderAbd', false, 1, 'Hombros', 'Espalda', ['bent', 'seated'], null, '12–20', 60, 'Inclinado adelante, abre los brazos hacia los lados.', { rom3d: false }],
    ['deadlift', 'Peso muerto con barra', 'barra', [], 'Barra libre + discos', 'hinge', 'hip', true, 5, 'Glúteo', 'Espalda', ['standing'], null, '5–8', 180, 'Barra pegada a las piernas, espalda neutra.'],
    ['rdl_bb', 'Peso muerto rumano con barra', 'barra', [], 'Barra libre', 'hinge', 'hip', true, 5, 'Femoral', 'Glúteo', ['standing'], null, '8–10', 120, 'Cadera atrás, barra pegada a las piernas.'],
    ['rdl_db', 'Peso muerto rumano con mancuernas', 'mancuernas', [], 'Mancuernas', 'hinge', 'hip', true, 2, 'Femoral', 'Glúteo', ['standing'], null, '8–12', 120, 'Cadera atrás, mancuernas pegadas a las piernas.'],
    ['rdl_band', 'Peso muerto rumano con elástico', 'banda', [], 'Elástico bajo los pies', 'hinge', 'hip', true, 0, 'Femoral', 'Glúteo', ['standing'], null, '12–20', 75, '', { rom3d: false }],
    ['kb_swing', 'Swing con kettlebell', 'kettlebell', [], 'Kettlebell', 'hinge', 'hip', true, 4, 'Glúteo', 'Femoral', ['standing'], null, '12–20', 90, 'La fuerza sale de la cadera, no de los brazos.', { rom3d: false }],
    ['good_morning', 'Buenos días con barra', 'barra', ['rack'], 'Rack + barra', 'hinge', 'hip', true, 2.5, 'Femoral', 'Espalda', ['standing'], null, '8–12', 120, '', { rom3d: false }],
    ['hyperext', 'Hiperextensiones', 'maquina', [], 'Banco romano', 'hinge', 'hip', true, 2.5, 'Glúteo', 'Espalda', ['bent', 'lying'], null, '10–15', 75, '', { rom3d: false }],
    // --- Hombros
    ['ohp_bb', 'Press militar de pie con barra', 'barra', ['rack'], 'Rack + barra', 'press_v', 'elbow', false, 2.5, 'Hombros', 'Tríceps', ['standing'], null, '6–10', 150, 'Glúteos apretados, barra en línea con la cara.'],
    ['ohp_smith', 'Press militar sentado en Smith', 'smith', ['banco'], 'Smith + banco a 90°', 'press_v', 'elbow', false, 2.5, 'Hombros', 'Tríceps', ['seated'], null, '8–10', 120, 'Baja la barra hasta la barbilla.'],
    ['ohp_db', 'Press de hombro con mancuernas sentado', 'mancuernas', ['banco'], 'Mancuernas + banco a 90°', 'press_v', 'elbow', false, 2, 'Hombros', 'Tríceps', ['seated'], null, '8–12', 90, ''],
    ['ohp_db_stand', 'Press de hombro con mancuernas de pie', 'mancuernas', [], 'Mancuernas', 'press_v', 'elbow', false, 2, 'Hombros', 'Tríceps', ['standing'], null, '8–12', 90, ''],
    ['ohp_machine', 'Press de hombro en máquina', 'maquina', [], 'Máquina de press de hombro', 'press_v', 'elbow', false, 2.5, 'Hombros', 'Tríceps', ['seated'], null, '8–12', 90, ''],
    ['ohp_band', 'Press de hombro con elástico', 'banda', [], 'Elástico bajo los pies', 'press_v', 'elbow', false, 0, 'Hombros', 'Tríceps', ['standing'], null, '10–20', 75, '', { rom3d: false }],
    ['ohp_landmine', 'Press en landmine', 'landmine', [], 'Landmine', 'press_v', 'elbow', false, 2.5, 'Hombros', 'Pecho', ['standing', 'kneeling'], null, '8–12', 90, 'Un brazo a la vez o ambas manos.', { rom3d: false }],
    ['lat_raise_db', 'Elevación lateral con mancuernas', 'mancuernas', [], 'Mancuernas', 'raise', 'shoulderAbd', false, 1, 'Hombros', '', ['standing'], null, '12–20', 60, 'Ponte de frente a la cámara.'],
    ['lat_raise_cable', 'Elevación lateral en polea', 'polea', [], 'Polea baja + manija D', 'raise', 'shoulderAbd', false, 1.25, 'Hombros', '', ['standing'], null, '12–20', 60, 'Un brazo a la vez, cable por detrás del cuerpo.'],
    ['lat_raise_band', 'Elevación lateral con elástico', 'banda', [], 'Elástico bajo los pies', 'raise', 'shoulderAbd', false, 0, 'Hombros', '', ['standing'], null, '15–25', 60, 'Ponte de frente a la cámara.'],
    ['lat_raise_machine', 'Elevación lateral en máquina', 'maquina', [], 'Máquina de elevaciones', 'raise', 'shoulderAbd', false, 2.5, 'Hombros', '', ['seated'], null, '12–20', 60, ''],
    ['front_raise_db', 'Elevación frontal con mancuerna', 'mancuernas', [], 'Mancuerna o disco', 'raise', 'shoulderAbd', false, 1, 'Hombros', '', ['standing'], null, '12–15', 60, 'De lado a la cámara.', { rom3d: false }],
    // --- Bíceps
    ['curl_bb', 'Curl con barra', 'barra', [], 'Barra recta', 'curl', 'elbow', true, 2.5, 'Bíceps', '', ['standing'], null, '8–12', 75, 'Codos quietos a los costados.'],
    ['curl_ez', 'Curl con barra EZ', 'barra', [], 'Barra EZ', 'curl', 'elbow', true, 2.5, 'Bíceps', '', ['standing'], null, '10–12', 60, 'Codos quietos a los costados.'],
    ['curl_db', 'Curl con mancuernas', 'mancuernas', [], 'Mancuernas', 'curl', 'elbow', true, 1, 'Bíceps', '', ['standing', 'seated'], null, '10–12', 60, 'Ambos brazos a la vez para que el conteo sea exacto.'],
    ['curl_hammer', 'Curl martillo', 'mancuernas', [], 'Mancuernas', 'curl', 'elbow', true, 1, 'Bíceps', '', ['standing', 'seated'], null, '10–12', 60, 'Ambos brazos a la vez para que el conteo sea exacto.'],
    ['curl_incline', 'Curl inclinado con mancuernas', 'mancuernas', ['banco'], 'Mancuernas + banco a 45°', 'curl', 'elbow', true, 1, 'Bíceps', '', ['seated', 'bent', 'lying'], null, '10–12', 75, ''],
    ['curl_cable', 'Curl en polea', 'polea', [], 'Polea baja + barra', 'curl', 'elbow', true, 1.25, 'Bíceps', '', ['standing'], null, '10–15', 60, ''],
    ['curl_band', 'Curl con elástico', 'banda', [], 'Elástico bajo los pies', 'curl', 'elbow', true, 0, 'Bíceps', '', ['standing'], null, '12–20', 60, ''],
    ['curl_machine', 'Curl en máquina (predicador)', 'maquina', [], 'Máquina de curl', 'curl', 'elbow', true, 2.5, 'Bíceps', '', ['seated'], null, '10–12', 60, '', { rom3d: false }],
    // --- Tríceps
    ['pushdown', 'Extensión de tríceps en polea', 'polea', [], 'Polea alta + cuerda', 'pushdown', 'elbow', false, 1.25, 'Tríceps', '', ['standing'], null, '10–15', 60, 'Abre la cuerda al final.'],
    ['pushdown_band', 'Extensión de tríceps con elástico', 'banda', [], 'Elástico anclado alto', 'pushdown', 'elbow', false, 0, 'Tríceps', '', ['standing'], null, '15–25', 60, ''],
    ['overhead_cable', 'Extensión de tríceps sobre la cabeza en polea', 'polea', [], 'Polea + cuerda', 'overhead', 'elbow', false, 1.25, 'Tríceps', '', ['standing'], null, '10–15', 75, 'De espaldas a la polea.'],
    ['overhead_db', 'Extensión de tríceps sobre la cabeza con mancuerna', 'mancuernas', [], 'Mancuerna', 'overhead', 'elbow', false, 1, 'Tríceps', '', ['standing', 'seated'], null, '10–15', 75, 'Codos apuntando al techo.'],
    ['skull_ez', 'Press francés con barra EZ', 'barra', ['banco'], 'Barra EZ + banco', 'press_h', 'elbow', true, 2.5, 'Tríceps', '', ['lying'], null, '8–12', 75, 'Baja la barra hacia la frente, codos quietos.', { rom3d: false }],
    ['close_bench', 'Press banca agarre cerrado', 'barra', ['banco', 'rack'], 'Rack + banco', 'press_h', 'elbow', true, 2.5, 'Tríceps', 'Pecho', ['lying'], null, '6–10', 120, 'Manos al ancho de los hombros.'],
    ['bench_dips', 'Fondos en banco', 'corporal', ['banco'], 'Banco', 'pushdown', 'elbow', true, 0, 'Tríceps', 'Pecho', ['seated', 'standing'], 'dip', '10–20', 75, 'Pies en el suelo; súbelos a otro banco para más dificultad.', { rom3d: false, start: 'arriba, brazos estirados' }],
    // --- Piernas
    ['squat_bb', 'Sentadilla con barra', 'barra', ['rack'], 'Rack', 'squat', 'kneeMin', true, 5, 'Cuádriceps', 'Glúteo', ['standing'], null, '6–10', 150, 'Topes de seguridad a la altura del fondo.'],
    ['front_squat', 'Sentadilla frontal', 'barra', ['rack'], 'Rack', 'squat', 'kneeMin', true, 2.5, 'Cuádriceps', 'Glúteo', ['standing'], null, '6–10', 150, 'Codos altos, torso erguido.'],
    ['squat_smith', 'Sentadilla en Smith', 'smith', [], 'Smith', 'squat', 'kneeMin', true, 5, 'Cuádriceps', 'Glúteo', ['standing'], null, '8–12', 120, 'Pies un poco adelantados.'],
    ['goblet', 'Sentadilla goblet', 'mancuernas', [], 'Mancuerna o kettlebell', 'squat', 'kneeMin', true, 2, 'Cuádriceps', 'Glúteo', ['standing'], null, '10–15', 90, 'Mancuerna pegada al pecho.'],
    ['squat_bw', 'Sentadilla con peso corporal', 'corporal', [], 'Sin equipo', 'squat', 'kneeMin', true, 0, 'Cuádriceps', 'Glúteo', ['standing'], null, '15–30', 60, 'Baja lento (3 s) para hacerla más difícil.'],
    ['squat_band', 'Sentadilla con elástico', 'banda', [], 'Elástico bajo los pies', 'squat', 'kneeMin', true, 0, 'Cuádriceps', 'Glúteo', ['standing'], null, '12–20', 75, ''],
    ['legpress', 'Prensa de piernas', 'maquina', [], 'Máquina de prensa', 'squat', 'kneeMin', true, 10, 'Cuádriceps', 'Glúteo', ['seated', 'lying'], 'legpress', '10–15', 120, 'Baja hasta 90° de rodilla sin despegar la zona lumbar.', { rom3d: false, start: 'piernas estiradas (sin bloquear)' }],
    ['hack_squat', 'Sentadilla hack en máquina', 'maquina', [], 'Máquina hack', 'squat', 'kneeMin', true, 10, 'Cuádriceps', 'Glúteo', ['standing', 'bent'], null, '8–12', 120, '', { rom3d: false }],
    ['bulgarian', 'Sentadilla búlgara con mancuernas', 'mancuernas', ['banco'], 'Mancuernas + banco', 'lunge', 'kneeMin', true, 2, 'Cuádriceps', 'Glúteo', ['standing'], null, '8–12', 90, 'Series por pierna: registra cada pierna como una serie o suma ambas.'],
    ['bulgarian_bw', 'Sentadilla búlgara sin peso', 'corporal', ['banco'], 'Banco o silla', 'lunge', 'kneeMin', true, 0, 'Cuádriceps', 'Glúteo', ['standing'], null, '10–15', 75, 'Series por pierna.'],
    ['lunge_db', 'Zancadas con mancuernas', 'mancuernas', [], 'Mancuernas', 'lunge', 'kneeMin', true, 2, 'Cuádriceps', 'Glúteo', ['standing'], null, '8–12', 90, 'Paso largo, rodilla de atrás casi al suelo.'],
    ['lunge_bw', 'Zancadas sin peso', 'corporal', [], 'Sin equipo', 'lunge', 'kneeMin', true, 0, 'Cuádriceps', 'Glúteo', ['standing'], null, '12–20', 60, ''],
    ['stepup_db', 'Subida al banco con mancuernas', 'mancuernas', ['banco'], 'Mancuernas + banco', 'lunge', 'kneeMin', true, 2, 'Cuádriceps', 'Glúteo', ['standing'], null, '8–12', 90, 'Empuja con la pierna de arriba.', { rom3d: false }],
    ['legext_machine', 'Extensión de cuádriceps en máquina', 'maquina', [], 'Máquina de extensiones', 'legext', 'knee', false, 2.5, 'Cuádriceps', '', ['seated'], null, '12–15', 60, ''],
    ['legext_cable', 'Extensión de cuádriceps en polea', 'polea', ['banco'], 'Polea baja + tobillera', 'legext', 'knee', false, 1.25, 'Cuádriceps', '', ['seated'], null, '12–15', 60, 'Sentado en el banco, un pie a la vez.'],
    ['legext_band', 'Extensión de cuádriceps con elástico', 'banda', [], 'Elástico al tobillo', 'legext', 'knee', false, 0, 'Cuádriceps', '', ['seated'], null, '15–25', 60, ''],
    ['legcurl_lying', 'Curl femoral acostado en máquina', 'maquina', [], 'Máquina de curl femoral', 'legcurl', 'knee', true, 2.5, 'Femoral', '', ['lying'], null, '10–12', 75, ''],
    ['legcurl_seated', 'Curl femoral sentado en máquina', 'maquina', [], 'Máquina de curl femoral sentado', 'legcurl', 'knee', true, 2.5, 'Femoral', '', ['seated'], null, '10–12', 75, '', { rom3d: false }],
    ['legcurl_cable', 'Curl femoral en polea baja', 'polea', ['banco'], 'Polea baja + tobillera', 'legcurl', 'knee', true, 1.25, 'Femoral', '', ['lying', 'bent', 'seated'], null, '10–12', 75, 'Boca abajo en el banco.'],
    ['legcurl_band', 'Curl femoral con elástico', 'banda', [], 'Elástico al tobillo', 'legcurl', 'knee', true, 0, 'Femoral', '', ['lying'], null, '12–20', 60, 'Boca abajo, elástico anclado bajo.'],
    ['nordic', 'Curl nórdico', 'corporal', [], 'Pies sujetos (sofá, barra baja)', 'legcurl', 'knee', false, 0, 'Femoral', '', ['kneeling'], null, '4–8', 120, 'Baja lo más lento que puedas; ayúdate con las manos al subir.', { rom3d: false, start: 'arrodillado, tronco erguido' }],
    ['hipthrust_bb', 'Hip thrust con barra', 'barra', ['banco'], 'Barra + banco + colchoneta', 'hipthrust', 'hip', false, 5, 'Glúteo', 'Femoral', ['lying', 'bent', 'seated'], null, '8–12', 120, 'Mentón al pecho, pausa arriba.'],
    ['hipthrust_smith', 'Hip thrust en Smith', 'smith', ['banco'], 'Smith + banco', 'hipthrust', 'hip', false, 5, 'Glúteo', 'Femoral', ['lying', 'bent', 'seated'], null, '8–12', 120, ''],
    ['hipthrust_db', 'Hip thrust con mancuerna', 'mancuernas', ['banco'], 'Mancuerna + banco', 'hipthrust', 'hip', false, 2, 'Glúteo', 'Femoral', ['lying', 'bent', 'seated'], null, '10–15', 90, ''],
    ['bridge', 'Puente de glúteo', 'corporal', [], 'Suelo', 'hipthrust', 'hip', false, 0, 'Glúteo', 'Femoral', ['lying'], 'bridge', '15–25', 60, 'Una pierna para más dificultad.', { rom3d: false }],
    ['bridge_band', 'Puente de glúteo con elástico', 'banda', [], 'Elástico sobre la cadera', 'hipthrust', 'hip', false, 0, 'Glúteo', 'Femoral', ['lying'], 'bridge', '15–25', 60, '', { rom3d: false }],
    ['calf_smith', 'Gemelo de pie en Smith', 'smith', [], 'Smith + disco bajo la punta', 'calf', 'heel', false, 5, 'Gemelo', '', ['standing'], null, '10–15', 60, 'Pausa 1 s abajo, estiramiento completo.'],
    ['calf_db', 'Gemelo de pie con mancuerna', 'mancuernas', [], 'Mancuerna + escalón', 'calf', 'heel', false, 2, 'Gemelo', '', ['standing'], null, '12–20', 60, 'Una pierna a la vez en un escalón.'],
    ['calf_machine', 'Gemelo en máquina', 'maquina', [], 'Máquina de gemelos', 'calf', 'heel', false, 5, 'Gemelo', '', ['standing', 'seated'], null, '10–15', 60, ''],
    ['calf_seated', 'Gemelo sentado', 'barra', ['banco'], 'Banco + barra o mancuerna sobre rodillas', 'calf', 'heel', false, 2.5, 'Gemelo', '', ['seated'], null, '12–20', 60, ''],
    ['calf_bw', 'Gemelo a una pierna sin peso', 'corporal', [], 'Escalón', 'calf', 'heel', false, 0, 'Gemelo', '', ['standing'], null, '15–25', 45, ''],
    // --- Abdomen
    ['crunch_cable', 'Crunch en polea', 'polea', [], 'Polea alta + cuerda', 'crunch', 'hip', true, 2.5, 'Abdomen', '', ['kneeling'], null, '10–15', 60, 'Arrodillado, enrolla la columna.'],
    ['crunch_floor', 'Abdominales en el suelo', 'corporal', [], 'Suelo', 'crunch', 'hip', true, 0, 'Abdomen', '', ['lying', 'seated'], 'situp', '15–25', 45, 'Sube despacio, sin tirar del cuello.', { rom3d: false, start: 'acostado de espaldas' }],
    ['legraise_hang', 'Elevación de piernas colgado', 'corporal', ['barra_dominadas'], 'Barra de dominadas', 'crunch', 'hip', true, 0, 'Abdomen', '', ['standing'], 'legraise', '8–15', 75, 'Sin balanceo; sube la pelvis al final.', { rom3d: false, start: 'colgado, piernas estiradas' }],
    ['crunch_band', 'Crunch con elástico', 'banda', [], 'Elástico anclado alto', 'crunch', 'hip', true, 0, 'Abdomen', '', ['kneeling'], null, '15–25', 45, '', { rom3d: false }],
  ];
  const LIB = {};
  L.forEach(function (r) {
    LIB[r[0]] = { lib: r[0], name: r[1], cat: r[2], needs: r[3], equip: r[4], pattern: r[5], metric: r[6], startHigh: r[7], inc: r[8], muscle: r[9], muscle2: r[10], post: r[11], pose: r[12],
      repsText: r[13], rest: r[14], notes: r[15], rom3d: r[16] && r[16].rom3d === false ? false : undefined, start: r[16] && r[16].start, rir: /^(Pecho|Espalda|Cuádriceps|Femoral|Glúteo)$/.test(r[9]) && r[8] >= 2 ? '1–2' : '0–1' };
  });
  const MUSCLES = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Femoral', 'Glúteo', 'Gemelo', 'Abdomen'];

  function available(ex, equip) {
    const has = function (k) { return k === 'corporal' || equip.indexOf(k) >= 0; };
    return has(ex.cat) && ex.needs.every(has);
  }
  // reemplazo con tu equipo: mismo patrón y músculo; si no, mismo músculo
  function substitute(id, equip) {
    const a = LIB[id]; if (!a || available(a, equip)) return id;
    const all = Object.keys(LIB).map(function (k) { return LIB[k]; }).filter(function (x) { return available(x, equip); });
    const same = all.filter(function (x) { return x.pattern === a.pattern && x.muscle === a.muscle; });
    const mus = all.filter(function (x) { return x.muscle === a.muscle; });
    const pick = same[0] || mus[0];
    return pick ? pick.lib : null;
  }
  // ejercicio del plan: lo de la biblioteca + lo que cambiaste en tu plan
  function item(lib, sets, reps, rest, extra) {
    const o = { lib: lib, sets: sets }; if (reps) o.repsText = reps; if (rest) o.rest = rest; return Object.assign(o, extra || {});
  }
  const D = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado', D: 'Domingo' };
  const TEMPLATES = [
    { id: 'fullbody3', name: 'Cuerpo completo 3 días', level: 'Principiante a intermedio', desc: 'Todo el cuerpo lunes, miércoles y viernes. Lo más eficiente si entrenas 3 veces por semana.', days: [
      { key: 'L', session: 'Cuerpo completo A', items: [item('squat_bb', 3), item('bench_bb', 3), item('row_cable', 3), item('ohp_db', 2), item('legcurl_lying', 2), item('curl_db', 2)] },
      { key: 'X', session: 'Cuerpo completo B', items: [item('rdl_bb', 3), item('incline_db', 3), item('latpull', 3), item('legpress', 2), item('lat_raise_db', 3), item('pushdown', 2)] },
      { key: 'V', session: 'Cuerpo completo C', items: [item('bulgarian', 3), item('ohp_bb', 3), item('pullup', 3), item('hipthrust_bb', 3), item('fly_cable', 2), item('calf_machine', 3)] }] },
    { id: 'upperlower4', name: 'Torso / Pierna 4 días', level: 'Intermedio', desc: 'Cada músculo dos veces por semana con 4 sesiones.', days: [
      { key: 'L', session: 'Torso A', items: [item('bench_bb', 4), item('row_bb', 3), item('ohp_db', 3), item('latpull', 3), item('curl_ez', 2), item('pushdown', 2)] },
      { key: 'M', session: 'Pierna A', items: [item('squat_bb', 4), item('rdl_bb', 3), item('legpress', 3), item('legcurl_lying', 3), item('calf_machine', 4)] },
      { key: 'J', session: 'Torso B', items: [item('incline_db', 3), item('pullup', 3), item('row_cable', 3), item('lat_raise_db', 4), item('fly_cable', 2), item('curl_hammer', 2), item('overhead_cable', 2)] },
      { key: 'V', session: 'Pierna B', items: [item('hipthrust_bb', 4), item('bulgarian', 3), item('legext_machine', 3), item('legcurl_seated', 3), item('crunch_cable', 3)] }] },
    { id: 'ppl3', name: 'Empuje / Tirón / Pierna 3 días', level: 'Intermedio', desc: 'Clásico dividido por movimientos. Repítelo dos veces en la semana si entrenas 6 días.', days: [
      { key: 'L', session: 'Empuje', items: [item('bench_bb', 4), item('ohp_db', 3), item('incline_db', 3), item('lat_raise_db', 4), item('pushdown', 3)] },
      { key: 'X', session: 'Tirón', items: [item('pullup', 3), item('row_bb', 3), item('row_cable', 3), item('facepull', 3), item('curl_ez', 3)] },
      { key: 'V', session: 'Pierna', items: [item('squat_bb', 4), item('rdl_bb', 3), item('legpress', 3), item('legcurl_lying', 3), item('calf_machine', 4), item('crunch_cable', 3)] }] },
    { id: 'home_db', name: 'Casa: mancuernas y banco 3 días', level: 'Principiante a intermedio', desc: 'Solo mancuernas, banco y elásticos.', days: [
      { key: 'L', session: 'Cuerpo completo A', items: [item('goblet', 3), item('bench_db', 3), item('row_db', 3), item('ohp_db', 2), item('rdl_db', 2), item('curl_db', 2)] },
      { key: 'X', session: 'Cuerpo completo B', items: [item('bulgarian', 3), item('incline_db', 3), item('row_band', 3), item('lat_raise_db', 3), item('hipthrust_db', 3), item('overhead_db', 2)] },
      { key: 'V', session: 'Cuerpo completo C', items: [item('rdl_db', 3), item('pushup', 3), item('pullup_band', 3), item('lunge_db', 2), item('rear_fly_db', 3), item('calf_db', 3)] }] },
    { id: 'bodyweight', name: 'Sin equipo: peso corporal y elásticos', level: 'Todos los niveles', desc: 'Para casa o viaje. Progresas con más reps, más lento o con elásticos más duros.', days: [
      { key: 'L', session: 'Cuerpo completo A', items: [item('squat_bw', 3), item('pushup', 3), item('row_band', 3), item('bridge', 3), item('lat_raise_band', 3), item('crunch_floor', 3)] },
      { key: 'X', session: 'Cuerpo completo B', items: [item('lunge_bw', 3), item('pushup_band', 3), item('facepull_band', 3), item('rdl_band', 3), item('curl_band', 2), item('pushdown_band', 2)] },
      { key: 'V', session: 'Cuerpo completo C', items: [item('bulgarian_bw', 3), item('pushup', 3), item('pullapart_band', 3), item('nordic', 3), item('ohp_band', 3), item('calf_bw', 3)] }] },
    { id: 'machines3', name: 'Gimnasio con máquinas 3 días', level: 'Principiante', desc: 'Máquinas guiadas: fácil de aprender y seguro para empezar.', days: [
      { key: 'L', session: 'Cuerpo completo A', items: [item('legpress', 3), item('chest_machine', 3), item('latpull_machine', 3), item('legcurl_seated', 2), item('lat_raise_machine', 2)] },
      { key: 'X', session: 'Cuerpo completo B', items: [item('hack_squat', 3), item('row_machine', 3), item('ohp_machine', 3), item('legext_machine', 2), item('curl_machine', 2)] },
      { key: 'V', session: 'Cuerpo completo C', items: [item('legpress', 3), item('pec_deck', 3), item('latpull_machine', 3), item('legcurl_lying', 2), item('pushdown', 2), item('calf_machine', 3)] }] },
  ];
  // arma un plan para tu equipo a partir de una plantilla (cambia lo que no tienes)
  function fromTemplate(tid, equip) {
    const t = TEMPLATES.find(function (x) { return x.id === tid; }); if (!t) return null;
    const missing = [];
    const days = t.days.map(function (d) {
      const used = {};
      const items = d.items.map(function (it) {
        const sub = substitute(it.lib, equip);
        if (!sub) { missing.push(LIB[it.lib].name); return null; }
        if (used[sub]) return null; used[sub] = 1;
        return Object.assign({}, it, { lib: sub, id: sub + '@' + d.key, swapped: sub !== it.lib ? LIB[it.lib].name : undefined });
      }).filter(Boolean);
      return { key: d.key, name: D[d.key], session: d.session, items: items };
    });
    return { name: t.name, template: tid, days: days, missing: missing };
  }
  // ejercicio completo (formato del contador) a partir de un elemento del plan
  function resolve(it, dayKey) {
    const base = it.lib && LIB[it.lib] ? LIB[it.lib] : {};
    const o = Object.assign({ rir: '1–2', rest: 90, inc: 2.5, notes: '', muscle2: '' }, base, it);
    o.day = dayKey; o.id = it.id || (it.lib + '@' + dayKey);
    const r = String(o.repsText || '8–12').split('–').map(Number); o.repMin = r[0]; o.repMax = r[1] || r[0];
    o.sets = +o.sets || 3;
    return o;
  }

  const api = { EQUIP: EQUIP, CAT_NAME: CAT_NAME, LIB: LIB, MUSCLES: MUSCLES, TEMPLATES: TEMPLATES, DAY_NAMES: D, available: available, substitute: substitute, fromTemplate: fromTemplate, resolve: resolve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RepLib = api;
})(this);
