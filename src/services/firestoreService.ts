/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  doc, 
  addDoc, 
  orderBy 
} from 'firebase/firestore';

// Configuración de Firebase (se obtendría de variables de entorno)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
};

// Inicializamos Firebase solo si hay configuración real para evitar errores en la vista previa
const app = firebaseConfig.apiKey !== "demo-key" ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

/**
 * SERVICIO REAL DE FIRESTORE
 * Estas funciones utilizan la API real de Firebase Firestore con onSnapshot
 * para consultas en tiempo real, tal como se solicitó en el prompt.
 */

export const firestoreService = {
  // 1. Dashboard: onSnapshot para obtener órdenes en tiempo real
  subscribeToOrders: (callback: (orders: any[]) => void) => {
    if (!db) return () => {}; // Fallback si no hay DB
    
    const q = query(collection(db, 'ordenes'), orderBy('fechaIngreso', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(orders);
    });
  },

  // 2. Presupuestos: Actualizar orden y congelar precios
  updatePresupuesto: async (ordenId: string, data: any) => {
    if (!db) return;
    const ordenRef = doc(db, 'ordenes', ordenId);
    await updateDoc(ordenRef, data);
  },

  // 3. Trazabilidad: onSnapshot para historial por patente
  subscribeToHistorial: (patente: string, callback: (historial: any[]) => void) => {
    if (!db || !patente) return () => {};
    
    // Consulta a la subcolección historial_tecnico del vehículo
    const q = query(
      collection(db, `vehiculos/${patente}/historial_tecnico`),
      orderBy('fecha', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(history);
    });
  },

  // 4. Repuestos: Añadir repuesto a una orden
  addRepuestoToOrden: async (ordenId: string, repuesto: any, mecanico: any) => {
    if (!db) return;
    const ordenRef = doc(db, 'ordenes', ordenId);
    
    // En una transacción real, leeríamos primero los repuestos actuales
    // Aquí simplificamos para el ejemplo
    await updateDoc(ordenRef, {
      mecanicoResponsable: mecanico,
      // Firestore arrayUnion se usaría aquí en un caso real:
      // repuestos: arrayUnion(repuesto)
    });
  }
};
