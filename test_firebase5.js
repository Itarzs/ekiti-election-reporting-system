import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8tjgvT-QV6_G3GcCkddjdPDKfxbefRa0",
  authDomain: "ekiti-project.firebaseapp.com",
  projectId: "ekiti-project",
  storageBucket: "ekiti-project.firebasestorage.app",
  messagingSenderId: "559931534264",
  appId: "1:559931534264:web:eae775bdb105501ad3fd4d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snapshot = await getDocs(collection(db, "pollingUnits"));
  let count = 0;
  snapshot.forEach(doc => {
    const lga = doc.data().lga;
    if (["GBOYIN", "IDO OSI", "IJERO EKITI", "IKERE EKITI", "ISE/ORUN"].includes(lga)) {
       count++;
    }
  });
  console.log("Total updated LGA names found:", count);
  process.exit(0);
}
run();
