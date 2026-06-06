import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseError } from './firebase';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CropsManagement from './components/CropsManagement';
import HarvestLog from './components/HarvestLog';
import Login from './components/Login';
import NuevaSiembra from './components/NuevaSiembra';
import DashboardAlertas from './components/DashboardAlertas';
import ConfiguracionWhatsApp from './components/ConfiguracionWhatsApp';
import UsersManagement from './components/UsersManagement';
import MonitoreoCampo from './components/MonitoreoCampo';
import Inventario from './components/Inventario';
import SoilHealth from './components/SoilHealth';
import TaskBoard from './components/TaskBoard';
import SecurityQuestionsSetup from './components/SecurityQuestionsSetup';
import FirebaseErrorScreen from './components/FirebaseErrorScreen';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import './index.css';
import styles from './App.module.css';

function AppContent({ user, userRole, securitySetupNeeded, setSecuritySetupNeeded }) {
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    const handleNavigate = (e) => setActivePage(e.detail);
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'alertas': return <DashboardAlertas />;
      case 'nuevaSiembra': return <NuevaSiembra />;
      case 'cultivos': return <CropsManagement />;
      case 'monitoreo': return <MonitoreoCampo />;
      case 'inventario': return <Inventario />;
      case 'reportes': return <HarvestLog />;
      case 'config': return <ConfiguracionWhatsApp />;
      case 'suelo': return <SoilHealth />;
      case 'tareas': return <TaskBoard />;
      case 'usuarios': return userRole === 'admin' ? <UsersManagement /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`${styles.appLayout} ${activePage === 'dashboard' ? styles.dashboardBg : ''}`}>
      <Header onNavigate={setActivePage} userRole={userRole} />

      <main className={styles.mainContent}>
        <div className={styles.pageWrapper}>
          {securitySetupNeeded && (
            <SecurityQuestionsSetup
              userId={user.uid}
              onComplete={() => setSecuritySetupNeeded(false)}
            />
          )}
          {renderPage()}
        </div>
      </main>

      <Sidebar active={activePage} onNavigate={setActivePage} />
    </div>
  );
}

function FincaDigitalApp() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [securitySetupNeeded, setSecuritySetupNeeded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          // Verificar setup de seguridad
          const secRef = doc(db, 'security_configs', currentUser.uid);
          const secSnap = await getDoc(secRef);
          if (!secSnap.exists() || !secSnap.data().setupComplete) {
            setSecuritySetupNeeded(true);
          }

          let role = 'encargado';
          let name = currentUser.email.split('@')[0];

          if (docSnap.exists()) {
            const d = docSnap.data();
            role = d.role || 'encargado';
            name = d.name || name;
          } else {
            role = currentUser.email === 'admin@fincadigital.com' ? 'admin' : 'encargado';
          }
          setUserRole(role);
          setUser({ ...currentUser, role, displayName: name });
        } catch (error) {
          console.error("Error fetching role:", error);
          setUserRole('encargado');
          setUser({ ...currentUser, role: 'encargado', displayName: currentUser.email.split('@')[0] });
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.tractorWrapper}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={styles.tractorIcon}
          >
            <path d="M3 17h6M15 17h6M7 17v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4M11 11V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4M5 11h6M7 17a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM21 17a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM17 11V7M13 7h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <div className={styles.dirtPath}></div>
          <div className={styles.clod} style={{animationDelay: '0s'}}></div>
          <div className={styles.clod} style={{animationDelay: '0.3s', left: '15px'}}></div>
          <div className={styles.clod} style={{animationDelay: '0.6s', left: '25px'}}></div>
        </div>
        <h2 className={styles.loadingTitle}>Arando el campo...</h2>
        <p className={styles.loadingSub}>Cargando Finca Digital</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AppProvider currentUser={user}>
      <AppContent
        user={user}
        userRole={userRole}
        securitySetupNeeded={securitySetupNeeded}
        setSecuritySetupNeeded={setSecuritySetupNeeded}
      />
    </AppProvider>
  );
}

function App() {
  if (firebaseError) {
    return <FirebaseErrorScreen error={firebaseError} />;
  }
  return <FincaDigitalApp />;
}

export default App;
