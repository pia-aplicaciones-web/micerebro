// Firebase configuration - Solo configuración, sin inicialización
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase - Usando variables de entorno
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase solo en el cliente
let app = null;
let auth = null;
let firestore = null;
let storage = null;
let initPromise = null; // Promesa de inicialización para evitar múltiples inicializaciones simultáneas

export const initFirebase = async () => {
  if (typeof window === 'undefined') {
    return { app: null, auth: null, firestore: null, storage: null };
  }

  // Si ya está inicializado, retornar inmediatamente
  if (app && auth && firestore && storage) {
    return { app, auth, firestore, storage };
  }

  // Si hay una inicialización en curso, esperar a que termine
  if (initPromise) {
    return initPromise;
  }

  // Crear nueva promesa de inicialización
  initPromise = (async () => {
    try {
      // Inicializar app
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase App inicializado');
      } else {
        app = getApp();
        console.log('✅ Firebase App ya existente, reutilizando');
      }

      // Inicializar Auth con persistencia de sesión
      auth = getAuth(app);
      await setPersistence(auth, browserSessionPersistence);
      console.log('✅ Firebase Auth inicializado con persistencia de sesión');
      
      // Inicializar Firestore y Storage
      firestore = getFirestore(app);
      storage = getStorage(app);
      console.log('✅ Firebase Firestore y Storage inicializados');

      console.log('✅ Firebase completamente inicializado');
      
      return { app, auth, firestore, storage };
    } catch (error) {
      console.error('❌ Error al inicializar Firebase:', error);
      initPromise = null; // Resetear para permitir reintentos
      throw error;
    }
  })();

  return initPromise;
};

// Getters para obtener instancias (solo en cliente)
export const getFirebaseApp = () => {
  if (typeof window === 'undefined') return null;
  return app;
};

export const getFirebaseAuth = () => {
  if (typeof window === 'undefined') return null;
  return auth;
};

export const getFirebaseFirestore = () => {
  if (typeof window === 'undefined') return null;
  return firestore;
};

export const getFirebaseStorage = () => {
  if (typeof window === 'undefined') return null;
  return storage;
};

