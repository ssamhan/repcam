// RepCam · servidor central (Firebase): cuentas, perfiles y planes.
// Las series, pesos y grabaciones NO pasan por aquí: quedan en el teléfono.
const V = '10.12.2', B = 'https://www.gstatic.com/firebasejs/' + V + '/';
const [{ initializeApp }, A, F] = await Promise.all([import(B + 'firebase-app.js'), import(B + 'firebase-auth.js'), import(B + 'firebase-firestore.js')]);

let app, auth, db;
const userOf = (u) => (u ? { uid: u.uid, email: (u.email || '').toLowerCase(), name: u.displayName || '', verified: !!u.emailVerified } : null);
const ERR = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.', 'auth/wrong-password': 'Contraseña incorrecta.', 'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Entra con tu contraseña.', 'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El correo no es válido.', 'auth/network-request-failed': 'Sin conexión a internet.', 'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.', 'auth/missing-password': 'Escribe tu contraseña.',
'permission-denied': 'El servidor no lo permitió.', 'unavailable': 'Sin conexión con el servidor.',
};
const msg = (e) => ERR[e && e.code] || (e && e.message) || 'Error desconocido';

window.Cloud = {
  msg,
  init(cfg) {
    app = initializeApp(cfg);
    auth = A.getAuth(app); auth.languageCode = 'es';   // correos de verificación y de contraseña en español
    try { db = F.initializeFirestore(app, { localCache: F.persistentLocalCache() }); } catch (e) { db = F.getFirestore(app); }
  },
  onAuth(cb) { return A.onAuthStateChanged(auth, (u) => cb(userOf(u))); },
  async signIn(email, pass) { await A.signInWithEmailAndPassword(auth, email, pass); },
  async signUp(email, pass, name) {
    const c = await A.createUserWithEmailAndPassword(auth, email, pass);
    if (name) await A.updateProfile(c.user, { displayName: name });
    try { await A.sendEmailVerification(c.user); } catch (e) {}
  },
  // verificación del correo (necesaria para el dueño)
  async resendVerification() { if (auth.currentUser) await A.sendEmailVerification(auth.currentUser); },
  async reloadUser() { if (!auth.currentUser) return null; await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); return userOf(auth.currentUser); },
  async reset(email) { await A.sendPasswordResetEmail(auth, email); },
  async signOut() { await A.signOut(auth); },
  async getUser(uid) { const s = await F.getDoc(F.doc(db, 'users', uid)); return s.exists() ? s.data() : null; },
  async createUser(uid, data) { await F.setDoc(F.doc(db, 'users', uid), data); return data; },
  async updateMe(uid, data) { await F.setDoc(F.doc(db, 'users', uid), data, { merge: true }); },
  async listUsers() { const q = await F.getDocs(F.collection(db, 'users')); return q.docs.map((d) => Object.assign({ uid: d.id }, d.data())); },
  async adminUpdate(uid, data) { await F.updateDoc(F.doc(db, 'users', uid), data); },
  async adminDelete(uid) { await F.deleteDoc(F.doc(db, 'users', uid)); },
  async getConfig() { const s = await F.getDoc(F.doc(db, 'config', 'app')); return s.exists() ? s.data() : { allowSignup: true, invited: [] }; },
  async setConfig(d) { await F.setDoc(F.doc(db, 'config', 'app'), d, { merge: true }); },
};
