import { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AppContext = createContext();

const INITIAL_DATA = {
  user: {
    nombre: 'Admin',
    rol: 'Gerencia',
    email: 'admin@fincadigital.com',
    estado: 'Activo'
  },
  stats: {
    'cultivos-activos': { count: 4 },
    'inventario': { count: 12 },
    'reportes': { count: 8 },
  },
  cultivos: {
    maiz: { campos: 2, hectareas: '1.2 ha totales', count: 2, data: [2, 3, 2.5, 4, 3.5, 5, 4.5, 6] },
    cacao: { campos: 1, hectareas: '1.8 ha totales', count: 1, data: [1, 1, 2, 3, 3, 3, 4, 4] },
    yuca: { campos: 0, hectareas: 'Sin siembra', count: 0, data: [1, 2, 1, 3, 1, 2, 1, 1] },
    platano: { campos: 0, hectareas: 'Sin siembra', count: 1, data: [0, 0, 0, 1, 0, 0, 1, 1] },
  },
  fertilizations: [],
  weather: null // Will hold weather data
};

export function AppProvider({ children }) {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'dashboard', 'mainData');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(prev => ({ ...prev, ...docSnap.data() }));
      } else {
        setDoc(docRef, INITIAL_DATA);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addFertilizationLog = async (log) => {
    const newLogs = [...(data.fertilizations || []), { ...log, id: Date.now().toString(), date: new Date().toLocaleDateString() }];
    
    setData(prev => ({
      ...prev,
      fertilizations: newLogs
    }));

    try {
      const docRef = doc(db, 'dashboard', 'mainData');
      await updateDoc(docRef, { fertilizations: newLogs });
    } catch (err) {
      console.error("Error saving fertilization:", err);
    }
  };

  const updateCrop = async (cropId, updatedFields) => {
    // Optimistic UI update
    setData(prev => ({
      ...prev,
      cultivos: {
        ...prev.cultivos,
        [cropId]: { ...prev.cultivos[cropId], ...updatedFields }
      }
    }));

    // Firestore update
    try {
      const docRef = doc(db, 'dashboard', 'mainData');
      await updateDoc(docRef, {
        [`cultivos.${cropId}`]: { ...data.cultivos[cropId], ...updatedFields }
      });
    } catch (err) {
      console.error("Error updating crop:", err);
    }
  };

  const updateInventoryStat = async (amount) => {
    const currentInv = data.stats.inventario.count;
    setData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        inventario: { count: currentInv + amount }
      }
    }));

    try {
      const docRef = doc(db, 'dashboard', 'mainData');
      await updateDoc(docRef, {
        'stats.inventario.count': currentInv + amount
      });
    } catch (err) {
      console.error("Error updating inventory stat:", err);
    }
  };

  return (
    <AppContext.Provider value={{ data, loading, updateCrop, updateInventoryStat, addFertilizationLog }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
