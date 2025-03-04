// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCecoj6ODSIy5_ppwgBJrC4Atbxn-30Fxs",
    authDomain: "baseball-score-analytics.firebaseapp.com",
    projectId: "baseball-score-analytics",
    storageBucket: "baseball-score-analytics.firebasestorage.app",
    messagingSenderId: "725042303073",
    appId: "1:725042303073:web:bff45dc68b2d4f802eda20",
    measurementId: "G-5QCHDN7R3S"
  };

// Firebase を初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ 正しい export 構文
export { db };
