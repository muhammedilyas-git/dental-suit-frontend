import React, { useState } from 'react';
import type { Appointment, Patient, Doctor, Consultation, Item, Prescription, User } from '../types';
import { Calendar, Clock, Plus, BookOpen, AlertCircle, Play, Clipboard, CheckCircle, X, Pill, Search, Edit } from 'lucide-react';

interface AppointmentsTabProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  users: User[];
  items: Item[];
  addAppointment: (appointment: Omit<Appointment, 'AppointmentId' | 'TokenNumber' | 'CreatedAt'>) => void;
  updateAppointment: (id: number, appointment: Appointment) => void;
  updateAppointmentStatus: (id: number, status: Appointment['Status']) => void;
  addConsultation: (
    consultation: Omit<Consultation, 'ConsultationId' | 'CreatedAt'>, 
    prescriptions: Omit<Prescription, 'PrescriptionId' | 'ConsultationId'>[]
  ) => void;
  currentUser: User;
  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;
  currencySymbol?: string;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  appointments,
  patients,
  doctors,
  users,
  items,
  addAppointment,
  updateAppointment,
  updateAppointmentStatus,
  addConsultation,
  currentUser,
  isBookingModalOpen,
  setIsBookingModalOpen,
  currencySymbol = '$'
}) => {
  const getDoctorName = (doctorId: number) => {
    const doc = doctors.find(d => d.DoctorId === doctorId);
    const usr = doc ? users.find(u => u.UserId === doc.UserId) : null;
    return usr ? usr.FullName : `Dr. #${doctorId}`;
  };

  const getPatientName = (patientId: number) => {
    const pat = patients.find(p => p.PatientId === patientId);
    return pat ? `${pat.FirstName} ${pat.LastName}` : `Patient #${patientId}`;
  };

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [editAppointmentId, setEditAppointmentId] = useState<number | null>(null);

  const filteredAppointments = appointments.filter(app => {
    const patientName = getPatientName(app.PatientId).toLowerCase();
    const doctorName = getDoctorName(app.DoctorId).toLowerCase();
    const notes = (app.Notes || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = patientName.includes(search) || doctorName.includes(search) || notes.includes(search);

    const matchesStatus = statusFilter === 'All' || app.Status === statusFilter;
    const matchesDoctor = doctorFilter === 'All' || app.DoctorId === parseInt(doctorFilter);

    let matchesDate = true;
    if (dateFilter !== 'All') {
      const appDate = new Date(app.AppointmentDate);
      const today = new Date();
      const appDateOnly = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (dateFilter === 'Today') {
        matchesDate = appDateOnly.getTime() === todayDateOnly.getTime();
      } else if (dateFilter === 'Upcoming') {
        matchesDate = appDateOnly.getTime() > todayDateOnly.getTime();
      } else if (dateFilter === 'Past') {
        matchesDate = appDateOnly.getTime() < todayDateOnly.getTime();
      }
    }

    return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
  }).sort((a, b) => new Date(b.AppointmentDate).getTime() - new Date(a.AppointmentDate).getTime());
  
  // Consultation Form States
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultForm, setConsultForm] = useState({
    Symptoms: '',
    Diagnosis: '',
    Notes: '',
    TreatmentAdvice: '',
    FollowUpDate: '',
    ConsultationCharges: 50.00 // Default consultation charge
  });

  // Prescriptions state inside consultation
  const [prescriptions, setPrescriptions] = useState<(Omit<Prescription, 'PrescriptionId' | 'ConsultationId'> & { _itemName: string })[]>([]);

  // Add prescription item form
  const [prescItem, setPrescItem] = useState({
    ItemId: '',
    ExternalMedicineName: '',
    Dosage: '1 tablet twice a day',
    Duration: '5 Days',
    Instructions: 'Take after food',
    IsExternalPurchase: false,
    Quantity: 1
  });

  const [bookingForm, setBookingForm] = useState({
    PatientId: '',
    DoctorId: '',
    AppointmentDate: '',
    Notes: ''
  });

  const handleEditAppointment = (app: Appointment) => {
    setEditAppointmentId(app.AppointmentId);
    setBookingForm({
      PatientId: app.PatientId.toString(),
      DoctorId: app.DoctorId.toString(),
      AppointmentDate: app.AppointmentDate.split('.')[0].replace('Z', ''),
      Notes: app.Notes || ''
    });
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.PatientId || !bookingForm.DoctorId || !bookingForm.AppointmentDate) {
      alert('Patient, Doctor, and Appointment Date are required.');
      return;
    }
    if (editAppointmentId) {
      const existing = appointments.find(a => a.AppointmentId === editAppointmentId);
      updateAppointment(editAppointmentId, {
        AppointmentId: editAppointmentId,
        PatientId: parseInt(bookingForm.PatientId),
        DoctorId: parseInt(bookingForm.DoctorId),
        AppointmentDate: bookingForm.AppointmentDate,
        Status: existing ? existing.Status : 'Scheduled',
        Notes: bookingForm.Notes,
        CreatedAt: existing ? existing.CreatedAt : ''
      });
    } else {
      addAppointment({
        PatientId: parseInt(bookingForm.PatientId),
        DoctorId: parseInt(bookingForm.DoctorId),
        AppointmentDate: bookingForm.AppointmentDate,
        Status: 'Scheduled',
        Notes: bookingForm.Notes
      });
    }
    // Reset form
    setBookingForm({
      PatientId: '',
      DoctorId: '',
      AppointmentDate: '',
      Notes: ''
    });
    setEditAppointmentId(null);
    setIsBookingModalOpen(false);
  };

  const handleAddPrescription = () => {
    if (!prescItem.IsExternalPurchase && !prescItem.ItemId) {
      alert('Please select an inventory item or check External Purchase.');
      return;
    }
    if (prescItem.IsExternalPurchase && !prescItem.ExternalMedicineName) {
      alert('Please enter the name of the external medicine.');
      return;
    }

    let itemName = '';
    if (!prescItem.IsExternalPurchase) {
      const selectedItem = items.find(i => i.ItemId === parseInt(prescItem.ItemId));
      if (selectedItem) {
        itemName = selectedItem.ItemName;
        // Check stock
        if (selectedItem.CurrentStock < prescItem.Quantity) {
          alert(`Warning: Insufficient stock. Only ${selectedItem.CurrentStock} available.`);
          return;
        }
      }
    } else {
      itemName = prescItem.ExternalMedicineName;
    }

    setPrescriptions(prev => [...prev, {
      ItemId: prescItem.IsExternalPurchase ? undefined : parseInt(prescItem.ItemId),
      ExternalMedicineName: prescItem.IsExternalPurchase ? prescItem.ExternalMedicineName : '',
      Dosage: prescItem.Dosage,
      Duration: prescItem.Duration,
      Instructions: prescItem.Instructions,
      IsExternalPurchase: prescItem.IsExternalPurchase,
      Quantity: prescItem.Quantity,
      _itemName: itemName
    }]);

    // Reset presc form
    setPrescItem({
      ItemId: '',
      ExternalMedicineName: '',
      Dosage: '1 tablet twice a day',
      Duration: '5 Days',
      Instructions: 'Take after food',
      IsExternalPurchase: false,
      Quantity: 1
    });
  };

  const handleRemovePrescription = (idx: number) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentId) return;

    addConsultation(
      {
        AppointmentId: selectedAppointmentId,
        Symptoms: consultForm.Symptoms,
        Diagnosis: consultForm.Diagnosis,
        Notes: consultForm.Notes,
        TreatmentAdvice: consultForm.TreatmentAdvice,
        FollowUpDate: consultForm.FollowUpDate || undefined,
        ConsultationCharges: Number(consultForm.ConsultationCharges)
      },
      prescriptions.map(p => ({
        ItemId: p.ItemId,
        ExternalMedicineName: p.ExternalMedicineName,
        Dosage: p.Dosage,
        Duration: p.Duration,
        Instructions: p.Instructions,
        IsExternalPurchase: p.IsExternalPurchase,
        Quantity: p.Quantity
      }))
    );

    // Update appointment status to Completed
    updateAppointmentStatus(selectedAppointmentId, 'Completed');

    // Reset Forms
    setConsultForm({
      Symptoms: '',
      Diagnosis: '',
      Notes: '',
      TreatmentAdvice: '',
      FollowUpDate: '',
      ConsultationCharges: 50.00
    });
    setPrescriptions([]);
    setIsConsultModalOpen(false);
    setSelectedAppointmentId(null);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Clinic Appointment Queue Scheduler</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Organize queue statuses and fill patient consultation records.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsBookingModalOpen(true)}>
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {/* Main Grid: Appointment Schedule and Details */}
      <div className="appointments-main-grid">
        
        {/* Scheduler List Table */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--accent-purple)' }} /> Agenda Queue List
          </h3>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '2 1 200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search patient, dentist, notes..." 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="input-field" 
              style={{ flex: '1 1 120px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Waiting">Waiting Room</option>
              <option value="InConsultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select 
              className="input-field" 
              style={{ flex: '1 1 120px' }}
              value={doctorFilter}
              onChange={e => setDoctorFilter(e.target.value)}
            >
              <option value="All">All Dentists</option>
              {doctors.map(d => (
                <option key={d.DoctorId} value={d.DoctorId}>{getDoctorName(d.DoctorId)}</option>
              ))}
            </select>
            <select 
              className="input-field" 
              style={{ flex: '1 1 120px' }}
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Past">Past</option>
            </select>
          </div>

          <div className="table-container">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient Name</th>
                  <th>Dentist</th>
                  <th>Appointment Date & Time</th>
                  <th>Queue Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No appointments found.</td>
                  </tr>
                ) : (
                  filteredAppointments.map(app => (
                    <tr 
                      key={app.AppointmentId}
                      onClick={() => setSelectedAppointmentId(app.AppointmentId)}
                      style={{ cursor: 'pointer', background: selectedAppointmentId === app.AppointmentId ? 'rgba(139, 92, 246, 0.08)' : 'transparent' }}
                    >
                      <td style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{app.TokenNumber || 'N/A'}</td>
                      <td style={{ fontWeight: 600 }}>{getPatientName(app.PatientId)}</td>
                      <td>{getDoctorName(app.DoctorId).split(' ').pop()}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600 }}>
                            {new Date(app.AppointmentDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {new Date(app.AppointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${app.Status.toLowerCase()}`}>{app.Status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Detail Card / Quick Status Adjuster */}
        <div>
          {selectedAppointmentId ? (() => {
            const app = appointments.find(a => a.AppointmentId === selectedAppointmentId);
            if (!app) return null;
            return (
              <div className="glass-panel fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge badge-scheduled" style={{ fontSize: '0.65rem' }}>
                      Token: {app.TokenNumber || 'T-N/A'}
                    </span>
                    {currentUser.RoleId === 1 && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleEditAppointment(app)}
                      >
                        <Edit size={12} /> Edit
                      </button>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.25rem' }}>{getPatientName(app.PatientId)}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                    Appt: {new Date(app.AppointmentDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(app.AppointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Assigned to:</span>
                    <span style={{ fontWeight: 600 }}>{getDoctorName(app.DoctorId)}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Notes:</span>
                    <span>{app.Notes || 'No notes provided.'}</span>
                  </div>
                </div>

                {/* Status Transitions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Update Clinic Status</h4>
                  
                  {app.Status === 'Scheduled' && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ background: 'var(--status-waiting-bg)', color: 'var(--status-waiting-text)', border: 'none' }}
                      onClick={() => updateAppointmentStatus(app.AppointmentId, 'Waiting')}
                    >
                      <Clock size={16} /> Mark as Checked-In / Waiting
                    </button>
                  )}

                  {app.Status === 'Waiting' && (
                    <button 
                      className="btn btn-teal"
                      onClick={() => updateAppointmentStatus(app.AppointmentId, 'InConsultation')}
                    >
                      <Play size={16} /> Call in to Dental Chair
                    </button>
                  )}

                  {app.Status === 'InConsultation' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setIsConsultModalOpen(true)}
                    >
                      <Clipboard size={16} /> Open Clinical Consultation Chart
                    </button>
                  )}

                  {app.Status !== 'Completed' && app.Status !== 'Cancelled' && (
                    <button 
                      className="btn btn-danger" 
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}
                      onClick={() => updateAppointmentStatus(app.AppointmentId, 'Cancelled')}
                    >
                      Cancel Appointment
                    </button>
                  )}

                  {app.Status === 'Completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-teal)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <CheckCircle size={16} /> Consultation complete. Invoiced generated in billing tab.
                    </div>
                  )}

                  {app.Status === 'Cancelled' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>
                      <AlertCircle size={16} /> This appointment was cancelled.
                    </div>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={36} style={{ display: 'block', margin: '0 auto 12px', stroke: 'var(--text-muted)' }} />
              <p style={{ fontSize: '0.85rem' }}>Select an appointment from the queue list to adjust status or log diagnostic consultations.</p>
            </div>
          )}
        </div>

      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>{editAppointmentId ? 'Update Scheduled Appointment' : 'Schedule Patient Appointment'}</h2>
              <button 
                onClick={() => {
                  setEditAppointmentId(null);
                  setIsBookingModalOpen(false);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-text">Select Patient *</label>
                <select 
                  name="PatientId" 
                  className="input-field" 
                  required 
                  value={bookingForm.PatientId}
                  onChange={e => setBookingForm(prev => ({ ...prev, PatientId: e.target.value }))}
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.PatientId} value={p.PatientId}>{p.FirstName} {p.LastName} ({p.Mobile})</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Assign Dentist *</label>
                  <select 
                    name="DoctorId" 
                    className="input-field" 
                    required 
                    value={bookingForm.DoctorId}
                    onChange={e => setBookingForm(prev => ({ ...prev, DoctorId: e.target.value }))}
                  >
                    <option value="">-- Choose Dentist --</option>
                    {doctors.map(d => (
                      <option key={d.DoctorId} value={d.DoctorId}>{getDoctorName(d.DoctorId)} ({d.Specialization})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    name="AppointmentDate" 
                    className="input-field" 
                    required 
                    value={bookingForm.AppointmentDate}
                    onChange={e => setBookingForm(prev => ({ ...prev, AppointmentDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Scheduler Notes / Special Instructions</label>
                <textarea 
                  name="Notes" 
                  className="input-field" 
                  style={{ height: '70px', resize: 'none' }}
                  placeholder="Reason for visit, allergies, preferred language..."
                  value={bookingForm.Notes}
                  onChange={e => setBookingForm(prev => ({ ...prev, Notes: e.target.value }))}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setEditAppointmentId(null);
                  setIsBookingModalOpen(false);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editAppointmentId ? 'Save Changes' : 'Schedule Appointment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consultation & Prescriptions Charting Modal */}
      {isConsultModalOpen && selectedAppointmentId && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Clinical Consultation & Prescription Chart</h2>
              <button 
                onClick={() => setIsConsultModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConsultationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="grid-2">
                <div>
                  <label className="label-text">Chief complaints *</label>
                  <textarea 
                    className="input-field" 
                    style={{ height: '70px', resize: 'none' }}
                    required 
                    placeholder="throbbing pain, sensitivity, bleeding gums..."
                    value={consultForm.Symptoms}
                    onChange={e => setConsultForm(prev => ({ ...prev, Symptoms: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-text">Clinical Diagnosis *</label>
                  <textarea 
                    className="input-field" 
                    style={{ height: '70px', resize: 'none' }}
                    required 
                    placeholder="deep caries, chronic periodontitis, pulpitis..."
                    value={consultForm.Diagnosis}
                    onChange={e => setConsultForm(prev => ({ ...prev, Diagnosis: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Treatment Advice</label>
                  <textarea 
                    className="input-field" 
                    style={{ height: '60px', resize: 'none' }}
                    placeholder="avoid hot foods, warm saline mouth rinses..."
                    value={consultForm.TreatmentAdvice}
                    onChange={e => setConsultForm(prev => ({ ...prev, TreatmentAdvice: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-text">Internal Clinical Notes</label>
                  <textarea 
                    className="input-field" 
                    style={{ height: '60px', resize: 'none' }}
                    placeholder="sensitive patient, need to monitor root canal margins..."
                    value={consultForm.Notes}
                    onChange={e => setConsultForm(prev => ({ ...prev, Notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Consultation Charge ({currencySymbol}) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input-field" 
                    required 
                    value={consultForm.ConsultationCharges}
                    onChange={e => setConsultForm(prev => ({ ...prev, ConsultationCharges: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="label-text">Follow Up Date (Optional)</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={consultForm.FollowUpDate}
                    onChange={e => setConsultForm(prev => ({ ...prev, FollowUpDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Prescription Builder */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Pill size={16} style={{ color: 'var(--accent-purple)' }} /> Prescribe Medications
                </h3>

                {/* Added Prescription Items Table */}
                {prescriptions.length > 0 && (
                  <div style={{ marginBottom: '14px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', padding: '10px' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Dosage</th>
                          <th>Duration</th>
                          <th>Instructions</th>
                          <th>Qty</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((pr, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{pr._itemName} {pr.IsExternalPurchase && '(External)'}</td>
                            <td>{pr.Dosage}</td>
                            <td>{pr.Duration}</td>
                            <td>{pr.Instructions}</td>
                            <td>{pr.Quantity}</td>
                            <td>
                              <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                onClick={() => handleRemovePrescription(idx)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Prescription Input Form */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                  gap: '10px',
                  alignItems: 'end',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  padding: '12px',
                  borderRadius: '6px'
                }}>
                  
                  <div style={{ flex: 2 }}>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Select In-Stock Item</label>
                    <select 
                      className="input-field" 
                      disabled={prescItem.IsExternalPurchase}
                      value={prescItem.ItemId}
                      onChange={e => setPrescItem(prev => ({ ...prev, ItemId: e.target.value }))}
                    >
                      <option value="">-- Choose Item --</option>
                      {items.filter(i => i.IsActive).map(i => (
                        <option key={i.ItemId} value={i.ItemId}>{i.ItemName} (Stock: {i.CurrentStock})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>
                      <input 
                        type="checkbox" 
                        style={{ marginRight: '4px' }}
                        checked={prescItem.IsExternalPurchase}
                        onChange={e => setPrescItem(prev => ({ ...prev, IsExternalPurchase: e.target.checked, ItemId: '' }))}
                      /> External Purchase
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Amoxicillin" 
                      className="input-field"
                      disabled={!prescItem.IsExternalPurchase}
                      value={prescItem.ExternalMedicineName}
                      onChange={e => setPrescItem(prev => ({ ...prev, ExternalMedicineName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Dosage</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={prescItem.Dosage}
                      onChange={e => setPrescItem(prev => ({ ...prev, Dosage: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Duration</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={prescItem.Duration}
                      onChange={e => setPrescItem(prev => ({ ...prev, Duration: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      className="input-field" 
                      value={prescItem.Quantity}
                      onChange={e => setPrescItem(prev => ({ ...prev, Quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Instructions</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={prescItem.Instructions}
                      onChange={e => setPrescItem(prev => ({ ...prev, Instructions: e.target.value }))}
                    />
                  </div>

                  <button type="button" className="btn btn-teal" onClick={handleAddPrescription}>
                    Add Line
                  </button>

                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsConsultModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Consultation & Discharge Patient</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
