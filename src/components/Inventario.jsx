import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import styles from './Inventario.module.css';

export default function Inventario() {
  const { data, showAlert } = useAppContext();
  const isAdmin = data?.user?.rol === 'admin' || data?.user?.rol === 'Gerencia';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('');
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
      showAlert({
        type: 'error',
        title: 'Error de Inventario',
        message: 'Hubo un error al intentar registrar la compra de insumos.',
        confirmText: 'Cerrar'
      });
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
      showAlert({
        type: 'warning',
        title: 'Cantidad Inválida',
        message: 'La cantidad debe ser mayor a cero y no puede exceder el stock disponible.',
        confirmText: 'Corregir'
      });
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
      showAlert({
        type: 'error',
        title: 'Error de Salida',
        message: 'Hubo un error al intentar registrar la salida del insumo.',
        confirmText: 'Cerrar'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryClass = (cat) => {
    if (cat === 'Fertilizante') return styles.catFertilizante;
    if (cat === 'Pesticida') return styles.catPesticida;
    if (cat === 'Herramienta') return styles.catHerramienta;
    if (cat === 'Semilla') return styles.catSemilla;
    return '';
  };

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'Fertilizante':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            <path d="M12 2.69v10.31" />
            <path d="M8 12l4-4 4 4" />
          </svg>
        );
      case 'Pesticida':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'Herramienta':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case 'Semilla':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" />
            <path d="M12 6v12M6 12h12" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
    }
  };

  const itemsFiltrados = filtroCategoria === 'todos' 
    ? items 
    : items.filter(item => item.categoria === filtroCategoria);

  const handleOpenEditModal = (item) => {
    setItemToEdit(item);
    setNombre(item.nombre);
    setCategoria(item.categoria);
    setCantidad(item.cantidad);
    setUnidad(item.unidad);
    setVencimiento(item.vencimiento || '');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setItemToEdit(null);
    setNombre('');
    setCategoria('');
    setCantidad('');
    setUnidad('');
    setVencimiento('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !cantidad || !itemToEdit) return;

    setSubmitting(true);
    try {
      const itemRef = doc(db, 'inventario', itemToEdit.id);
      await updateDoc(itemRef, {
        nombre,
        categoria,
        cantidad: Number(cantidad),
        unidad,
        vencimiento,
      });
      handleCloseEditModal();
      showAlert({
        type: 'success',
        title: 'Producto Actualizado',
        message: 'El producto ha sido actualizado exitosamente.',
        confirmText: 'Excelente'
      });
    } catch (error) {
      console.error("Error updating inventory item:", error);
      showAlert({
        type: 'error',
        title: 'Error de Edición',
        message: 'Hubo un error al intentar actualizar el producto.',
        confirmText: 'Cerrar'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Inventario y Stock</h2>
          <p className={styles.subtitle}>Gestión de fertilizantes, pesticidas y herramientas de la finca.</p>
        </div>

        <div className={styles.headerActions}>
          <select 
            className={styles.filtroSelect} 
            value={filtroCategoria} 
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="todos">Todas las Categorías</option>
            <option value="Fertilizante">Fertilizantes</option>
            <option value="Pesticida">Pesticidas</option>
            <option value="Herramienta">Herramientas</option>
            <option value="Semilla">Semillas</option>
          </select>
          <div className={styles.totalItems}>
            <span className={styles.totalLabel}>Total:</span>
            <span className={styles.totalValue}>{items.length}</span>
          </div>
          <button className={styles.addBtn} onClick={handleOpenModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Compra
          </button>
        </div>
      </div>

      <div className={styles.inventoryGrid}>
        {itemsFiltrados.map(item => (
          <div key={item.id} className={`${styles.itemCard} ${getCategoryClass(item.categoria)}`}>
            <div className={styles.itemHeader}>
              <h3 className={styles.itemName}>
                {item.nombre}
                {item.cantidad < 10 && (
                  <span className={styles.lowStockBadge} title="Stock Crítico">⚠️</span>
                )}
              </h3>
              <span className={styles.itemCategory}>{item.categoria}</span>
            </div>

            <div className={styles.itemBody}>
              <div className={styles.iconContainer}>
                {getCategoryIcon(item.categoria)}
              </div>
              <div className={styles.itemDescription}>
                <p className={styles.descriptionText}>
                  {item.categoria === 'Fertilizante' && 'Alimento químico para nutrir el suelo y promover el crecimiento de las plantas.'}
                  {item.categoria === 'Pesticida' && 'Producto químico para controlar plagas y enfermedades en los cultivos.'}
                  {item.categoria === 'Herramienta' && 'Equipo y herramientas necesarias para las labores agrícolas.'}
                  {item.categoria === 'Semilla' && 'Semillas de alta calidad para la siembra y cultivo.'}
                </p>
              </div>
            </div>

            <div className={styles.stockSection}>
              <div className={styles.stockLabel}>Cantidad Disponible</div>
              <div className={styles.stockBarContainer}>
                <div className={styles.stockBar} style={{ width: `${Math.min((item.cantidad / 100) * 100, 100)}%` }}></div>
              </div>
              <div className={styles.stockInfo}>
                <span className={styles.stockAmount}>{item.cantidad}</span>
                <span className={styles.stockUnit}>{item.unidad}</span>
              </div>
            </div>

            <div className={styles.itemFooter}>
              <button
                className={styles.consumeBtn}
                onClick={() => handleOpenConsumeModal(item)}
              >
                Registrar Salida
              </button>
              <button
                className={styles.editBtn}
                onClick={() => handleOpenEditModal(item)}
                title="Editar Producto"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              {item.vencimiento && (
                <span className={styles.vencimiento}>Vence: {item.vencimiento}</span>
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

      {/* Modal for Editing Items */}
      {isEditModalOpen && itemToEdit && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Editar Producto</h3>
            <form onSubmit={handleEditSubmit}>

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
                  <label className={styles.label}>Cantidad</label>
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
                <button type="button" className={styles.cancelBtn} onClick={handleCloseEditModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
