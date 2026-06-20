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
  
  for (const d of snapshot.docs) {
    const data = d.data();
    if (MAP[data.lga]) {
      await updateDoc(doc(db, "pollingUnits", d.id), { lga: MAP[data.lga] });
      updated++;
      if (updated % 50 === 0) console.log(`Updated ${updated} docs so far...`);
    }
  }

  console.log("Updated", updated, "Firebase documents total!");
  process.exit(0);
}
run();
