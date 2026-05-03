import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import styles from './Inventario.module.css';

export default function Inventario() {
  const { data } = useAppContext();
  const isAdmin = data?.user?.rol === 'admin' || data?.user?.rol === 'Gerencia';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Fertilizante');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('Litros');
  const [vencimiento, setVencimiento] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Consume state
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [itemToConsume, setItemToConsume] = useState(null);
  const [consumeAmount, setConsumeAmount] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'inventario'), orderBy('nombre', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Si está vacío, agregamos unos mocks para demostración visual rápida
      if (invData.length === 0 && !loading) {
        setItems([
          { id: '1', nombre: 'Urea Agrícola 46%', categoria: 'Fertilizante', cantidad: 500, unidad: 'Kg', vencimiento: '2027-12-01' },
          { id: '2', nombre: 'Glifosato 480', categoria: 'Pesticida', cantidad: 50, unidad: 'Litros', vencimiento: '2026-06-15' },
          { id: '3', nombre: 'Tijeras de Podar', categoria: 'Herramienta', cantidad: 12, unidad: 'Unidades', vencimiento: '' },
        ]);
      } else {
        setItems(invData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loading]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNombre('');
    setCantidad('');
    setVencimiento('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !cantidad) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'inventario'), {
        nombre,
        categoria,
        cantidad: Number(cantidad),
        unidad,
        vencimiento,
        fechaIngreso: serverTimestamp(),
        ingresadoPor: data.user.nombre
      });
      handleCloseModal();
    } catch (error) {
      console.error("Error adding inventory item:", error);
      alert("Hubo un error al registrar la compra.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenConsumeModal = (item) => {
    setItemToConsume(item);
    setConsumeAmount('');
    setIsConsumeModalOpen(true);
  };

  const handleCloseConsumeModal = () => {
    setIsConsumeModalOpen(false);
    setItemToConsume(null);
    setConsumeAmount('');
  };

  const handleConsumeSubmit = async (e) => {
    e.preventDefault();
    if (!consumeAmount || !itemToConsume) return;

    const amount = Number(consumeAmount);
    if (amount <= 0 || amount > itemToConsume.cantidad) {
      alert("La cantidad debe ser válida y no mayor al stock disponible.");
      return;
    }

    setSubmitting(true);
    try {
      const itemRef = doc(db, 'inventario', itemToConsume.id);
      await updateDoc(itemRef, {
        cantidad: itemToConsume.cantidad - amount,
        ultimaSalida: serverTimestamp(),
      });
      handleCloseConsumeModal();
    } catch (error) {
      console.error("Error updating inventory item:", error);
      alert("Hubo un error al registrar la salida.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryClass = (cat) => {
    if (cat === 'Fertilizante') return styles.catFertilizante;
    if (cat === 'Pesticida') return styles.catPesticida;
    if (cat === 'Herramienta') return styles.catHerramienta;
    return '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Inventario y Stock</h2>
          <p className={styles.subtitle}>Gestión de fertilizantes, pesticidas y herramientas de la finca.</p>
        </div>
        
        <button className={styles.addBtn} onClick={handleOpenModal}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva Compra (Surtir)
        </button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total de Ítems Registrados</span>
          <span className={styles.statValue}>{items.length}</span>
        </div>
      </div>

      <div className={styles.inventoryGrid}>
        {items.map(item => (
          <div key={item.id} className={`${styles.itemCard} ${getCategoryClass(item.categoria)}`}>
            <div className={styles.itemHeader}>
              <h3 className={styles.itemName}>{item.nombre}</h3>
              <span className={styles.itemCategory}>{item.categoria}</span>
            </div>
            
            <div className={styles.stockInfo}>
              <span className={styles.stockAmount}>{item.cantidad}</span>
              <span className={styles.stockUnit}>{item.unidad}</span>
            </div>

            <div className={styles.itemFooter}>
              <button 
                className={styles.consumeBtn} 
                onClick={() => handleOpenConsumeModal(item)}
              >
                Registrar Salida
              </button>
              {item.vencimiento && (
                <span>Vence: {item.vencimiento}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal for adding new items */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Registrar Ingreso de Insumo</h3>
            <form onSubmit={handleAddSubmit}>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre del Insumo</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Ej. Urea 46%, Glifosato..."
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Categoría</label>
                  <select className={styles.select} value={categoria} onChange={e => setCategoria(e.target.value)}>
                    <option value="Fertilizante">Fertilizante</option>
                    <option value="Pesticida">Pesticida</option>
                    <option value="Herramienta">Herramienta</option>
                    <option value="Semilla">Semilla</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Unidad</label>
                  <select className={styles.select} value={unidad} onChange={e => setUnidad(e.target.value)}>
                    <option value="Kg">Kilogramos (Kg)</option>
                    <option value="Litros">Litros (L)</option>
                    <option value="Unidades">Unidades (uds)</option>
                    <option value="Sacos">Sacos</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cantidad Ingresada</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={cantidad}
                    onChange={e => setCantidad(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Fecha Vencimiento</label>
                  <input 
                    type="date" 
                    className={styles.input} 
                    value={vencimiento}
                    onChange={e => setVencimiento(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Registrar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Consuming Items (Salida) */}
      {isConsumeModalOpen && itemToConsume && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Registrar Salida de Insumo</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
              ¿Cuánto <strong>{itemToConsume.nombre}</strong> vas a utilizar o retirar del inventario? (Disponible: {itemToConsume.cantidad} {itemToConsume.unidad})
            </p>
            <form onSubmit={handleConsumeSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Cantidad a retirar ({itemToConsume.unidad})</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  min="0.01"
                  step="0.01"
                  max={itemToConsume.cantidad}
                  placeholder={`Máximo ${itemToConsume.cantidad}`}
                  value={consumeAmount}
                  onChange={e => setConsumeAmount(e.target.value)}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseConsumeModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn} style={{ background: '#ef4444' }} disabled={submitting}>
                  {submitting ? 'Procesando...' : 'Confirmar Salida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
