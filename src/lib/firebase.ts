import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8tjgvT-QV6_G3GcCkddjdPDKfxbefRa0",
  authDomain: "ekiti-project.firebaseapp.com",
  projectId: "ekiti-project",
  storageBucket: "ekiti-project.firebasestorage.app",
  messagingSenderId: "559931534264",
  appId: "1:559931534264:web:eae775bdb105501ad3fd4d",
  measurementId: "G-JB1TGT60B6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
