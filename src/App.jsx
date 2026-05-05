import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PlaceholderPage from './components/PlaceholderPage';
import CropsManagement from './components/CropsManagement';
import HarvestLog from './components/HarvestLog';
import Login from './components/Login';
import NuevaSiembra from './components/NuevaSiembra';
import DashboardAlertas from './components/DashboardAlertas';
import ConfiguracionWhatsApp from './components/ConfiguracionWhatsApp';
import UsersManagement from './components/UsersManagement';
import MonitoreoCampo from './components/MonitoreoCampo';
import Inventario from './components/Inventario';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import './index.css';
import styles from './App.module.css';

function AppContent({ userRole }) {
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
      case 'usuarios': return userRole === 'admin' ? <UsersManagement /> : <Dashboard />;
      default: return <PlaceholderPage page={activePage} />;
    }
  };

  return (
    <div className={styles.appLayout}>
      <Header onNavigate={setActivePage} userRole={userRole} />

      <main className={styles.mainContent}>
        <div className={styles.pageWrapper}>
          {renderPage()}
        </div>
      </main>

      <Sidebar active={activePage} onNavigate={setActivePage} />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-gray)', color: 'var(--primary)', fontWeight: 'bold' }}>
        Cargando Finca Digital...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AppProvider currentUser={user}>
      <AppContent userRole={userRole} />
    </AppProvider>
  );
}

export default App;
