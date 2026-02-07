// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9SuX2lNCvKnZZvs-quJbFlHhaZ9_dOco",
  authDomain: "money-1bc2d.firebaseapp.com",
  projectId: "money-1bc2d",
  storageBucket: "money-1bc2d.firebasestorage.app",
  messagingSenderId: "974106071058",
  appId: "1:974106071058:web:d27b144882b2c8913dc8cb",
  measurementId: "G-Z7JJ66FSSQ"
};

// Use the firebase object provided by the scripts in index.html
var db;
// indicate whether persistence is available (fallbacks will use localStorage)
window.persistenceAvailable = false;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  // Enable offline persistence for better reliability
  db.enablePersistence().then(() => {
      window.persistenceAvailable = true;
      console.info("Firestore persistence enabled: data will survive browser restarts when possible.");
  }).catch((err) => {
      // Set flag and provide helpful messages
      window.persistenceAvailable = false;
      if (err.code === 'failed-precondition') {
          console.warn("Firestore persistence failed: multiple tabs open. Persistence only works in one tab at a time.");
      } else if (err.code === 'unimplemented') {
          console.warn("Firestore persistence is not available in this browser (private mode or unsupported browser). Falling back to in-memory / localStorage fallback.");
      } else {
          console.warn("Firestore persistence could not be enabled:", err);
      }
  });
} catch (e) {
  console.error("Firebase initialization failed:", e);
  window.persistenceAvailable = false;
}
