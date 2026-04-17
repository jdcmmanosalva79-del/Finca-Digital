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
import './index.css';
import styles from './App.module.css';

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch(activePage) {
      case 'dashboard':    return <Dashboard />;
      case 'alertas':     return <DashboardAlertas />;
      case 'nuevaSiembra':return <NuevaSiembra />;
      case 'cultivos':    return <CropsManagement />;
      case 'reportes':    return <HarvestLog />;
      case 'config':      return <ConfiguracionWhatsApp />;
      default:            return <PlaceholderPage page={activePage} />;
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar active={activePage} onNavigate={setActivePage} />
      <div className={styles.main}>
        <Header />
        <main className={styles.content}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
