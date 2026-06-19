import React, { useState } from 'react';
import type { User, Role, Permission, Department, Doctor } from '../types';
import { Shield, Users, Layers, ShieldCheck, ToggleLeft, ToggleRight, Search, Settings, X, UserPlus, Activity } from 'lucide-react';

interface AdminTabProps {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  rolePermissions: { RoleId: number; PermissionId: number }[];
  departments: Department[];
  toggleUserStatus: (userId: number) => void;
  toggleRolePermission: (roleId: number, permissionId: number) => void;
  addDepartment: (name: string) => void;
  updateDepartment: (id: number, name: string) => void;
  updateUser: (id: number, user: User) => void;
  updateDoctor: (id: number, doctor: any) => void;
  addUser: (user: Omit<User, 'UserId' | 'CreatedAt'>) => void;
  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'DoctorId'>) => void;
  currentUser: User;
  selectedCountry: string;
  currencySymbol: string;
  denominations: number[];
  onCountryChange: (country: string) => Promise<void>;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  users,
  roles,
  permissions,
  rolePermissions,
  departments,
  toggleUserStatus,
  toggleRolePermission,
  addDepartment,
  updateDepartment,
  updateUser,
  updateDoctor,
  addUser,
  doctors,
  addDoctor,
  currentUser,
  selectedCountry,
  currencySymbol,
  denominations,
  onCountryChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'doctors' | 'roles' | 'departments' | 'settings'>('users');
  React.useEffect(() => {
    if (false as boolean) console.log(updateDoctor);
  }, [updateDoctor]);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(1);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRoleId, setAddRoleId] = useState<number>(() => roles[0]?.RoleId || 1);
  const [addPassword, setAddPassword] = useState('password');

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim() || !addFullName.trim()) {
      alert('Username and Full Name are required.');
      return;
    }
    
    addUser({
      Username: addUsername.trim(),
      FullName: addFullName.trim(),
      Email: addEmail.trim() || null,
      Phone: addPhone.trim() || null,
      RoleId: addRoleId,
      IsActive: true,
      PasswordHash: addPassword ? addPassword : 'password'
    });

    // Reset Form
    setAddUsername('');
    setAddFullName('');
    setAddEmail('');
    setAddPhone('');
    setAddRoleId(roles[0]?.RoleId || 1);
    setAddPassword('password');
    setIsAddUserModalOpen(false);
  };
  const [deptInput, setDeptInput] = useState('');

  // Doctors Subtab State
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [doctorDeptFilter, setDoctorDeptFilter] = useState('All');
  
  // Add Doctor Form Modal States
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [addDocUserId, setAddDocUserId] = useState<number>(0);
  const [addDocQualification, setAddDocQualification] = useState('');
  const [addDocSpecialization, setAddDocSpecialization] = useState('');
  const [addDocConsultationFee, setAddDocConsultationFee] = useState(50.00);
  const [addDocDeptId, setAddDocDeptId] = useState<number>(0);
  const [addDocAvailableTiming, setAddDocAvailableTiming] = useState('Mon-Fri, 09:00 AM - 05:00 PM');

  // Edit Doctor Form Modal States
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editDocQualification, setEditDocQualification] = useState('');
  const [editDocSpecialization, setEditDocSpecialization] = useState('');
  const [editDocConsultationFee, setEditDocConsultationFee] = useState(0);
  const [editDocDeptId, setEditDocDeptId] = useState<number>(0);
  const [editDocAvailableTiming, setEditDocAvailableTiming] = useState('');
  const [editDocIsActive, setEditDocIsActive] = useState(true);

  // Filtered Doctor Users who can be linked as Doctors
  const availableDoctorUsers = users.filter(u => 
    u.RoleId === 2 && !doctors.some(d => d.UserId === u.UserId)
  );

  const handleAddDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDocUserId) {
      alert('Please select a staff user.');
      return;
    }
    if (!addDocDeptId) {
      alert('Please assign a department.');
      return;
    }

    addDoctor({
      UserId: addDocUserId,
      Qualification: addDocQualification.trim() || undefined,
      Specialization: addDocSpecialization.trim() || undefined,
      ConsultationFee: Number(addDocConsultationFee) || 0.00,
      DepartmentId: addDocDeptId,
      AvailableTiming: addDocAvailableTiming.trim() || undefined,
      IsActive: true
    });

    // Reset Form
    setAddDocUserId(0);
    setAddDocQualification('');
    setAddDocSpecialization('');
    setAddDocConsultationFee(50.00);
    setAddDocDeptId(departments[0]?.DepartmentId || 0);
    setAddDocAvailableTiming('Mon-Fri, 09:00 AM - 05:00 PM');
    setIsAddDoctorModalOpen(false);
  };

  const handleEditDoctorClick = (doc: Doctor) => {
    setEditingDoctor(doc);
    setEditDocQualification(doc.Qualification || '');
    setEditDocSpecialization(doc.Specialization || '');
    setEditDocConsultationFee(doc.ConsultationFee);
    setEditDocDeptId(doc.DepartmentId);
    setEditDocAvailableTiming(doc.AvailableTiming || '');
    setEditDocIsActive(doc.IsActive);
  };

  const handleEditDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    updateDoctor(editingDoctor.DoctorId, {
      ...editingDoctor,
      Qualification: editDocQualification.trim() || undefined,
      Specialization: editDocSpecialization.trim() || undefined,
      ConsultationFee: Number(editDocConsultationFee) || 0.00,
      DepartmentId: editDocDeptId,
      AvailableTiming: editDocAvailableTiming.trim() || undefined,
      IsActive: editDocIsActive
    });

    setEditingDoctor(null);
  };

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleId, setEditRoleId] = useState<number>(1);
  const [editIsActive, setEditIsActive] = useState(true);

  const handleEditClick = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.FullName);
    setEditEmail(u.Email || '');
    setEditPhone(u.Phone || '');
    setEditRoleId(u.RoleId);
    setEditIsActive(u.IsActive);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    updateUser(editingUser.UserId, {
      ...editingUser,
      FullName: editFullName.trim(),
      Email: editEmail.trim() || null,
      Phone: editPhone.trim() || null,
      RoleId: editRoleId,
      IsActive: editIsActive
    });
    
    setEditingUser(null);
  };

  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');

  const [deptSearchTerm, setDeptSearchTerm] = useState('');

  const filteredUsers = users.filter(u => {
    const username = u.Username.toLowerCase();
    const fullName = u.FullName.toLowerCase();
    const email = (u.Email || '').toLowerCase();
    const phone = (u.Phone || '').toLowerCase();
    const search = userSearchTerm.toLowerCase();
    const matchesSearch = username.includes(search) || fullName.includes(search) || email.includes(search) || phone.includes(search);

    const matchesRole = userRoleFilter === 'All' || u.RoleId === parseInt(userRoleFilter);

    let matchesStatus = true;
    if (userStatusFilter === 'Active') {
      matchesStatus = u.IsActive;
    } else if (userStatusFilter === 'Disabled') {
      matchesStatus = !u.IsActive;
    }

    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => b.UserId - a.UserId);

  const filteredDepartments = departments.filter(dept => {
    const name = dept.DepartmentName.toLowerCase();
    const search = deptSearchTerm.toLowerCase();
    return name.includes(search);
  });

  const getRoleName = (roleId: number) => {
    const role = roles.find(r => r.RoleId === roleId);
    return role ? role.RoleName : `Role #${roleId}`;
  };

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptInput.trim()) return;
    addDepartment(deptInput.trim());
    setDeptInput('');
  };

  // Helper to check if role has permission
  const hasPermission = (roleId: number, permId: number) => {
    return rolePermissions.some(rp => rp.RoleId === roleId && rp.PermissionId === permId);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sub Tabs */}
      <div className="sub-tabs-container" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button 
          className="btn" 
          style={{ 
            background: activeSubTab === 'users' ? 'var(--accent-purple)' : 'transparent',
            color: activeSubTab === 'users' ? '#ffffff' : 'var(--text-secondary)',
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveSubTab('users')}
        >
          <Users size={16} /> User Accounts
        </button>
        <button 
          className="btn" 
          style={{ 
            background: activeSubTab === 'doctors' ? 'var(--accent-purple)' : 'transparent',
            color: activeSubTab === 'doctors' ? '#ffffff' : 'var(--text-secondary)',
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveSubTab('doctors')}
        >
          <Activity size={16} /> Clinic Doctors
        </button>
        <button 
          className="btn" 
          style={{ 
            background: activeSubTab === 'roles' ? 'var(--accent-purple)' : 'transparent',
            color: activeSubTab === 'roles' ? '#ffffff' : 'var(--text-secondary)',
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveSubTab('roles')}
        >
          <Shield size={16} /> Roles & Permissions
        </button>
        <button 
          className="btn" 
          style={{ 
            background: activeSubTab === 'departments' ? 'var(--accent-purple)' : 'transparent',
            color: activeSubTab === 'departments' ? '#ffffff' : 'var(--text-secondary)',
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveSubTab('departments')}
        >
          <Layers size={16} /> Departments
        </button>
        <button 
          className="btn" 
          style={{ 
            background: activeSubTab === 'settings' ? 'var(--accent-purple)' : 'transparent',
            color: activeSubTab === 'settings' ? '#ffffff' : 'var(--text-secondary)',
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveSubTab('settings')}
        >
          <Settings size={16} /> App Settings
        </button>
      </div>

      {/* 1. User Directory Tab */}
      {activeSubTab === 'users' && (
        <div className="glass-panel fade-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Clinic Staff User Directory</h3>
            {currentUser.RoleId === 1 && (
              <button className="btn btn-primary" onClick={() => {
                if (roles.length > 0) {
                  setAddRoleId(roles[0].RoleId);
                }
                setIsAddUserModalOpen(true);
              }}>
                <UserPlus size={16} /> Add User Account
              </button>
            )}
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '2 1 200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search by username, name or contact info..." 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="input-field" 
              style={{ flex: '1 1 150px' }}
              value={userRoleFilter}
              onChange={e => setUserRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              {roles.map(r => (
                <option key={r.RoleId} value={r.RoleId}>{r.RoleName}</option>
              ))}
            </select>
            <select 
              className="input-field" 
              style={{ flex: '1 1 150px' }}
              value={userStatusFilter}
              onChange={e => setUserStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>

          <div className="table-container">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Contact info</th>
                  <th>Assigned Role</th>
                  <th>System Status</th>
                  <th>Toggle State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found matching filters.</td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.UserId}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{u.Username}</td>
                      <td style={{ fontWeight: 600 }}>{u.FullName}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{u.Email || 'No Email'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.Phone || 'No Phone'}</div>
                      </td>
                      <td>{getRoleName(u.RoleId)}</td>
                      <td>
                        {u.IsActive ? (
                          <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>Active</span>
                        ) : (
                          <span className="badge badge-cancelled" style={{ fontSize: '0.65rem' }}>Disabled</span>
                        )}
                      </td>
                      <td>
                        {currentUser.RoleId === 1 ? (
                          <button 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: u.IsActive ? 'var(--accent-teal)' : 'var(--text-muted)' }}
                            onClick={() => toggleUserStatus(u.UserId)}
                          >
                            {u.IsActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Locked</span>
                        )}
                      </td>
                      <td>
                        {currentUser.RoleId === 1 ? (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleEditClick(u)}
                          >
                            Edit
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Locked</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clinic Doctors Tab */}
      {activeSubTab === 'doctors' && (() => {
        const filteredDoctors = doctors.filter(doc => {
          const docUser = users.find(u => u.UserId === doc.UserId);
          const fullName = docUser ? docUser.FullName.toLowerCase() : '';
          const spec = (doc.Specialization || '').toLowerCase();
          const qual = (doc.Qualification || '').toLowerCase();
          const search = doctorSearchTerm.toLowerCase();
          const matchesSearch = fullName.includes(search) || spec.includes(search) || qual.includes(search);

          const matchesDept = doctorDeptFilter === 'All' || doc.DepartmentId === parseInt(doctorDeptFilter);

          return matchesSearch && matchesDept;
        }).sort((a, b) => b.DoctorId - a.DoctorId);

        return (
          <div className="glass-panel fade-in" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Clinic Doctors Registry</h3>
              {currentUser.RoleId === 1 && (
                <button className="btn btn-primary" onClick={() => {
                  if (availableDoctorUsers.length > 0) {
                    setAddDocUserId(availableDoctorUsers[0].UserId);
                  }
                  if (departments.length > 0) {
                    setAddDocDeptId(departments[0].DepartmentId);
                  }
                  setAddDocQualification('');
                  setAddDocSpecialization('');
                  setAddDocConsultationFee(50.00);
                  setAddDocAvailableTiming('Mon-Fri, 09:00 AM - 05:00 PM');
                  setIsAddDoctorModalOpen(true);
                }}>
                  <UserPlus size={16} /> Add Doctor Record
                </button>
              )}
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '2 1 200px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search doctor by name, qualification or specialty..." 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={doctorSearchTerm}
                  onChange={e => setDoctorSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="input-field" 
                style={{ flex: '1 1 150px' }}
                value={doctorDeptFilter}
                onChange={e => setDoctorDeptFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d.DepartmentId} value={d.DepartmentId}>{d.DepartmentName}</option>
                ))}
              </select>
            </div>

            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Doctor Name</th>
                    <th>Department</th>
                    <th>Qualification</th>
                    <th>Specialty</th>
                    <th>Fee</th>
                    <th>Timings</th>
                    <th>Status</th>
                    {currentUser.RoleId === 1 && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={currentUser.RoleId === 1 ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No doctors found matching filters.</td>
                    </tr>
                  ) : (
                    filteredDoctors.map(doc => {
                      const docUser = users.find(u => u.UserId === doc.UserId);
                      const deptName = departments.find(d => d.DepartmentId === doc.DepartmentId)?.DepartmentName || `Dept #${doc.DepartmentId}`;
                      return (
                        <tr key={doc.DoctorId}>
                          <td style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{docUser ? docUser.FullName : `Doctor #${doc.DoctorId}`}</td>
                          <td style={{ fontWeight: 500 }}>{deptName}</td>
                          <td>{doc.Qualification || 'N/A'}</td>
                          <td>{doc.Specialization || 'N/A'}</td>
                          <td style={{ fontWeight: 600 }}>{currencySymbol}{doc.ConsultationFee.toFixed(2)}</td>
                          <td style={{ fontSize: '0.8rem' }}>{doc.AvailableTiming || 'N/A'}</td>
                          <td>
                            {doc.IsActive ? (
                              <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>Active</span>
                            ) : (
                              <span className="badge badge-cancelled" style={{ fontSize: '0.65rem' }}>Inactive</span>
                            )}
                          </td>
                          {currentUser.RoleId === 1 && (
                            <td>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => handleEditDoctorClick(doc)}
                              >
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 2. Roles & Permissions Checklist */}
      {activeSubTab === 'roles' && (
        <div className="glass-panel fade-in admin-main-grid" style={{ padding: '24px' }}>
          
          {/* Roles Selector Panel */}
          <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '20px' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Roles List</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {roles.map(r => (
                <button 
                  key={r.RoleId} 
                  className="btn" 
                  style={{ 
                    width: '100%', 
                    justifyContent: 'flex-start',
                    background: selectedRoleId === r.RoleId ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    border: selectedRoleId === r.RoleId ? '1px solid var(--accent-purple)' : '1px solid transparent',
                    color: selectedRoleId === r.RoleId ? 'var(--accent-purple)' : 'var(--text-primary)',
                    fontWeight: selectedRoleId === r.RoleId ? 600 : 400
                  }}
                  onClick={() => setSelectedRoleId(r.RoleId)}
                >
                  <ShieldCheck size={16} /> {r.RoleName}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Matrix */}
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
              Checklist Permissions Matrix: <span style={{ color: 'var(--accent-purple)' }}>{getRoleName(selectedRoleId)}</span>
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Checking or unchecking permissions immediately modifies access rules bound to this role in real-time.
            </p>

            {/* List by Module group */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {Array.from(new Set(permissions.map(p => p.Module))).map(module => (
                <div key={module} style={{ background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                    {module} Module
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {permissions.filter(p => p.Module === module).map(perm => {
                      const isChecked = hasPermission(selectedRoleId, perm.PermissionId);
                      return (
                        <label 
                          key={perm.PermissionId} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            disabled={currentUser.RoleId !== 1}
                            onChange={() => toggleRolePermission(selectedRoleId, perm.PermissionId)}
                            style={{ cursor: isChecked ? 'pointer' : 'default' }}
                          />
                          <span>{perm.PermissionName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 3. Departments Settings */}
      {activeSubTab === 'departments' && (
        <div className="glass-panel fade-in" style={{ padding: '24px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Dental Specialties & Departments</h3>

          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search specialties..." 
              className="input-field" 
              style={{ paddingLeft: '32px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.85rem' }}
              value={deptSearchTerm}
              onChange={e => setDeptSearchTerm(e.target.value)}
            />
          </div>
          
          <form onSubmit={handleDeptSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="e.g. Pedodontics (Pediatric Dentistry)" 
              className="input-field" 
              required
              value={deptInput}
              onChange={e => setDeptInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Add Specialty</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredDepartments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>No specialties found.</p>
            ) : (
              filteredDepartments.map(dept => (
                <div 
                  key={dept.DepartmentId} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px 16px', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{dept.DepartmentName}</span>
                  {currentUser.RoleId === 1 ? (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={() => {
                        const newName = prompt('Enter new department name:', dept.DepartmentName);
                        if (newName && newName.trim() && newName.trim() !== dept.DepartmentName) {
                          updateDepartment(dept.DepartmentId, newName.trim());
                        }
                      }}
                    >
                      Rename
                    </button>
                  ) : (
                    <span className="badge badge-completed" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>Active</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. App Settings Tab */}
      {activeSubTab === 'settings' && (
        <div className="glass-panel fade-in" style={{ padding: '24px', maxWidth: '500px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Global Application Settings</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Configure regional settings, local currency systems, and cash drawer denominations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Select Country</label>
              <select 
                className="input-field" 
                value={selectedCountry}
                onChange={(e) => onCountryChange(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="United States">United States (USD $)</option>
                <option value="India">India (INR ₹)</option>
                <option value="United Kingdom">United Kingdom (GBP £)</option>
                <option value="Eurozone">Eurozone (EUR €)</option>
              </select>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent-teal)' }}>Active Currency Profile</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                <div>Currency Symbol: <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol}</strong></div>
                <div>Denominations list: <strong style={{ color: 'var(--text-primary)' }}>{denominations.map(d => currencySymbol + d).join(', ')}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 2000 }} 
          onClick={() => setEditingUser(null)}
        >
          <div 
            style={{
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative',
              margin: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit User Account</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Update staff details, role and account status</span>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px', minWidth: 'auto', border: 'none', background: 'transparent' }} 
                onClick={() => setEditingUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Assigned Role</label>
                <select 
                  className="input-field"
                  value={editRoleId}
                  onChange={e => setEditRoleId(parseInt(e.target.value))}
                >
                  {roles.map(r => (
                    <option key={r.RoleId} value={r.RoleId}>{r.RoleName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <input 
                  type="checkbox" 
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={e => setEditIsActive(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="editIsActive" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Account Active / Enabled
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))', border: 'none', color: '#ffffff' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 2000 }} 
          onClick={() => setIsAddUserModalOpen(false)}
        >
          <div 
            style={{
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative',
              margin: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Add User Account</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Create a new staff credential and role mapping</span>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px', minWidth: 'auto', border: 'none', background: 'transparent' }} 
                onClick={() => setIsAddUserModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Username *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={addUsername}
                  onChange={e => setAddUsername(e.target.value)}
                  placeholder="e.g. john.reception"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Password *</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={addPassword}
                  onChange={e => setAddPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Full Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={addFullName}
                  onChange={e => setAddFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  placeholder="e.g. john.doe@dentalsuit.com"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={addPhone}
                  onChange={e => setAddPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 012-3456"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Assigned Role</label>
                <select 
                  className="input-field"
                  value={addRoleId}
                  onChange={e => setAddRoleId(parseInt(e.target.value))}
                >
                  {roles.map(r => (
                    <option key={r.RoleId} value={r.RoleId}>{r.RoleName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))', border: 'none', color: '#ffffff' }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {isAddDoctorModalOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 2000 }} 
          onClick={() => setIsAddDoctorModalOpen(false)}
        >
          <div 
            style={{
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative',
              margin: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Add Doctor Record</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Link a staff user account as an active clinician</span>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px', minWidth: 'auto', border: 'none', background: 'transparent' }} 
                onClick={() => setIsAddDoctorModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Select Doctor User Account *</label>
                {availableDoctorUsers.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#f87171', margin: 0 }}>
                    No user accounts with the 'Doctor' role are available to be linked. Please create a new User Account with the Doctor role first.
                  </p>
                ) : (
                  <select 
                    className="input-field"
                    value={addDocUserId}
                    onChange={e => setAddDocUserId(parseInt(e.target.value))}
                    required
                  >
                    {availableDoctorUsers.map(u => (
                      <option key={u.UserId} value={u.UserId}>{u.FullName} ({u.Username})</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Assign Department *</label>
                <select 
                  className="input-field"
                  value={addDocDeptId}
                  onChange={e => setAddDocDeptId(parseInt(e.target.value))}
                  required
                >
                  {departments.map(d => (
                    <option key={d.DepartmentId} value={d.DepartmentId}>{d.DepartmentName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Qualification</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={addDocQualification}
                  onChange={e => setAddDocQualification(e.target.value)}
                  placeholder="e.g. DDS, NYU College of Dentistry"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Specialization</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={addDocSpecialization}
                  onChange={e => setAddDocSpecialization(e.target.value)}
                  placeholder="e.g. Orthodontic Braces, Dental Implants"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Consultation Fee ({currencySymbol}) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="input-field" 
                  value={addDocConsultationFee}
                  onChange={e => setAddDocConsultationFee(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Available Timings</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={addDocAvailableTiming}
                  onChange={e => setAddDocAvailableTiming(e.target.value)}
                  placeholder="e.g. Mon-Wed, 09:00 AM - 04:00 PM"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsAddDoctorModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={availableDoctorUsers.length === 0}
                  style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))', border: 'none', color: '#ffffff' }}
                >
                  Create Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 2000 }} 
          onClick={() => setEditingDoctor(null)}
        >
          <div 
            style={{
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative',
              margin: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Doctor Record</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Update qualifications, settings and clinician status</span>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px', minWidth: 'auto', border: 'none', background: 'transparent' }} 
                onClick={() => setEditingDoctor(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditDoctorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Doctor Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  disabled
                  value={users.find(u => u.UserId === editingDoctor.UserId)?.FullName || ''}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Assign Department *</label>
                <select 
                  className="input-field"
                  value={editDocDeptId}
                  onChange={e => setEditDocDeptId(parseInt(e.target.value))}
                  required
                >
                  {departments.map(d => (
                    <option key={d.DepartmentId} value={d.DepartmentId}>{d.DepartmentName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Qualification</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editDocQualification}
                  onChange={e => setEditDocQualification(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Specialization</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editDocSpecialization}
                  onChange={e => setEditDocSpecialization(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Consultation Fee ({currencySymbol}) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="input-field" 
                  value={editDocConsultationFee}
                  onChange={e => setEditDocConsultationFee(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Available Timings</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editDocAvailableTiming}
                  onChange={e => setEditDocAvailableTiming(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <input 
                  type="checkbox" 
                  id="editDocIsActive"
                  checked={editDocIsActive}
                  onChange={e => setEditDocIsActive(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="editDocIsActive" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Clinician Active / Available
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingDoctor(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))', border: 'none', color: '#ffffff' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
