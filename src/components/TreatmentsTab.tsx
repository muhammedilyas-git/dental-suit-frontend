import React, { useState } from 'react';
import type { Treatment, Patient, Doctor, TreatmentStep, User } from '../types';
import { X, Search, Edit } from 'lucide-react';

interface TreatmentsTabProps {
  treatments: Treatment[];
  treatmentSteps: TreatmentStep[];
  patients: Patient[];
  doctors: Doctor[];
  users: User[];
  addTreatment: (
    treatment: Omit<Treatment, 'TreatmentId' | 'CreatedAt'>,
    steps: string[]
  ) => void;
  updateTreatment: (id: number, treatment: Treatment) => void;
  updateTreatmentStatus: (id: number, status: Treatment['Status']) => void;
  toggleStepStatus: (stepId: number) => void;
  currentUser: User;
  currencySymbol?: string;
}

export const TreatmentsTab: React.FC<TreatmentsTabProps> = ({
  treatments,
  treatmentSteps,
  patients,
  doctors,
  users,
  addTreatment,
  updateTreatment,
  updateTreatmentStatus,
  toggleStepStatus,
  currentUser,
  currencySymbol = '$'
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedTooth, setSelectedTooth] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [costFilter, setCostFilter] = useState('All');
  const [archFilter, setArchFilter] = useState('All');
  const [editTreatmentId, setEditTreatmentId] = useState<number | null>(null);

  // Form states for new treatment
  const [treatmentForm, setTreatmentForm] = useState({
    DoctorId: '',
    Description: '',
    EstimatedCost: 150.00,
    Status: 'Planned' as Treatment['Status'],
    Notes: ''
  });

  const handleEditTreatment = (tx: Treatment) => {
    setEditTreatmentId(tx.TreatmentId);
    setSelectedPatientId(tx.PatientId.toString());
    setSelectedTooth(tx.ToothNumber || '');
    setTreatmentForm({
      DoctorId: tx.DoctorId.toString(),
      Description: tx.Description || '',
      EstimatedCost: tx.EstimatedCost,
      Status: tx.Status,
      Notes: tx.Notes || ''
    });
    setStepsList((tx.TreatmentSteps || []).map(s => s.StepDescription));
    setIsAddModalOpen(true);
  };

  // Steps state
  const [stepInput, setStepInput] = useState('');
  const [stepsList, setStepsList] = useState<string[]>([]);

  const getDoctorName = (doctorId: number) => {
    const doc = doctors.find(d => d.DoctorId === doctorId);
    const usr = doc ? users.find(u => u.UserId === doc.UserId) : null;
    return usr ? usr.FullName : `Dr. #${doctorId}`;
  };

  const getPatientName = (patientId: number) => {
    const pat = patients.find(p => p.PatientId === patientId);
    return pat ? `${pat.FirstName} ${pat.LastName}` : `Patient #${patientId}`;
  };

  const handleAddStep = () => {
    if (!stepInput.trim()) return;
    setStepsList(prev => [...prev, stepInput.trim()]);
    setStepInput('');
  };

  const handleRemoveStep = (idx: number) => {
    setStepsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !treatmentForm.DoctorId || !treatmentForm.Description) {
      alert('Patient, Doctor, and Description are required.');
      return;
    }

    if (editTreatmentId) {
      const existingTx = treatments.find(t => t.TreatmentId === editTreatmentId);
      updateTreatment(editTreatmentId, {
        TreatmentId: editTreatmentId,
        PatientId: parseInt(selectedPatientId),
        DoctorId: parseInt(treatmentForm.DoctorId),
        ToothNumber: selectedTooth || 'General',
        Description: treatmentForm.Description,
        EstimatedCost: Number(treatmentForm.EstimatedCost) || 0,
        Status: treatmentForm.Status,
        Notes: treatmentForm.Notes,
        TreatmentSteps: stepsList.map(s => {
          const existingStep = (existingTx?.TreatmentSteps || []).find(x => x.StepDescription === s);
          return {
            StepId: existingStep ? existingStep.StepId : 0,
            TreatmentId: editTreatmentId,
            StepDescription: s,
            Status: existingStep ? existingStep.Status : 'Pending'
          };
        }),
        CreatedAt: existingTx ? existingTx.CreatedAt : ''
      });
    } else {
      addTreatment(
        {
          PatientId: parseInt(selectedPatientId),
          DoctorId: parseInt(treatmentForm.DoctorId),
          ToothNumber: selectedTooth || 'General',
          Description: treatmentForm.Description,
          EstimatedCost: Number(treatmentForm.EstimatedCost) || 0,
          Status: treatmentForm.Status,
          Notes: treatmentForm.Notes
        },
        stepsList
      );
    }

    // Reset forms
    setTreatmentForm({
      DoctorId: '',
      Description: '',
      EstimatedCost: 150.00,
      Status: 'Planned',
      Notes: ''
    });
    setStepsList([]);
    setEditTreatmentId(null);
    setIsAddModalOpen(false);
    setSelectedTooth('');
  };

  // Adult FDI Tooth Number Arrays
  // Upper Right (18 to 11) & Upper Left (21 to 28)
  const upperTeeth = [
    '18', '17', '16', '15', '14', '13', '12', '11',
    '21', '22', '23', '24', '25', '26', '27', '28'
  ];
  // Lower Right (48 to 41) & Lower Left (31 to 38)
  const lowerTeeth = [
    '48', '47', '46', '45', '44', '43', '42', '41',
    '31', '32', '33', '34', '35', '36', '37', '38'
  ];

  // Helper: Find status class for tooth coloring
  const getToothStatusClass = (tooth: string) => {
    if (!selectedPatientId) return '';
    // Find treatments for this patient and tooth
    const activeTreats = treatments.filter(
      t => t.PatientId === parseInt(selectedPatientId) && t.ToothNumber === tooth
    );
    if (activeTreats.some(t => t.Status === 'Completed')) return 'tooth-status-completed';
    if (activeTreats.some(t => t.Status === 'InProgress')) return 'tooth-status-inprogress';
    if (activeTreats.some(t => t.Status === 'Planned')) return 'tooth-status-planned';
    return '';
  };

  // Filter treatments by selected patient, search term, status, cost, and arch
  const patientTreatments = treatments.filter(t => {
    // 1. Patient check
    if (selectedPatientId && t.PatientId !== parseInt(selectedPatientId)) {
      return false;
    }

    // 2. Search check
    const desc = (t.Description || '').toLowerCase();
    const notes = (t.Notes || '').toLowerCase();
    const patName = getPatientName(t.PatientId).toLowerCase();
    const docName = getDoctorName(t.DoctorId).toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = desc.includes(search) || notes.includes(search) || patName.includes(search) || docName.includes(search);

    // 3. Status check
    const matchesStatus = statusFilter === 'All' || t.Status === statusFilter;

    // 4. Cost check
    let matchesCost = true;
    if (costFilter === 'Low') {
      matchesCost = t.EstimatedCost < 100;
    } else if (costFilter === 'Medium') {
      matchesCost = t.EstimatedCost >= 100 && t.EstimatedCost <= 500;
    } else if (costFilter === 'High') {
      matchesCost = t.EstimatedCost > 500;
    }

    // 5. Arch/Tooth check
    let matchesArch = true;
    if (archFilter !== 'All') {
      const tooth = t.ToothNumber;
      if (archFilter === 'General') {
        matchesArch = !tooth || tooth === 'General';
      } else {
        if (!tooth || tooth === 'General') {
          matchesArch = false;
        } else {
          const toothNum = parseInt(tooth);
          if (isNaN(toothNum)) {
            matchesArch = false;
          } else {
            if (archFilter === 'Upper') {
              matchesArch = (toothNum >= 11 && toothNum <= 28);
            } else if (archFilter === 'Lower') {
              matchesArch = (toothNum >= 31 && toothNum <= 48);
            }
          }
        }
      }
    }

    return matchesSearch && matchesStatus && matchesCost && matchesArch;
  }).sort((a, b) => b.TreatmentId - a.TreatmentId);

  // Find currently selected treatment
  const selectedTreatment = patientTreatments.find(t => t.TreatmentId === selectedTreatmentId) || (patientTreatments.length > 0 ? patientTreatments[0] : null);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Patient Picker */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Clinical Treatment Planner</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Select a patient to visualize their tooth chart and design targeted dental treatment plans.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label className="label-text" style={{ margin: 0 }}>Select Patient:</label>
          <select 
            className="input-field" 
            style={{ width: '220px' }}
            value={selectedPatientId}
            onChange={e => {
              setSelectedPatientId(e.target.value);
              setSelectedTooth('');
            }}
          >
            <option value="">-- View All Patients --</option>
            {patients.map(p => (
              <option key={p.PatientId} value={p.PatientId}>{p.FirstName} {p.LastName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Tooth Visualizer (Only visible if a patient is selected) */}
      {selectedPatientId && (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Interactive FDI Dental Chart</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
            Click on a tooth to create a targeted treatment plan. Colors represent: 
            <span style={{ color: 'var(--status-waiting-text)', fontWeight: 600, marginLeft: '8px' }}>● Planned</span>
            <span style={{ color: 'var(--status-consult-text)', fontWeight: 600, marginLeft: '8px' }}>● In Progress</span>
            <span style={{ color: 'var(--status-completed-text)', fontWeight: 600, marginLeft: '8px' }}>● Completed</span>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowX: 'auto' }}>
            
            {/* Upper Teeth Row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
              {upperTeeth.map(tooth => {
                const isSel = selectedTooth === tooth;
                const statusClass = getToothStatusClass(tooth);
                return (
                  <div 
                    key={tooth} 
                    className={`tooth-item ${isSel ? 'selected' : ''} ${statusClass}`}
                    onClick={() => setSelectedTooth(tooth)}
                  >
                    <svg className="tooth-svg" viewBox="0 0 100 100">
                      {/* Upper Tooth Silhouette */}
                      <path d="M20 90 C 20 40, 30 10, 50 10 C 70 10, 80 40, 80 90 Z" />
                      <circle cx="50" cy="50" r="10" />
                    </svg>
                    <span className="tooth-number">{tooth}</span>
                  </div>
                );
              })}
            </div>

            {/* Bite line spacer */}
            <div style={{ borderTop: '2px dashed var(--border-color)', margin: '10px 0' }} />

            {/* Lower Teeth Row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
              {lowerTeeth.map(tooth => {
                const isSel = selectedTooth === tooth;
                const statusClass = getToothStatusClass(tooth);
                return (
                  <div 
                    key={tooth} 
                    className={`tooth-item ${isSel ? 'selected' : ''} ${statusClass}`}
                    onClick={() => setSelectedTooth(tooth)}
                  >
                    <svg className="tooth-svg" viewBox="0 0 100 100">
                      {/* Lower Tooth Silhouette */}
                      <path d="M20 10 C 20 60, 30 90, 50 90 C 70 90, 80 60, 80 10 Z" />
                      <circle cx="50" cy="50" r="10" />
                    </svg>
                    <span className="tooth-number">{tooth}</span>
                  </div>
                );
              })}
            </div>

          </div>

          {selectedTooth && (
            <div className="fade-in" style={{ marginTop: '20px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '0.9rem' }}>Selected Tooth: <strong>{selectedTooth}</strong> ({selectedTooth.startsWith('1') || selectedTooth.startsWith('2') ? 'Upper' : 'Lower'} Arch)</span>
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setIsAddModalOpen(true)}>
                Create Plan for Tooth {selectedTooth}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Treatments List & Active Step Checklists */}
      <div className="treatments-main-grid">
        
        {/* Treatments List */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>
              {selectedPatientId ? `${getPatientName(parseInt(selectedPatientId))}'s` : 'Global'} Treatment Plans
            </h3>
            {!selectedTooth && selectedPatientId && (
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setIsAddModalOpen(true)}>
                Add General Plan
              </button>
            )}
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1.5 1 150px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search description, notes, staff..." 
                className="input-field" 
                style={{ paddingLeft: '32px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.8rem' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="input-field" 
              style={{ flex: '1 1 90px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.8rem' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select 
              className="input-field" 
              style={{ flex: '1 1 90px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.8rem' }}
              value={costFilter}
              onChange={e => setCostFilter(e.target.value)}
            >
              <option value="All">All Costs</option>
              <option value="Low">Under {currencySymbol}100</option>
              <option value="Medium">{currencySymbol}100 - {currencySymbol}500</option>
              <option value="High">Above {currencySymbol}500</option>
            </select>
            <select 
              className="input-field" 
              style={{ flex: '1 1 90px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.8rem' }}
              value={archFilter}
              onChange={e => setArchFilter(e.target.value)}
            >
              <option value="All">All Teeth</option>
              <option value="Upper">Upper Teeth</option>
              <option value="Lower">Lower Teeth</option>
              <option value="General">General (No Tooth)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {patientTreatments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>No treatments recorded.</p>
            ) : (
              patientTreatments.map(t => {
                const isSelected = selectedTreatment?.TreatmentId === t.TreatmentId;
                return (
                  <div 
                    key={t.TreatmentId} 
                    className="glass-panel" 
                    style={{ 
                      padding: '16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '10px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      boxShadow: isSelected ? 'var(--shadow-purple)' : 'none',
                      transition: 'var(--transition-smooth)'
                    }}
                    onClick={() => setSelectedTreatmentId(t.TreatmentId)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className="badge badge-draft" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>
                          Tooth: {t.ToothNumber || 'General'}
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{t.Description}</h4>
                        {!selectedPatientId && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Patient: {getPatientName(t.PatientId)}</p>}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dentist: {getDoctorName(t.DoctorId)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--status-waiting-text)' }}>Est: {currencySymbol}{t.EstimatedCost.toFixed(2)}</div>
                        <select 
                          className="badge" 
                          style={{ 
                            border: 'none', 
                            marginTop: '6px', 
                            background: t.Status === 'Completed' ? 'var(--status-completed-bg)' : t.Status === 'InProgress' ? 'var(--status-consult-bg)' : 'var(--status-waiting-bg)',
                            color: t.Status === 'Completed' ? 'var(--status-completed-text)' : t.Status === 'InProgress' ? 'var(--status-consult-text)' : 'var(--status-waiting-text)',
                            padding: '2px 8px',
                            cursor: 'pointer'
                          }}
                          value={t.Status}
                          onChange={e => {
                            e.stopPropagation();
                            updateTreatmentStatus(t.TreatmentId, e.target.value as Treatment['Status']);
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="Planned">Planned</option>
                          <option value="InProgress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    {t.Notes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '6px 10px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                        <strong>Notes:</strong> {t.Notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Treatment Checklist Steps */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Clinical Step Progress Checks</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedTreatment ? (
              (() => {
                const steps = treatmentSteps.filter(s => s.TreatmentId === selectedTreatment.TreatmentId);
                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-teal)' }}>
                        Tooth {selectedTreatment.ToothNumber || 'General'}: {selectedTreatment.Description}
                      </h4>
                      {currentUser.RoleId === 1 && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleEditTreatment(selectedTreatment)}
                        >
                          <Edit size={12} /> Edit Plan
                        </button>
                      )}
                    </div>
                    {steps.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                        No progress steps defined for this treatment plan.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {steps.map(step => (
                          <div 
                            key={step.StepId} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              fontSize: '0.85rem',
                              padding: '10px 14px',
                              background: step.Status === 'Completed' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(0,0,0,0.15)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input 
                                type="checkbox" 
                                checked={step.Status === 'Completed'} 
                                onChange={() => toggleStepStatus(step.StepId)}
                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                              />
                              <span style={{ textDecoration: step.Status === 'Completed' ? 'line-through' : 'none', color: step.Status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                {step.StepDescription}
                              </span>
                            </div>
                            {step.CompletedDate && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Done: {new Date(step.CompletedDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 20px' }}>
                Select a treatment plan from the list to view and manage progress steps.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Add Treatment Plan Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>{editTreatmentId ? 'Update Treatment Plan' : 'Create Treatment Plan'}</h2>
              <button 
                onClick={() => {
                  setEditTreatmentId(null);
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
                  <label className="label-text">Select Patient *</label>
                  <select 
                    className="input-field" 
                    required 
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.PatientId} value={p.PatientId}>{p.FirstName} {p.LastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Tooth Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    readOnly 
                    value={selectedTooth || 'General'} 
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Responsible Dentist *</label>
                  <select 
                    className="input-field" 
                    required 
                    value={treatmentForm.DoctorId}
                    onChange={e => setTreatmentForm(prev => ({ ...prev, DoctorId: e.target.value }))}
                  >
                    <option value="">-- Choose Dentist --</option>
                    {doctors.map(d => (
                      <option key={d.DoctorId} value={d.DoctorId}>{getDoctorName(d.DoctorId)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Estimated Treatment Cost ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    value={treatmentForm.EstimatedCost}
                    onChange={e => setTreatmentForm(prev => ({ ...prev, EstimatedCost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Treatment Description *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  placeholder="e.g. Tooth Restoration filling / Deep root cleaning"
                  value={treatmentForm.Description}
                  onChange={e => setTreatmentForm(prev => ({ ...prev, Description: e.target.value }))}
                />
              </div>

              <div>
                <label className="label-text">Clinical Progress Notes</label>
                <textarea 
                  className="input-field" 
                  style={{ height: '60px', resize: 'none' }}
                  placeholder="Patient conditions, specific tooth margin alerts..."
                  value={treatmentForm.Notes}
                  onChange={e => setTreatmentForm(prev => ({ ...prev, Notes: e.target.value }))}
                />
              </div>

              {/* Steps Builder */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <label className="label-text">Plan Treatment Steps / Milestones</label>
                
                {/* List of steps */}
                {stepsList.length > 0 && (
                  <ul style={{ fontSize: '0.8rem', paddingLeft: '20px', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                    {stepsList.map((step, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span>{idx + 1}. {step}</span>
                        <button type="button" style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }} onClick={() => handleRemoveStep(idx)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Step 1: Cavity excavation and crown prep" 
                    value={stepInput}
                    onChange={e => setStepInput(e.target.value)}
                  />
                  <button type="button" className="btn btn-teal" onClick={handleAddStep}>Add Step</button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setEditTreatmentId(null);
                  setIsAddModalOpen(false);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTreatmentId ? 'Save Changes' : 'Save Plan'}</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
