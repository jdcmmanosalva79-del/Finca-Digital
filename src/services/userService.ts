import { collection, query, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, firebaseConfig } from '../firebase';
import { UserProfile, UserRole } from '../types/user';

/**
 * Obtener todos los usuarios desde Firestore
 */
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  const q = query(collection(db, 'users'));
  const querySnapshot = await getDocs(q);
  const usersList: UserProfile[] = [];
  
  querySnapshot.forEach((docSnap) => {
    usersList.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
  });
  
  return usersList;
};

/**
 * Actualizar el rol de un usuario
 */
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role: newRole });
};

/**
 * Crear un nuevo usuario en Firebase Auth y guardarlo en Firestore
 * Esta función utiliza una app secundaria de Firebase para evitar
 * cerrar la sesión del administrador que está creando el usuario.
 */
export const createNewUser = async (email: string, password: string, role: UserRole): Promise<UserProfile> => {
  // Inicializar una app secundaria de Firebase
  const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
  const secondaryAuth = getAuth(secondaryApp);
  
  // Crear usuario en Firebase Authentication (app secundaria)
  const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  
  const newUserProfile: UserProfile = {
    id: userCred.user.uid,
    email: userCred.user.email || email,
    role: role,
    createdAt: new Date().toISOString()
  };

  // Guardar en la colección 'users' de Firestore
  await setDoc(doc(db, 'users', newUserProfile.id), {
    email: newUserProfile.email,
    role: newUserProfile.role,
    createdAt: newUserProfile.createdAt
  });

  // Cerrar la sesión en la app secundaria
  await secondaryAuth.signOut();
  
  return newUserProfile;
};
