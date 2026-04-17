import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './PlaceholderPage.module.css';

export default function HarvestLog() {
  const { data, addFertilizationLog } = useAppContext();
  
  // Form state
  const [formData, setFormData] = useState({
    crop: 'Maíz',
    type: 'Urea (Nitrógeno)',
    amount: '',
    lote: 'Lote 1'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount) return;
    
    addFertilizationLog(formData);
    setFormData({ ...formData, amount: '' }); // reset amount
    alert('Fertilización registrada correctamente');
  };

  const handleExportPDF = () => {
    if (!data) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(42, 125, 111); // Teal color
    doc.text('Reporte de Eficiencia - Finca Digital', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text(`Generado por: ${data.user.nombre} (${data.user.rol})`, 14, 38);

    // Cultivos Table
    autoTable(doc, {
      startY: 48,
      headStyles: { fillColor: [42, 125, 111] },
      head: [['Cultivo', 'Campos Activos', 'Hectáreas Totales', 'Conteo']],
      body: Object.values(data.cultivos || {}).map(c => [
        c.name,
        c.campos.toString(),
        c.hectareas,
        c.count.toString()
      ]),
    });

    let finalY = doc.lastAutoTable.finalY || 50;

    // Fertilizations Table
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Registro de Fertilización Histórico:', 14, finalY + 15);
    
    const logs = data.fertilizations || [];
    if (logs.length > 0) {
      autoTable(doc, {
        startY: finalY + 22,
        headStyles: { fillColor: [107, 76, 42] }, // Brown color
        head: [['Fecha', 'Cultivo', 'Tipo de Insumo', 'Cantidad', 'Lote']],
        body: logs.map(log => [
          log.date,
          log.crop,
          log.type,
          log.amount,
          log.lote
        ]),
      });
    } else {
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.text('No hay registros de fertilización disponibles.', 14, finalY + 25);
    }

    doc.save('finca_digital_reporte.pdf');
  };

  return (
    <div className={styles.container} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>📊 Monitor de Eficiencia y Reportes</h1>
        <p style={{ color: 'var(--gray-500)', marginTop: '8px' }}>
          Ingresa aplicaciones reales de fertilizantes y exporta tus reportes.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1.5fr', gap: '20px', width: '100%' }}>
        
        {/* Formulario de Fertilización */}
        <div className={styles.card} style={{ alignItems: 'flex-start', padding: '24px', textAlign: 'left', height: 'fit-content' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📝</span> Ingresar Fertilización
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)' }}>Cultivo</label>
              <select 
                value={formData.crop} 
                onChange={(e) => setFormData({...formData, crop: e.target.value})}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontFamily: 'inherit' }}
              >
                <option value="Maíz">Maíz</option>
                <option value="Cacao">Cacao</option>
                <option value="Plátano">Plátano</option>
                <option value="Yuca">Yuca</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)' }}>Tipo de Insumo</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontFamily: 'inherit' }}
              >
                <option value="Urea (Nitrógeno)">Urea (Nitrógeno)</option>
                <option value="Cloruro de Potasio">Cloruro de Potasio</option>
                <option value="Fósforo">Fósforo</option>
                <option value="Abono Orgánico">Abono Orgánico</option>
                <option value="Encalado">Encalado</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)' }}>Lote</label>
                <select 
                  value={formData.lote} 
                  onChange={(e) => setFormData({...formData, lote: e.target.value})}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontFamily: 'inherit' }}
                >
                  <option value="Lote 1">Lote 1</option>
                  <option value="Lote 2">Lote 2</option>
                  <option value="Lote 3">Lote 3</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)' }}>Cantidad (kg/L)</label>
                <input 
                  type="text" 
                  placeholder="Ej: 50 kg"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--gray-300)', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <button type="submit" style={{ padding: '12px', background: 'var(--teal)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', marginTop: '8px', cursor: 'pointer' }}>
              Registrar Aplicación
            </button>
          </form>
        </div>

        {/* Historial y Exportación */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.card} style={{ alignItems: 'flex-start', padding: '24px', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Exportación de Datos</h2>
              <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: '4px 0 0 0' }}>Genera PDFs de los balances semanales de producción y fertilización.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleExportPDF} style={{ padding: '8px 16px', background: '#c8860a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📄 Descargar PDF
              </button>
            </div>
          </div>

          <div className={styles.card} style={{ alignItems: 'flex-start', padding: '24px', textAlign: 'left', width: '100%', flex: 1 }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋</span> Historial Reciente
            </h2>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--cream-dark)', textAlign: 'left', color: 'var(--gray-500)' }}>
                    <th style={{ padding: '12px 8px' }}>Fecha</th>
                    <th style={{ padding: '12px 8px' }}>Cultivo</th>
                    <th style={{ padding: '12px 8px' }}>Insumo</th>
                    <th style={{ padding: '12px 8px' }}>Cantidad</th>
                    <th style={{ padding: '12px 8px' }}>Lote</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.fertilizations && data.fertilizations.length > 0 ? (
                    data.fertilizations.slice().reverse().map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                        <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>{log.date}</td>
                        <td style={{ padding: '12px 8px', fontWeight: '600' }}>{log.crop}</td>
                        <td style={{ padding: '12px 8px' }}>{log.type}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--teal)' }}>{log.amount}</td>
                        <td style={{ padding: '12px 8px' }}>{log.lote}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-400)' }}>
                        No hay registros de fertilización aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
