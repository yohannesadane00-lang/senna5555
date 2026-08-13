import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBUE2vYaMJqvYMWzRx-t9pxDjJlomZQua4",
  authDomain: "senna-c076d.firebaseapp.com",
  projectId: "senna-c076d",
  storageBucket: "senna-c076d.firebasestorage.app",
  messagingSenderId: "601251269667",
  appId: "1:601251269667:web:1964ff4c035616b8d43596",
  measurementId: "G-4YDLL54HRB"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
