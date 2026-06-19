import React from 'react';
import type { Appointment, Patient, Doctor, Invoice, Item, User } from '../types';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Play, 
  Plus, 
  Layers, 
  Clock, 
  CheckCircle, 
  Activity 
} from 'lucide-react';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  doctors: Doctor[];
  users: User[];
  items: Item[];
  invoices: Invoice[];
  setTab: (tab: string) => void;
  updateAppointmentStatus: (id: number, status: Appointment['Status']) => void;
  openBookingModal: () => void;
  openPatientModal: () => void;
  currentUser?: User | null;
}

export const Dashboard: React.FC<DashboardProps & { currencySymbol?: string }> = ({
  patients,
  appointments,
  doctors,
  users,
  items,
  invoices,
  setTab,
  updateAppointmentStatus,
  openBookingModal,
  openPatientModal,
  currentUser,
  currencySymbol = '$'
}) => {
  // Helper: Find doctor details
  const getDoctorName = (doctorId: number) => {
    const doc = doctors.find(d => d.DoctorId === doctorId);
    const usr = doc ? users.find(u => u.UserId === doc.UserId) : null;
    return usr ? usr.FullName : `Dr. #${doctorId}`;
  };

  // Helper: Find patient details
  const getPatientName = (patientId: number) => {
    const pat = patients.find(p => p.PatientId === patientId);
    return pat ? `${pat.FirstName} ${pat.LastName}` : `Patient #${patientId}`;
  };

  // 1. Calculations for KPIs (matches system date dynamically)
  const todayDate = new Date();
  const year = todayDate.getFullYear();
  const month = String(todayDate.getMonth() + 1).padStart(2, '0');
  const day = String(todayDate.getDate()).padStart(2, '0');
  const targetDateStr = `${year}-${month}-${day}`;

  const getPastDateLabel = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const todayAppointments = appointments.filter(a => a.AppointmentDate.startsWith(targetDateStr));
  
  // Low stock calculation
  const lowStockItemsCount = items.filter(item => item.CurrentStock <= item.ReorderLevel && item.IsActive).length;

  // Revenue calculation (total paid amount)
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.PaidAmount, 0);
  const todaysRevenue = invoices
    .filter(inv => inv.InvoiceDate.startsWith(targetDateStr))
    .reduce((sum, inv) => sum + inv.PaidAmount, 0);

  // Queue lists
  const waitingQueue = todayAppointments.filter(a => a.Status === 'Waiting');
  const consultationQueue = todayAppointments.filter(a => a.Status === 'InConsultation');
  const completedQueue = todayAppointments.filter(a => a.Status === 'Completed' || a.Status === 'Cancelled');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ 
        padding: '24px', 
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(20, 184, 166, 0.05))',
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Welcome back, {currentUser ? currentUser.FullName : 'Dr. Sarah Connor'}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Dental Suite is active. Here is a summary of the clinic's activity for today, {new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => { setTab('appointments'); openBookingModal(); }}>
            <Plus size={16} /> Book Appointment
          </button>
          <button className="btn btn-secondary" onClick={() => { setTab('patients'); openPatientModal(); }}>
            <Plus size={16} /> New Patient
          </button>
        </div>
      </div>

      {/* KPI Dashboard Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* KPI 1 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--status-scheduled-bg)', color: 'var(--status-scheduled-text)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Today's Queue</p>
            <h3 style={{ fontSize: '1.8rem', margin: '4px 0 0' }}>{todayAppointments.length}</h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'rgb(16, 185, 129)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Today's Revenue</p>
            <h3 style={{ fontSize: '1.8rem', margin: '4px 0 0' }}>{currencySymbol}{todaysRevenue.toFixed(2)}</h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'rgb(245, 158, 11)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Low Stock Items</p>
            <h3 style={{ fontSize: '1.8rem', margin: '4px 0 0' }}>
              {lowStockItemsCount}
              {lowStockItemsCount > 0 && <span style={{ fontSize: '0.8rem', color: '#f87171', marginLeft: '6px', fontWeight: 500 }}>Requires attention</span>}
            </h3>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--status-consult-bg)', color: 'var(--status-consult-text)' }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Sales</p>
            <h3 style={{ fontSize: '1.8rem', margin: '4px 0 0' }}>{currencySymbol}{totalRevenue.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Queue and Stats */}
      <div className="dashboard-main-grid">
        
        {/* Left: Patient Clinic Queue Board */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} className="gradient-text-purple-teal" style={{ stroke: 'var(--accent-purple)' }} /> Live Patient Flow
            </h3>
            <span style={{ fontSize: '0.8rem', background: 'var(--border-color)', padding: '4px 10px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              Total Checked In: {todayAppointments.filter(a => a.Status !== 'Cancelled').length}
            </span>
          </div>

          <div className="dashboard-queue-grid">
            
            {/* Column 1: Waiting Room */}
            <div style={{ background: 'rgba(0, 0, 0, 0.1)', padding: '12px', borderRadius: '8px', minHeight: '300px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Waiting Room</span>
                <span className="badge badge-waiting" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{waitingQueue.length}</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {waitingQueue.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '20px' }}>No patients waiting.</p>
                ) : (
                  waitingQueue.map(app => (
                    <div key={app.AppointmentId} className="glass-panel" style={{ padding: '12px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{getPatientName(app.PatientId)}</span>
                        <span style={{ color: 'var(--status-waiting-text)' }}>{app.TokenNumber}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                        With {getDoctorName(app.DoctorId)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button 
                          className="btn btn-teal" 
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={() => updateAppointmentStatus(app.AppointmentId, 'InConsultation')}
                        >
                          <Play size={10} /> Call In
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: In Consultation */}
            <div style={{ background: 'rgba(0, 0, 0, 0.1)', padding: '12px', borderRadius: '8px', minHeight: '300px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>In Consultation</span>
                <span className="badge badge-consultation" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{consultationQueue.length}</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {consultationQueue.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '20px' }}>No active consultations.</p>
                ) : (
                  consultationQueue.map(app => (
                    <div key={app.AppointmentId} className="glass-panel" style={{ padding: '12px', fontSize: '0.85rem', borderLeft: '3px solid var(--accent-purple)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{getPatientName(app.PatientId)}</span>
                        <span style={{ color: 'var(--status-consult-text)' }}>{app.TokenNumber}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                        With {getDoctorName(app.DoctorId)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={() => {
                            // First route to scheduling/consultation tab
                            setTab('appointments');
                          }}
                        >
                          Fill Consultation
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Scheduled / Checked-In Pending */}
            <div style={{ background: 'rgba(0, 0, 0, 0.1)', padding: '12px', borderRadius: '8px', minHeight: '300px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Checked Out Today</span>
                <span className="badge badge-completed" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{completedQueue.length}</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {completedQueue.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '20px' }}>No patients completed yet.</p>
                ) : (
                  completedQueue.map(app => (
                    <div key={app.AppointmentId} className="glass-panel" style={{ padding: '12px', fontSize: '0.85rem', opacity: 0.8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{getPatientName(app.PatientId)}</span>
                        <span className={app.Status === 'Completed' ? 'badge badge-completed' : 'badge badge-cancelled'} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                          {app.Status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Token: {app.TokenNumber} • Doctor: {getDoctorName(app.DoctorId).split(' ').pop()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right: Quick Stats & Alert Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Actions */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Quick Navigation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(139, 92, 246, 0.05)' }}
                onClick={() => setTab('patients')}
              >
                <Users size={16} style={{ color: 'var(--accent-purple)' }} /> Patient Records Directory
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(20, 184, 166, 0.05)' }}
                onClick={() => setTab('inventory')}
              >
                <Layers size={16} style={{ color: 'var(--accent-teal)' }} /> Stock Inventory Control
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(59, 130, 246, 0.05)' }}
                onClick={() => setTab('billing')}
              >
                <DollarSign size={16} style={{ color: 'var(--accent-blue)' }} /> Invoicing & Receipts
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setTab('accounting')}
              >
                <CheckCircle size={16} /> Ledger & Accounts Journal
              </button>
            </div>
          </div>

          {/* Low Stock Items Warnings */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: 'rgb(245, 158, 11)' }} /> Inventory Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.filter(i => i.CurrentStock <= i.ReorderLevel).map(item => (
                <div key={item.ItemId} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.8rem',
                  padding: '8px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '6px'
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.ItemName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Batch: {item.BatchNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--status-waiting-text)', fontWeight: 600 }}>Stock: {item.CurrentStock} {item.UnitId === 3 ? 'Tubes' : 'Boxes'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Reorder at {item.ReorderLevel}</div>
                  </div>
                </div>
              ))}
              {items.filter(i => i.CurrentStock > i.ReorderLevel).length === items.length && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>All materials are well stocked.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Demographic & Monthly Analytics Charts Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Clinic Weekly Performance Analysis</h3>
        <div className="dashboard-charts-grid">
          
          {/* Chart 1: SVG Bar Chart for appointments per day */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Appointments Handled (Last 6 Days)</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px', padding: '10px 20px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px' }}>
              {[
                { label: getPastDateLabel(5), count: 6, pct: 40, active: false },
                { label: getPastDateLabel(4), count: 9, pct: 60, active: false },
                { label: getPastDateLabel(3), count: 12, pct: 80, active: false },
                { label: getPastDateLabel(2), count: 4, pct: 26, active: false },
                { label: getPastDateLabel(1), count: 15, pct: 100, active: false },
                { label: getPastDateLabel(0), count: todayAppointments.length, pct: (todayAppointments.length / 15) * 100, active: true },
              ].map((bar, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{bar.count}</span>
                  <div style={{ 
                    width: '30px', 
                    height: `${bar.pct}px`, 
                    background: bar.active 
                      ? 'linear-gradient(to top, var(--accent-teal), #2dd4bf)' 
                      : 'linear-gradient(to top, var(--accent-purple), #a78bfa)', 
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.5s ease'
                  }}></div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Department breakdown Horizontal bars */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Revenue Breakdown by Specialty</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '12px 20px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', height: '150px', justifyContent: 'center' }}>
              {[
                { name: 'General Dentistry', rev: 925, pct: 45, color: 'var(--accent-purple)' },
                { name: 'Orthodontics', rev: 1120, pct: 54, color: 'var(--accent-teal)' },
                { name: 'Endodontics', rev: 450, pct: 22, color: 'var(--accent-blue)' }
              ].map((dep, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{dep.name}</span>
                    <span style={{ fontWeight: 600, color: dep.color }}>{currencySymbol}{dep.rev}.00</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${dep.pct}%`, height: '100%', background: dep.color, borderRadius: '99px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
