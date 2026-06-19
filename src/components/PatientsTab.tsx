import React, { useState } from 'react';
import type { Patient, Appointment, Treatment, Invoice, Ledger, Doctor, User } from '../types';
import { Search, UserPlus, AlertCircle, FileText, Calendar, Shield, CreditCard, ChevronRight, X, Edit } from 'lucide-react';

interface PatientsTabProps {
  patients: Patient[];
  appointments: Appointment[];
  treatments: Treatment[];
  invoices: Invoice[];
  ledgers: Ledger[];
  doctors: Doctor[];
  users: User[];
  addPatient: (patient: Omit<Patient, 'PatientId' | 'CreatedAt'>) => void;
  updatePatient: (patientId: number, patient: Patient) => void;
  currentUser: User;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  currencySymbol?: string;
}

export const PatientsTab: React.FC<PatientsTabProps> = ({
  patients,
  appointments,
  treatments,
  invoices,
  ledgers,
  doctors,
  users,
  addPatient,
  updatePatient,
  currentUser,
  isAddModalOpen,
  setIsAddModalOpen,
  currencySymbol = '$'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [allergyFilter, setAllergyFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [editPatientId, setEditPatientId] = useState<number | null>(null);

  // Form states for new patient
  const [formData, setFormData] = useState({
    FirstName: '',
    LastName: '',
    Gender: 'Male',
    DOB: '',
    Mobile: '',
    Email: '',
    Address: '',
    MedicalHistory: '',
    Allergies: '',
    EmergencyContactName: '',
    EmergencyContactNumber: '',
    InsuranceProvider: '',
    InsurancePolicyNumber: '',
    PhotoUrl: ''
  });

  const handleEditPatient = (pat: Patient) => {
    setEditPatientId(pat.PatientId);
    setFormData({
      FirstName: pat.FirstName,
      LastName: pat.LastName,
      Gender: pat.Gender || 'Male',
      DOB: pat.DOB ? pat.DOB.split('T')[0] : '',
      Mobile: pat.Mobile,
      Email: pat.Email || '',
      Address: pat.Address || '',
      MedicalHistory: pat.MedicalHistory || '',
      Allergies: pat.Allergies || '',
      EmergencyContactName: pat.EmergencyContactName || '',
      EmergencyContactNumber: pat.EmergencyContactNumber || '',
      InsuranceProvider: pat.InsuranceProvider || '',
      InsurancePolicyNumber: pat.InsurancePolicyNumber || '',
      PhotoUrl: pat.PhotoUrl || ''
    });
    setIsAddModalOpen(true);
  };

  const getDoctorName = (doctorId: number) => {
    const doc = doctors.find(d => d.DoctorId === doctorId);
    const usr = doc ? users.find(u => u.UserId === doc.UserId) : null;
    return usr ? usr.FullName : `Dr. #${doctorId}`;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.FirstName || !formData.LastName || !formData.Mobile) {
      alert('First Name, Last Name and Mobile Number are required.');
      return;
    }
    if (editPatientId) {
      updatePatient(editPatientId, { ...formData, PatientId: editPatientId } as Patient);
    } else {
      addPatient(formData);
    }
    // Reset Form
    setFormData({
      FirstName: '',
      LastName: '',
      Gender: 'Male',
      DOB: '',
      Mobile: '',
      Email: '',
      Address: '',
      MedicalHistory: '',
      Allergies: '',
      EmergencyContactName: '',
      EmergencyContactNumber: '',
      InsuranceProvider: '',
      InsurancePolicyNumber: '',
      PhotoUrl: ''
    });
    setEditPatientId(null);
    setIsAddModalOpen(false);
  };

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const fullName = `${p.FirstName} ${p.LastName}`.toLowerCase();
    const phone = p.Mobile.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(search) || phone.includes(search);

    const matchesGender = genderFilter === 'All' || p.Gender === genderFilter;

    let matchesAllergy = true;
    if (allergyFilter === 'HasAllergies') {
      matchesAllergy = !!p.Allergies && p.Allergies.trim().length > 0;
    } else if (allergyFilter === 'NoAllergies') {
      matchesAllergy = !p.Allergies || p.Allergies.trim().length === 0;
    }

    let matchesAge = true;
    if (ageFilter !== 'All') {
      const age = p.DOB ? new Date().getFullYear() - new Date(p.DOB).getFullYear() : null;
      if (age === null) {
        matchesAge = false;
      } else {
        if (ageFilter === 'Children') matchesAge = age <= 12;
        else if (ageFilter === 'Teens') matchesAge = age >= 13 && age <= 19;
        else if (ageFilter === 'Adults') matchesAge = age >= 20 && age <= 64;
        else if (ageFilter === 'Seniors') matchesAge = age >= 65;
      }
    }

    return matchesSearch && matchesGender && matchesAllergy && matchesAge;
  }).sort((a, b) => b.PatientId - a.PatientId);

  const selectedPatient = patients.find(p => p.PatientId === selectedPatientId);
  const patientAppointments = appointments.filter(a => a.PatientId === selectedPatientId).sort((a, b) => new Date(b.AppointmentDate).getTime() - new Date(a.AppointmentDate).getTime());
  const patientTreatments = treatments.filter(t => t.PatientId === selectedPatientId).sort((a, b) => b.TreatmentId - a.TreatmentId);
  const patientInvoices = invoices.filter(i => i.PatientId === selectedPatientId).sort((a, b) => b.InvoiceId - a.InvoiceId);
  const patientLedger = ledgers.find(l => l.ReferenceType === 'Customer' && l.ReferenceId === selectedPatientId);

  return (
    <div className={`fade-in patients-main-grid ${selectedPatientId ? '' : 'single-column'}`}>
      
      {/* Directory Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.4rem' }}>Patient Directory</h2>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={16} /> Add Patient
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '2 1 200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search patients by name or mobile..." 
              className="input-field" 
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <select 
            className="input-field" 
            style={{ flex: '1 1 120px' }}
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <select 
            className="input-field" 
            style={{ flex: '1 1 120px' }}
            value={allergyFilter}
            onChange={e => setAllergyFilter(e.target.value)}
          >
            <option value="All">All Allergies</option>
            <option value="HasAllergies">Has Allergies</option>
            <option value="NoAllergies">No Allergies</option>
          </select>
          <select 
            className="input-field" 
            style={{ flex: '1 1 120px' }}
            value={ageFilter}
            onChange={e => setAgeFilter(e.target.value)}
          >
            <option value="All">All Ages</option>
            <option value="Children">Children (0-12)</option>
            <option value="Teens">Teens (13-19)</option>
            <option value="Adults">Adults (20-64)</option>
            <option value="Seniors">Seniors (65+)</option>
          </select>
        </div>

        {/* Patients Table */}
        <div className="table-container">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Mobile</th>
                <th>Gender/Age</th>
                <th>Allergies</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No patients found.</td>
                </tr>
              ) : (
                filteredPatients.map(pat => {
                  const age = pat.DOB ? new Date().getFullYear() - new Date(pat.DOB).getFullYear() : 'N/A';
                  return (
                    <tr 
                      key={pat.PatientId} 
                      onClick={() => setSelectedPatientId(pat.PatientId)}
                      style={{ cursor: 'pointer', background: selectedPatientId === pat.PatientId ? 'rgba(139, 92, 246, 0.08)' : 'transparent' }}
                    >
                      <td style={{ fontWeight: 600 }}>{pat.FirstName} {pat.LastName}</td>
                      <td>{pat.Mobile}</td>
                      <td>{pat.Gender} ({age} yrs)</td>
                      <td>
                        {pat.Allergies ? (
                          <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 500 }}>
                            <AlertCircle size={12} /> {pat.Allergies.split(',')[0]}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                      <td>
                        <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Patient Details / Profile */}
      {selectedPatientId && selectedPatient && (
        <div className="glass-panel fade-in" style={{ padding: '24px', position: 'relative' }}>
          
          {/* Close button */}
          <button 
            onClick={() => setSelectedPatientId(null)}
            style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>

          {/* Profile Header */}
          <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 700
            }}>
              {selectedPatient.FirstName[0]}{selectedPatient.LastName[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{selectedPatient.FirstName} {selectedPatient.LastName}</h2>
                {currentUser.RoleId === 1 && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '24px' }}
                    onClick={() => handleEditPatient(selectedPatient)}
                  >
                    <Edit size={14} /> Edit Patient
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Mobile: {selectedPatient.Mobile}</span>
                <span>Email: {selectedPatient.Email || 'No Email'}</span>
              </div>
            </div>
          </div>

          {/* Allergies and Warnings Alert */}
          {selectedPatient.Allergies && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} />
              <span><strong>Medical Alert / Allergies:</strong> {selectedPatient.Allergies}</span>
            </div>
          )}

          {/* Grid Information */}
          <div className="patients-details-grid">
            
            {/* Demographics & Insurance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Demographic Information</h3>
              <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gender:</span>
                <span>{selectedPatient.Gender || 'N/A'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Date of Birth:</span>
                <span>{selectedPatient.DOB || 'N/A'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Address:</span>
                <span>{selectedPatient.Address || 'N/A'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Medical History:</span>
                <span>{selectedPatient.MedicalHistory || 'No recorded history'}</span>
              </div>

              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginTop: '10px' }}>
                <Shield size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> Insurance Cover
              </h3>
              <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Provider:</span>
                <span>{selectedPatient.InsuranceProvider || 'None'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Policy Number:</span>
                <span>{selectedPatient.InsurancePolicyNumber || 'N/A'}</span>
              </div>
            </div>

            {/* Financial Ledger & Emergency */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                <CreditCard size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> Patient Ledger Account
              </h3>
              <div style={{ 
                padding: '16px', 
                borderRadius: '8px', 
                background: 'rgba(0,0,0,0.2)', 
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Current Outstanding Balance
                </span>
                <h4 style={{ 
                  fontSize: '1.8rem', 
                  color: patientLedger && patientLedger.CurrentBalance > 0 ? '#f87171' : 'var(--accent-teal)',
                  fontFamily: 'var(--font-title)'
                }}>
                  {currencySymbol}{patientLedger ? Math.abs(patientLedger.CurrentBalance).toFixed(2) : '0.00'}
                  <span style={{ fontSize: '0.85rem', marginLeft: '4px', color: 'var(--text-secondary)' }}>
                    {patientLedger ? (patientLedger.CurrentBalance > 0 ? 'Dr (Unpaid)' : 'Cr (Overpaid)') : ''}
                  </span>
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Bound to Ledger Account: {patientLedger ? patientLedger.LedgerName : 'None'}
                </span>
              </div>

              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginTop: '10px' }}>Emergency Contact</h3>
              <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Contact Name:</span>
                <span>{selectedPatient.EmergencyContactName || 'N/A'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Phone Number:</span>
                <span>{selectedPatient.EmergencyContactNumber || 'N/A'}</span>
              </div>
            </div>

          </div>

          {/* Activity Logs Toggles: Appointments, Treatments, Invoices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Appointments Timeline */}
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} style={{ color: 'var(--accent-purple)' }} /> Appointments History
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {patientAppointments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No appointment records.</p>
                ) : (
                  patientAppointments.map(app => (
                    <div key={app.AppointmentId} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '10px 12px', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{new Date(app.AppointmentDate).toLocaleString()}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Doctor: {getDoctorName(app.DoctorId)}
                        </div>
                      </div>
                      <span className={`badge badge-${app.Status.toLowerCase()}`} style={{ height: 'fit-content' }}>{app.Status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Treatments List */}
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} style={{ color: 'var(--accent-teal)' }} /> Active Clinical Treatment Plans
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {patientTreatments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No clinical treatments planned.</p>
                ) : (
                  patientTreatments.map(treat => (
                    <div key={treat.TreatmentId} style={{ 
                      padding: '12px', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>Tooth {treat.ToothNumber}: {treat.Description}</span>
                        <span style={{ color: 'var(--status-waiting-text)' }}>Est: {currencySymbol}{treat.EstimatedCost.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        <span>Consulting: {getDoctorName(treat.DoctorId)}</span>
                        <span className={
                          treat.Status === 'Completed' ? 'badge badge-completed' : 
                          treat.Status === 'InProgress' ? 'badge badge-consultation' : 'badge badge-waiting'
                        } style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          {treat.Status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Invoices List */}
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} style={{ color: 'var(--accent-blue)' }} /> Invoices & Billing
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {patientInvoices.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No bills generated yet.</p>
                ) : (
                  patientInvoices.map(inv => (
                    <div key={inv.InvoiceId} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '10px 12px', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{inv.InvoiceNumber}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Date: {new Date(inv.InvoiceDate).toLocaleDateString()} • Total: {currencySymbol}{inv.TotalAmount.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={inv.Status === 'Paid' ? 'badge badge-completed' : 'badge badge-waiting'} style={{ fontSize: '0.65rem' }}>
                          {inv.Status}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Paid: {currencySymbol}{inv.PaidAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>{editPatientId ? 'Update Patient Medical Chart' : 'Create Patient Medical Chart'}</h2>
              <button 
                onClick={() => {
                  setEditPatientId(null);
                  setIsAddModalOpen(false);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="grid-2">
                <div>
                  <label className="label-text">First Name *</label>
                  <input type="text" name="FirstName" className="input-field" required value={formData.FirstName} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="label-text">Last Name *</label>
                  <input type="text" name="LastName" className="input-field" required value={formData.LastName} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Gender</label>
                  <select name="Gender" className="input-field" value={formData.Gender} onChange={handleInputChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Date of Birth</label>
                  <input type="date" name="DOB" className="input-field" value={formData.DOB} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Mobile Number *</label>
                  <input type="text" name="Mobile" className="input-field" required value={formData.Mobile} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="label-text">Email Address</label>
                  <input type="email" name="Email" className="input-field" value={formData.Email} onChange={handleInputChange} />
                </div>
              </div>

              <div>
                <label className="label-text">Residential Address</label>
                <input type="text" name="Address" className="input-field" value={formData.Address} onChange={handleInputChange} />
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Medical History / Chronic Conditions</label>
                  <textarea name="MedicalHistory" className="input-field" style={{ height: '60px', resize: 'none' }} value={formData.MedicalHistory} onChange={handleInputChange}></textarea>
                </div>
                <div>
                  <label className="label-text">Allergies (e.g. Penicillin, Latex)</label>
                  <textarea name="Allergies" className="input-field" style={{ height: '60px', resize: 'none' }} placeholder="List drug or material allergies" value={formData.Allergies} onChange={handleInputChange}></textarea>
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Emergency Contact Name</label>
                  <input type="text" name="EmergencyContactName" className="input-field" value={formData.EmergencyContactName} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="label-text">Emergency Contact Number</label>
                  <input type="text" name="EmergencyContactNumber" className="input-field" value={formData.EmergencyContactNumber} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Insurance Provider</label>
                  <input type="text" name="InsuranceProvider" className="input-field" placeholder="e.g. Aetna, Cigna" value={formData.InsuranceProvider} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="label-text">Insurance Policy Number</label>
                  <input type="text" name="InsurancePolicyNumber" className="input-field" value={formData.InsurancePolicyNumber} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setEditPatientId(null);
                  setIsAddModalOpen(false);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editPatientId ? 'Save Changes' : 'Create Medical Chart'}</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
