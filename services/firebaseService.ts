// FIX: Changed named import to namespace import for firebase/app to resolve module loading errors.
import * as firebaseApp from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4iUcauBAmksZzkgj3kBXGdFlIUoLUvVo",
  authDomain: "xamu-wil.firebaseapp.com",
  databaseURL: "https://xamu-wil-default-rtdb.firebaseio.com",
  projectId: "xamu-wil",
  storageBucket: "xamu-wil.firebasestorage.app",
  messagingSenderId: "722862111675",
  appId: "1:722862111675:web:3d692ee7a78c070b6b629e"
};

// Initialize Firebase using the v9 modular pattern
// FIX: Use the firebaseApp namespace to call the initialization functions.
const app = !firebaseApp.getApps().length ? firebaseApp.initializeApp(firebaseConfig) : firebaseApp.getApp();
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

export { app, auth, db, storage };