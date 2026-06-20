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

const MAP = {
  "GBONYIN": "GBOYIN",
  "IDO / OSI": "IDO OSI",
  "IJERO": "IJERO EKITI",
  "IKERE": "IKERE EKITI",
  "ISE /ORUN": "ISE/ORUN"
};

async function run() {
  const snapshot = await getDocs(collection(db, "pollingUnits"));
  let updated = 0;
  
  const updates = [];
  snapshot.forEach(d => {
    const data = d.data();
    if (MAP[data.lga]) {
      updates.push(updateDoc(doc(db, "pollingUnits", d.id), { lga: MAP[data.lga] }));
      updated++;
    }
  });

  await Promise.all(updates);
  console.log("Updated", updated, "Firebase documents!");
  process.exit(0);
}
run();
