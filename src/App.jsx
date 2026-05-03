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

  const renderPage = () => {
    switch(activePage) {
      case 'dashboard':    return <Dashboard />;
      case 'alertas':     return <DashboardAlertas />;
      case 'nuevaSiembra':return <NuevaSiembra />;
      case 'cultivos':    return <CropsManagement />;
      case 'monitoreo':   return <MonitoreoCampo />;
      case 'inventario':  return <Inventario />;
      case 'reportes':    return <HarvestLog />;
      case 'config':      return <ConfiguracionWhatsApp />;
      case 'usuarios':    return userRole === 'admin' ? <UsersManagement /> : <Dashboard />;
      default:            return <PlaceholderPage page={activePage} />;
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar active={activePage} onNavigate={setActivePage} userRole={userRole} />
      <div className={styles.main}>
        <Header onNavigate={setActivePage} userRole={userRole} />
        <main className={styles.content}>
          {renderPage()}
        </main>
      </div>
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
            // Fallback
            role = currentUser.email === 'admin@fincadigital.com' ? 'admin' : 'encargado';
          }
          setUserRole(role);
          // Attach full info
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--cream)', color: 'var(--teal)', fontWeight: 'bold' }}>
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
