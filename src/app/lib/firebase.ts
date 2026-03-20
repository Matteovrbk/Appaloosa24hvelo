import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Remplace les valeurs ci-dessous par celles de ton projet Firebase happaloosa66
// (Firebase Console > Paramètres du projet > Tes applications > Config)
const firebaseConfig = {
  apiKey: "AIzaSyCI9-dPK3SIN5UtMmexge8CSdVn8OwBWrA",
  authDomain: "happaloosa66.firebaseapp.com",
  projectId: "happaloosa66",
  storageBucket: "happaloosa66.firebasestorage.app",
  messagingSenderId: "92852308273",
  appId: "1:1072716268471:web:8b3948276730011a17840f",
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
