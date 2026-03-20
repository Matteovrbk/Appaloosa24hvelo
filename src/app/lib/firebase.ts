import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Remplace les valeurs ci-dessous par celles de ton projet Firebase happaloosa66
// (Firebase Console > Paramètres du projet > Tes applications > Config)
const firebaseConfig = {
  apiKey: "REMPLACE_PAR_TON_API_KEY",
  authDomain: "happaloosa66.firebaseapp.com",
  projectId: "happaloosa66",
  storageBucket: "happaloosa66.firebasestorage.app",
  messagingSenderId: "REMPLACE_PAR_TON_SENDER_ID",
  appId: "REMPLACE_PAR_TON_APP_ID",
  databaseURL:
    (import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined) ||
    "https://happaloosa66-default-rtdb.europe-west1.firebasedatabase.app",
};

let db: ReturnType<typeof getDatabase> | null = null;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getDatabase(app);
} catch {
  db = null;
}

export { db };
