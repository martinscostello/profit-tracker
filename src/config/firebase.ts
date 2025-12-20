import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let initializationError: any;

try {
    // Basic validation to fail fast with a clear error
    if (!firebaseConfig.apiKey) {
        console.error("Firebase config is missing API Key. Check your .env.local file.");
    }

    // Prevent multiple initializations in dev hot-reload
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }

    auth = getAuth(app);

    // FORCE LONG POLLING: Fixes "Write Hangs" on Windows/Firewalls that block WebSockets
    db = initializeFirestore(app, { experimentalForceLongPolling: true });

    // Enable offline persistence (web only)
    // POTENTIAL HANG CAUSE: Commenting out to force direct network connection for debugging.
    /*
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence');
        }
    });
    */

} catch (error) {
    console.error("FIREBASE INITIALIZATION ERROR - SWALLOWED TO PREVENT CRASH:", error);
    initializationError = error;
    // Do NOT throw here. Let the app load so we can show the error in the UI.
}

export { app, auth, db, initializationError };
