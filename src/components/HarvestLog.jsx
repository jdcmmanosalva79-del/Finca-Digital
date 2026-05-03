import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './HarvestLog.module.css';

export default function HarvestLog() {
  const { data } = useAppContext();
  const [ciclosFinalizados, setCiclosFinalizados] = useState([]);
  const [ciclosActivos, setCiclosActivos] = useState([]);

  useEffect(() => {
    // Escuchar finalizados
    const qFin = query(collection(db, 'crops'), where('estado', '==', 'finalizado'));
    const unsubFin = onSnapshot(qFin, (snap) => {
      setCiclosFinalizados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Escuchar activos
    const qAct = query(collection(db, 'crops'), where('estado', '==', 'activo'));
    const unsubAct = onSnapshot(qAct, (snap) => {
      setCiclosActivos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubFin(); unsubAct(); };
  }, []);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(26, 95, 90); // Teal Dark
    doc.text('Reporte Semanal - Finca Digital', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-VE')}`, 14, 32);
    if (data?.user?.nombre) {
      doc.text(`Generado por: ${data.user.nombre} (${data.user.rol || 'Administrador'})`, 14, 38);
    }

    let finalY = 48;

    // 1. Siembras Activas
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('1. Siembras Activas en la Finca:', 14, finalY);
    
    if (ciclosActivos.length > 0) {
      autoTable(doc, {
        startY: finalY + 5,
        headStyles: { fillColor: [42, 125, 111] }, // Teal
        head: [['Rubro', 'Lote', 'Hectáreas', 'Fecha Siembra', 'Fin Estimado']],
        body: ciclosActivos.map(c => [
          c.rubro,
          c.lote,
          `${c.hectareas} ha`,
          c.fechaSiembra?.toDate?.()?.toLocaleDateString('es-VE') || '—',
          c.fechaFinalizacion?.toDate?.()?.toLocaleDateString('es-VE') || '—'
        ]),
      });
      finalY = doc.lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(11);
      doc.text('No hay siembras activas.', 14, finalY + 10);
      finalY += 20;
    }

    // 2. Ciclos Finalizados (Rendimientos)
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('2. Ciclos Finalizados (Cosechas):', 14, finalY);

    if (ciclosFinalizados.length > 0) {
      autoTable(doc, {
        startY: finalY + 5,
        headStyles: { fillColor: [200, 134, 10] }, // Gold
        head: [['Rubro', 'Lote', 'Ha', 'Cosechado El', 'Rendimiento Total', 'KG/Ha']],
        body: ciclosFinalizados.map(c => {
          const kgHa = c.rendimientoKg && c.hectareas ? Math.round(c.rendimientoKg / c.hectareas) : '—';
          return [
            c.rubro,
            c.lote,
            `${c.hectareas}`,
            c.finalizadoEn?.toDate?.()?.toLocaleDateString('es-VE') || '—',
            `${c.rendimientoKg?.toLocaleString('es-VE') || 0} kg`,
            `${typeof kgHa === 'number' ? kgHa.toLocaleString('es-VE') : kgHa} kg/ha`
          ];
        }),
      });
      finalY = doc.lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(11);
      doc.text('No hay ciclos finalizados registrados.', 14, finalY + 10);
      finalY += 20;
    }

    // 3. Historial de Fertilización (Si existe)
    if (data?.fertilizations && data.fertilizations.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('3. Registro de Fertilización Aplicada:', 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        headStyles: { fillColor: [107, 76, 42] }, // Brown
        head: [['Fecha', 'Cultivo', 'Insumo', 'Cantidad', 'Lote']],
        body: data.fertilizations.map(log => [
          log.date,
          log.crop,
          log.type,
          log.amount,
          log.lote
        ]),
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Finca Digital - Reporte Semanal - Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Reporte_Semanal_Finca_${new Date().getTime()}.pdf`);
  };

  return (
    <div className={styles.wrapper}>
      {/* ── Header ── */}
      <div className={styles.headerCard}>
        <div className={styles.titleBox}>
          <h1>📊 Reportes y Exportación</h1>
          <p>Genera el reporte semanal consolidado en PDF para revisión gerencial.</p>
        </div>
        <button className={styles.exportBtn} onClick={handleExportPDF}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          Descargar PDF Semanal
        </button>
      </div>

      {/* ── Siembras Activas ── */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span style={{ fontSize: '24px' }}>🌱</span> Siembras Activas en Campo
        </h2>
        
        {ciclosActivos.length === 0 ? (
          <p className={styles.emptyText}>No hay siembras activas en este momento.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rubro</th>
                  <th>Lote</th>
                  <th>Hectáreas</th>
                  <th>Fecha Siembra</th>
                  <th>Fin Estimado</th>
                </tr>
              </thead>
              <tbody>
                {ciclosActivos.map(c => {
                  const fechaSiembra = c.fechaSiembra?.toDate?.()?.toLocaleDateString('es-VE') || '—';
                  const fechaFin = c.fechaFinalizacion?.toDate?.()?.toLocaleDateString('es-VE') || '—';
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '600' }}>
                        {c.rubro === 'Maíz' ? '🌽' : c.rubro === 'Cacao' ? '🍫' : c.rubro === 'Yuca' ? '🥔' : '🍌'} {c.rubro}
                      </td>
                      <td>{c.lote}</td>
                      <td><span className={`${styles.badge} ${styles.badgeActivo}`}>{c.hectareas} ha</span></td>
                      <td style={{ color: 'var(--gray-600)' }}>{fechaSiembra}</td>
                      <td style={{ color: 'var(--teal-dark)', fontWeight: '600' }}>{fechaFin}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Historial de Rendimientos ── */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <span style={{ fontSize: '24px' }}>🏁</span> Rendimiento de Cosechas Anteriores
        </h2>
        {ciclosFinalizados.length === 0 ? (
          <p className={styles.emptyText}>Aún no hay ciclos finalizados para mostrar rendimientos.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rubro</th>
                  <th>Lote</th>
                  <th>Fecha Fin</th>
                  <th>Rendimiento Total</th>
                  <th>Eficiencia (KG/Ha)</th>
                </tr>
              </thead>
              <tbody>
                {ciclosFinalizados.map(c => {
                  const fechaFinalizado = c.finalizadoEn?.toDate?.()?.toLocaleDateString('es-VE') || '—';
                  const kgHa = c.rendimientoKg && c.hectareas ? Math.round(c.rendimientoKg / c.hectareas) : '—';
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '600' }}>
                        {c.rubro === 'Maíz' ? '🌽' : c.rubro === 'Cacao' ? '🍫' : c.rubro === 'Yuca' ? '🥔' : '🍌'} {c.rubro}
                      </td>
                      <td>{c.lote}</td>
                      <td style={{ color: 'var(--gray-600)' }}>{fechaFinalizado}</td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeFin}`} style={{ fontSize: '13px' }}>
                          {c.rendimientoKg?.toLocaleString('es-VE')} kg
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeKg}`}>
                          {typeof kgHa === 'number' ? kgHa.toLocaleString('es-VE') : kgHa} kg/ha
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
