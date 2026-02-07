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
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  // Enable offline persistence for better reliability
  db.enablePersistence().catch((err) => {
      if (err.code == 'failed-precondition') {
          console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (err.code == 'unimplemented') {
          console.warn("The current browser does not support all of the features required to enable persistence");
      }
  });
} catch (e) {
  console.error("Firebase initialization failed:", e);
}
