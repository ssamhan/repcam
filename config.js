// Configuración de RepCam.
// 1) ownerEmail: el dueño y administrador principal (entra con Google con este correo).
// 2) firebase: pega aquí el bloque "firebaseConfig" de tu proyecto Firebase (ver docs/FIREBASE.md).
//    Mientras firebase sea null, la app funciona sin servidor (cuentas solo en este teléfono).
window.REPCAM_CONFIG = {
  ownerEmail: 'sssamhan@gmail.com',
  ownerName: 'Sebastián Samhan',
  firebase: null,
  // firebase: {
  //   apiKey: '...',
  //   authDomain: 'TU-PROYECTO.firebaseapp.com',
  //   projectId: 'TU-PROYECTO',
  //   storageBucket: 'TU-PROYECTO.appspot.com',
  //   messagingSenderId: '...',
  //   appId: '...',
  // },
};
