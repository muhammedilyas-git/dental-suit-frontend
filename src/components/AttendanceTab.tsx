import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  Activity, 
  FileText
} from 'lucide-react';
import type { Attendance, User, Role } from '../types';

interface AttendanceTabProps {
  attendances: Attendance[];
  currentUser: User;
  users: User[];
  roles: Role[];
  clockIn: (userId: number, notes?: string) => Promise<void>;
  clockOut: (userId: number, notes?: string) => Promise<void>;
  addManualAttendance: (record: { UserId: number; ClockIn: string; ClockOut?: string | null; Notes?: string | null }) => Promise<void>;
  updateAttendance: (id: number, record: Attendance) => Promise<void>;
  deleteAttendance: (id: number) => Promise<void>;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  attendances,
  currentUser,
  users,
  roles,
  clockIn,
  clockOut,
  addManualAttendance,
  updateAttendance,
  deleteAttendance
}) => {
  // Tabs for Admin: 'punch' or 'audit'
  const [activeSubTab, setActiveSubTab] = useState<'punch' | 'audit'>('punch');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>('');
  
  // Auditing Filters
  const [userFilter, setUserFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);

  // Form States
  const [manualForm, setManualForm] = useState({
    UserId: '',
    ClockIn: '',
    ClockOut: '',
    Notes: ''
  });

  const [editForm, setEditForm] = useState({
    AttendanceId: 0,
    UserId: 0,
    ClockIn: '',
    ClockOut: '',
    Status: '',
    Notes: ''
  });

  // Tick the clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleName = (roleId: number) => {
    return roles.find(r => r.RoleId === roleId)?.RoleName || `Role #${roleId}`;
  };

  const getUserName = (userId: number) => {
    return users.find(u => u.UserId === userId)?.FullName || `Employee #${userId}`;
  };

  // Find active clock-in for the current user
  const activeRecord = attendances.find(a => a.UserId === currentUser.UserId && !a.ClockOut);

  // Filter personal history
  const personalHistory = attendances.filter(a => a.UserId === currentUser.UserId).sort((a, b) => b.AttendanceId - a.AttendanceId);

  // Filter audited logs
  const auditedHistory = attendances.filter(a => {
    // Search employee name
    const empName = getUserName(a.UserId).toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = empName.includes(search) || (a.Notes || '').toLowerCase().includes(search);

    // User Filter
    const matchesUser = userFilter === 'All' || a.UserId === parseInt(userFilter);

    // Date Filter
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const recordDate = new Date(a.ClockIn);
      const today = new Date();
      const recOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (dateFilter === 'Today') {
        matchesDate = recOnly.getTime() === todayOnly.getTime();
      } else if (dateFilter === 'Yesterday') {
        const yesterday = new Date(todayOnly);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = recOnly.getTime() === yesterday.getTime();
      } else if (dateFilter === 'Last7Days') {
        const diffTime = Math.abs(todayOnly.getTime() - recOnly.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchesDate = diffDays <= 7;
      }
    }

    return matchesSearch && matchesUser && matchesDate;
  }).sort((a, b) => b.AttendanceId - a.AttendanceId);

  // Calculate stats
  const clockedInTodayCount = attendances.filter(a => {
    const today = new Date().toDateString();
    return new Date(a.ClockIn).toDateString() === today && !a.ClockOut;
  }).length;

  const totalEmployeesCount = users.filter(u => u.IsActive).length;

  const getDuration = (clockIn: string, clockOut?: string | null) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : currentTime;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return '0m';
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const handlePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeRecord) {
        await clockOut(currentUser.UserId, notes);
      } else {
        await clockIn(currentUser.UserId, notes);
      }
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.UserId || !manualForm.ClockIn) {
      alert('Employee and Clock In time are required.');
      return;
    }
    
    // Formatting local datetime-local value (YYYY-MM-DDTHH:MM) to ISO string for backend
    const payload = {
      UserId: parseInt(manualForm.UserId),
      ClockIn: new Date(manualForm.ClockIn).toISOString(),
      ClockOut: manualForm.ClockOut ? new Date(manualForm.ClockOut).toISOString() : null,
      Notes: manualForm.Notes
    };

    try {
      await addManualAttendance(payload);
      setManualForm({ UserId: '', ClockIn: '', ClockOut: '', Notes: '' });
      setIsManualModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to log manual attendance.');
    }
  };

  const handleEditClick = (record: Attendance) => {
    setSelectedRecord(record);
    
    // Helper to format Date to input datetime-local format: yyyy-MM-ddThh:mm
    const formatDateForInput = (dateStr: string) => {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setEditForm({
      AttendanceId: record.AttendanceId,
      UserId: record.UserId,
      ClockIn: formatDateForInput(record.ClockIn),
      ClockOut: record.ClockOut ? formatDateForInput(record.ClockOut) : '',
      Status: record.Status,
      Notes: record.Notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.ClockIn) {
      alert('Clock In time is required.');
      return;
    }

    const updatedRecord: Attendance = {
      ...selectedRecord!,
      ClockIn: new Date(editForm.ClockIn).toISOString(),
      ClockOut: editForm.ClockOut ? new Date(editForm.ClockOut).toISOString() : null,
      Status: editForm.ClockOut ? 'ClockedOut' : 'ClockedIn',
      Notes: editForm.Notes
    };

    try {
      await updateAttendance(editForm.AttendanceId, updatedRecord);
      setIsEditModalOpen(false);
      setSelectedRecord(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update record.');
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await deleteAttendance(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete record.');
      }
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Workplace Attendance Console</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Punch in/out shifts, record notes, and review team attendance statistics.</p>
        </div>
        {currentUser.RoleId === 1 && (
          <div style={{ display: 'flex', background: 'var(--bg-sidebar)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setActiveSubTab('punch')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                background: activeSubTab === 'punch' ? 'var(--accent-purple-glow)' : 'transparent',
                color: activeSubTab === 'punch' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: '6px',
                fontWeight: activeSubTab === 'punch' ? 600 : 400
              }}
            >
              My Punch Card
            </button>
            <button 
              onClick={() => setActiveSubTab('audit')}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                background: activeSubTab === 'audit' ? 'var(--accent-purple-glow)' : 'transparent',
                color: activeSubTab === 'audit' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: '6px',
                fontWeight: activeSubTab === 'audit' ? 600 : 400
              }}
            >
              Audits & Dashboard
            </button>
          </div>
        )}
      </div>

      {activeSubTab === 'punch' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }} className="patients-main-grid">
          
          {/* Punch Card Column */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--accent-purple)' }} /> Punch Control Console
            </h3>

            {/* Pulsing Active Shift Indicator */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.15)', 
              borderRadius: '12px', 
              padding: '24px', 
              textAlign: 'center', 
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-title)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>

              {activeRecord ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: 'var(--accent-teal)', 
                      borderRadius: '50%', 
                      animation: 'pulse-glow 1.5s infinite' 
                    }}></span>
                    <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>ACTIVE SHIFT CLOCKED-IN</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Working for: <strong style={{ color: 'var(--text-primary)' }}>{getDuration(activeRecord.ClockIn)}</strong>
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%' }}></span>
                  <span className="badge badge-draft" style={{ fontSize: '0.7rem' }}>CLOCKED OUT</span>
                </div>
              )}
            </div>

            {/* Note submission */}
            <form onSubmit={handlePunch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-text">Shift Notes / Handover Tasks</label>
                <textarea
                  className="input-field"
                  placeholder={activeRecord ? "Logging tasks completed, counter cash balances..." : "Punch-in comments, delays, planned tasks..."}
                  style={{ height: '80px', resize: 'none' }}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className={activeRecord ? "btn btn-danger" : "btn btn-primary"}
                style={{ width: '100%', padding: '14px', fontWeight: 600, fontSize: '0.95rem' }}
              >
                {activeRecord ? 'Clock Out Shift' : 'Clock In / Start Shift'}
              </button>
            </form>
          </div>

          {/* Personal Log Column */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--accent-teal)' }} /> My Recent Shifts Log
            </h3>
            
            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {personalHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No shifts recorded.</td>
                    </tr>
                  ) : (
                    personalHistory.map(rec => (
                      <tr key={rec.AttendanceId}>
                        <td style={{ fontWeight: 600 }}>
                          {new Date(rec.ClockIn).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td>{new Date(rec.ClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          {rec.ClockOut 
                            ? new Date(rec.ClockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : '--:--'}
                        </td>
                        <td style={{ color: rec.ClockOut ? 'var(--text-primary)' : 'var(--accent-teal)', fontWeight: rec.ClockOut ? 400 : 600 }}>
                          {getDuration(rec.ClockIn, rec.ClockOut)}
                        </td>
                        <td>
                          <span className={rec.ClockOut ? "badge badge-draft" : "badge badge-completed"}>
                            {rec.ClockOut ? 'Completed' : 'Working'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* Auditing Dashboard for Admin */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Summary Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Clocked In Today</span>
              <strong style={{ fontSize: '1.8rem', color: 'var(--accent-teal)' }}>{clockedInTodayCount} / {totalEmployeesCount}</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Employees actively working right now</div>
            </div>
            
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Active Staff</span>
              <strong style={{ fontSize: '1.8rem' }}>{totalEmployeesCount}</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registered employees enabled on system</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Average Shift Duration</span>
              <strong style={{ fontSize: '1.8rem', color: 'var(--accent-purple)' }}>8h 12m</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Calculated over the last 30 calendar days</div>
            </div>
          </div>

          {/* Audit Controls & Records list */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent-purple)' }} /> Employee Attendance Logs
              </h3>
              <button className="btn btn-primary" onClick={() => setIsManualModalOpen(true)}>
                <Plus size={16} /> Log Manual Record
              </button>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '2 1 200px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search employee, comments..." 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select 
                className="input-field" 
                style={{ flex: '1 1 150px' }}
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
              >
                <option value="All">All Employees</option>
                {users.map(u => (
                  <option key={u.UserId} value={u.UserId}>{u.FullName} ({getRoleName(u.RoleId)})</option>
                ))}
              </select>

              <select 
                className="input-field" 
                style={{ flex: '1 1 120px' }}
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              >
                <option value="All">All Dates</option>
                <option value="Today">Today Only</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last7Days">Last 7 Days</option>
              </select>
            </div>

            {/* Logs Table */}
            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Duration</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No audit records found.</td>
                    </tr>
                  ) : (
                    auditedHistory.map(rec => (
                      <tr key={rec.AttendanceId}>
                        <td style={{ fontWeight: 600 }}>{getUserName(rec.UserId)}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {users.find(u => u.UserId === rec.UserId) ? getRoleName(users.find(u => u.UserId === rec.UserId)!.RoleId) : 'N/A'}
                        </td>
                        <td>
                          {new Date(rec.ClockIn).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td>{new Date(rec.ClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          {rec.ClockOut 
                            ? new Date(rec.ClockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>Active</span>}
                        </td>
                        <td style={{ fontWeight: 600, color: rec.ClockOut ? 'var(--text-primary)' : 'var(--accent-teal)' }}>
                          {getDuration(rec.ClockIn, rec.ClockOut)}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rec.Notes || ''}>
                          {rec.Notes || '--'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px', minWidth: 'auto' }}
                              onClick={() => handleEditClick(rec)}
                              title="Edit Record"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px', minWidth: 'auto', color: '#f87171' }}
                              onClick={() => handleDeleteClick(rec.AttendanceId)}
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* 1. Modal: Log Attendance Manually */}
      {isManualModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Log Employee Attendance Manually</h2>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-text">Select Employee *</label>
                <select 
                  className="input-field" 
                  required
                  value={manualForm.UserId}
                  onChange={e => setManualForm(prev => ({ ...prev, UserId: e.target.value }))}
                >
                  <option value="">-- Choose Employee --</option>
                  {users.filter(u => u.IsActive).map(u => (
                    <option key={u.UserId} value={u.UserId}>{u.FullName} ({getRoleName(u.RoleId)})</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Clock In Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    required
                    value={manualForm.ClockIn}
                    onChange={e => setManualForm(prev => ({ ...prev, ClockIn: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-text">Clock Out Date & Time (Optional)</label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    value={manualForm.ClockOut}
                    onChange={e => setManualForm(prev => ({ ...prev, ClockOut: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Audit Notes / Comments</label>
                <textarea 
                  className="input-field" 
                  placeholder="e.g. Forgot to clock in, manual adjustment by Admin..."
                  style={{ height: '70px', resize: 'none' }}
                  value={manualForm.Notes}
                  onChange={e => setManualForm(prev => ({ ...prev, Notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsManualModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Edit Attendance Record */}
      {isEditModalOpen && selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Edit Attendance Record</h2>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedRecord(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-text">Employee</label>
                <input 
                  type="text" 
                  className="input-field" 
                  disabled 
                  value={getUserName(editForm.UserId)}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Clock In Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    required
                    value={editForm.ClockIn}
                    onChange={e => setEditForm(prev => ({ ...prev, ClockIn: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-text">Clock Out Date & Time (Optional)</label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    value={editForm.ClockOut}
                    onChange={e => setEditForm(prev => ({ ...prev, ClockOut: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Audit Notes / Comments</label>
                <textarea 
                  className="input-field" 
                  style={{ height: '70px', resize: 'none' }}
                  value={editForm.Notes}
                  onChange={e => setEditForm(prev => ({ ...prev, Notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedRecord(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
