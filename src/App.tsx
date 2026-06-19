import { useState, useEffect } from 'react';
import type {
  Patient,
  Appointment,
  Doctor,
  Department,
  User,
  Role,
  Permission,
  Consultation,
  Item,
  ItemCategory,
  Unit,
  Supplier,
  Prescription,
  InventoryTransaction,
  Treatment,
  AccountGroup,
  Ledger,
  AccountTransaction,
  Invoice,
  InvoiceItem,
  Payment,
  Attendance
} from './types';



// Tab Components
import { Dashboard } from './components/Dashboard';
import { PatientsTab } from './components/PatientsTab';
import { AppointmentsTab } from './components/AppointmentsTab';
import { TreatmentsTab } from './components/TreatmentsTab';
import { InventoryTab } from './components/InventoryTab';
import { BillingTab } from './components/BillingTab';
import { AccountingTab } from './components/AccountingTab';
import { AdminTab } from './components/AdminTab';
import { PurchasesTab } from './components/PurchasesTab';
import { AttendanceTab } from './components/AttendanceTab';

// Lucide React Icons
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  Package,
  ShoppingBag,
  DollarSign,
  Briefcase,
  Settings,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Clock
} from 'lucide-react';

function App() {
  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
  const [tab, setTab] = useState<string>(() => localStorage.getItem('activeTab') || 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal controls from global scope
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  
  // Authentication states
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Profile Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // App Settings States
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [denominations, setDenominations] = useState<number[]>([100, 50, 20, 10, 5, 1]);

  // Shift & Cash Drawer States
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [recalculatedShiftData, setRecalculatedShiftData] = useState<any | null>(null);
  const [shiftDenomCounts, setShiftDenomCounts] = useState<{ [key: number]: number }>({});
  const [shiftCoins, setShiftCoins] = useState<number>(0);
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [isShiftSaving, setIsShiftSaving] = useState(false);

  // const API_BASE = window.location.port === '5173' || window.location.port === '4173' || window.location.port === '5166'
  //   ? '/api'
  //   : (window.location.origin.includes('5166') ? '/api' : 'http://localhost:5166/api');

  const API_BASE = "http://192.168.1.250:5000/api";

  // --- Dynamic State Mock Database ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<{ RoleId: number; PermissionId: number }[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  // Derived states mapped from nested properties
  const treatmentSteps = treatments.flatMap(t => t.TreatmentSteps || []);
  const invoiceItems = invoices.flatMap(i => i.InvoiceItems || []);

  const getCountryCurrencySymbol = (country: string) => {
    switch(country) {
      case 'India': return '₹';
      case 'United Kingdom': return '£';
      case 'Eurozone': return '€';
      default: return '$';
    }
  };

  const getCountryDenominations = (country: string) => {
    switch(country) {
      case 'India': return [500, 200, 100, 50, 20, 10, 5];
      case 'United Kingdom': return [50, 20, 10, 5];
      case 'Eurozone': return [100, 50, 20, 10, 5];
      default: return [100, 50, 20, 10, 5, 1];
    }
  };

  const loadAllData = async () => {
    try {
      const [
        patientsData,
        appointmentsData,
        doctorsData,
        departmentsData,
        usersData,
        rolesData,
        permissionsData,
        rolePermissionsData,
        consultationsData,
        itemsData,
        categoriesData,
        unitsData,
        suppliersData,
        inventoryTransactionsData,
        treatmentsData,
        accountGroupsData,
        ledgersData,
        accountTransactionsData,
        invoicesData,
        paymentsData,
        attendancesData
      ] = await Promise.all([
        fetch(`${API_BASE}/patients`).then(r => r.json()),
        fetch(`${API_BASE}/appointments`).then(r => r.json()),
        fetch(`${API_BASE}/admin/doctors`).then(r => r.json()),
        fetch(`${API_BASE}/admin/departments`).then(r => r.json()),
        fetch(`${API_BASE}/admin/users`).then(r => r.json()),
        fetch(`${API_BASE}/admin/roles`).then(r => r.json()),
        fetch(`${API_BASE}/admin/permissions`).then(r => r.json()),
        fetch(`${API_BASE}/admin/role-permissions`).then(r => r.json()),
        fetch(`${API_BASE}/appointments/consultations`).then(r => r.json()),
        fetch(`${API_BASE}/inventory/items`).then(r => r.json()),
        fetch(`${API_BASE}/inventory/categories`).then(r => r.json()),
        fetch(`${API_BASE}/inventory/units`).then(r => r.json()),
        fetch(`${API_BASE}/inventory/suppliers`).then(r => r.json()),
        fetch(`${API_BASE}/inventory/transactions`).then(r => r.json()),
        fetch(`${API_BASE}/treatments`).then(r => r.json()),
        fetch(`${API_BASE}/accounting/groups`).then(r => r.json()),
        fetch(`${API_BASE}/accounting/ledgers`).then(r => r.json()),
        fetch(`${API_BASE}/accounting/transactions`).then(r => r.json()),
        fetch(`${API_BASE}/billing/invoices`).then(r => r.json()),
        fetch(`${API_BASE}/billing/payments`).then(r => r.json()),
        fetch(`${API_BASE}/attendance`).then(r => r.json())
      ]);

      setPatients(patientsData);
      setAppointments(appointmentsData);
      setDoctors(doctorsData);
      setDepartments(departmentsData);
      setUsers(usersData);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setRolePermissions(rolePermissionsData);
      setConsultations(consultationsData);
      setItems(itemsData);
      setCategories(categoriesData);
      setUnits(unitsData);
      setSuppliers(suppliersData);
      setInventoryTransactions(inventoryTransactionsData);
      setTreatments(treatmentsData);
      setAccountGroups(accountGroupsData);
      setLedgers(ledgersData);
      setAccountTransactions(accountTransactionsData);
      setInvoices(invoicesData);
      setPayments(paymentsData);
      setAttendances(attendancesData);

      // Fetch system settings
      let dbSettings: any = null;
      try {
        dbSettings = await fetch(`${API_BASE}/admin/settings`).then(r => r.json());
        if (dbSettings) {
          if (dbSettings.Country) {
            setSelectedCountry(dbSettings.Country);
            setCurrencySymbol(getCountryCurrencySymbol(dbSettings.Country));
            setDenominations(getCountryDenominations(dbSettings.Country));
          }
        }
      } catch (e) {
        console.error("Error fetching system settings:", e);
      }

      // Sync active current user info if it changes in database
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const freshUser = usersData.find((u: any) => u.UserId === parsed.UserId);
          if (freshUser) {
            setCurrentUser(freshUser);
            localStorage.setItem('currentUser', JSON.stringify(freshUser));

            // Sync user theme from backend settings if present
            if (dbSettings) {
              const userTheme = dbSettings[`Theme_User_${freshUser.UserId}`];
              if (userTheme === 'light' || userTheme === 'dark') {
                setTheme(userTheme);
                localStorage.setItem(`theme_${freshUser.UserId}`, userTheme);
              }
            }

            // Check active shift for receptionist
            if (freshUser.RoleId === 3) {
              const active = await fetch(`${API_BASE}/shift/active/${freshUser.UserId}`).then(r => r.json());
              setActiveShift(active);
            } else {
              setActiveShift(null);
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    } catch (err) {
      console.error("Error loading data from backend:", err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Set Theme attributes on document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (currentUser) {
      localStorage.setItem(`theme_${currentUser.UserId}`, theme);
    } else {
      localStorage.setItem('theme', theme);
    }
  }, [theme, currentUser]);

  // Sync theme with current user preference
  useEffect(() => {
    if (currentUser) {
      const userTheme = localStorage.getItem(`theme_${currentUser.UserId}`) as 'light' | 'dark';
      if (userTheme === 'light' || userTheme === 'dark') {
        setTheme(userTheme);
      } else {
        setTheme('dark'); // default to dark for logged in users
      }
    } else {
      const guestTheme = localStorage.getItem('theme') as 'light' | 'dark';
      setTheme(guestTheme || 'dark'); // default to dark for guest / login screen
    }
  }, [currentUser]);

  // Persist active tab selection on reload
  useEffect(() => {
    localStorage.setItem('activeTab', tab);
  }, [tab]);

  // Toggle Theme
  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (currentUser) {
      try {
        await fetch(`${API_BASE}/admin/settings/Theme_User_${currentUser.UserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Value: nextTheme })
        });
      } catch (e) {
        console.error("Error saving theme setting:", e);
      }
    }
  };

  // Change Tab and close mobile sidebar
  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    setIsSidebarOpen(false);
  };

  // --- PERMISSIONS AND AUTHENTICATION ENGINE ---

  const userHasPermission = (permissionId: number): boolean => {
    if (!currentUser) return false;
    if (currentUser.RoleId === 1) return true; // Super Admin has all permissions
    return rolePermissions.some(rp => rp.RoleId === currentUser.RoleId && rp.PermissionId === permissionId);
  };

  const isTabAllowed = (tabName: string): boolean => {
    if (!currentUser) return false;
    if (tabName === 'dashboard') return userHasPermission(20);
    if (tabName === 'patients') return userHasPermission(3);      // View Patients
    if (tabName === 'appointments') return userHasPermission(8);   // View Appointments
    if (tabName === 'treatments') return userHasPermission(11);    // View Treatments
    if (tabName === 'inventory') return userHasPermission(13);     // View Inventory
    if (tabName === 'purchases') return userHasPermission(13) || userHasPermission(14) || userHasPermission(15); // View Inventory, Update Stock, Manage Suppliers
    if (tabName === 'billing') return userHasPermission(16) || userHasPermission(17); // Create Invoices, Record Payments
    if (tabName === 'accounting') return userHasPermission(18);    // View Ledgers
    if (tabName === 'admin') return userHasPermission(1) || userHasPermission(2);   // Manage Users, Manage Roles
    if (tabName === 'attendance') return true;                     // Anyone logged in can see attendance
    return false;
  };

  const getFirstAllowedTab = (): string => {
    if (isTabAllowed('dashboard')) return 'dashboard';
    const tabs = ['patients', 'appointments', 'treatments', 'inventory', 'purchases', 'billing', 'accounting', 'attendance', 'admin'];
    for (const t of tabs) {
      if (isTabAllowed(t)) return t;
    }
    return 'dashboard';
  };

  // Tab visibility automatic correction
  useEffect(() => {
    if (currentUser && !isTabAllowed(tab)) {
      setTab(getFirstAllowedTab());
    }
  }, [currentUser, rolePermissions, tab]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: loginUsername, Password: loginPassword })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Login failed. Please check credentials.');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.Token);
      localStorage.setItem('currentUser', JSON.stringify(data.User));
      setToken(data.Token);
      setCurrentUser(data.User);
      setLoginUsername('');
      setLoginPassword('');
      await loadAllData();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken(null);
    setCurrentUser(null);
    setTab('dashboard');
  };

  const openProfileModal = () => {
    if (currentUser) {
      setProfileName(currentUser.FullName || '');
      setProfileEmail(currentUser.Email || '');
      setProfilePhone(currentUser.Phone || '');
      setProfilePassword('');
      setProfileError(null);
      setProfileSuccess(false);
      setIsProfileModalOpen(true);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileError(null);
    setProfileSuccess(false);
    setIsUpdatingProfile(true);
    try {
      const payload: any = {
        UserId: currentUser.UserId,
        Username: currentUser.Username,
        FullName: profileName,
        Email: profileEmail,
        Phone: profilePhone,
        RoleId: currentUser.RoleId,
        IsActive: currentUser.IsActive,
        PasswordHash: profilePassword ? profilePassword : '******'
      };
      
      const response = await fetch(`${API_BASE}/admin/users/${currentUser.UserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update profile.');
      }
      
      const updatedUser = await response.json();
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setProfileSuccess(true);
      
      await loadAllData();
      
      setTimeout(() => {
        setIsProfileModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setProfileError(err.message || 'Error updating profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCountryChange = async (country: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/settings/Country`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Value: country })
      });
      if (!response.ok) {
        throw new Error('Failed to update country setting.');
      }
      setSelectedCountry(country);
      setCurrencySymbol(getCountryCurrencySymbol(country));
      setDenominations(getCountryDenominations(country));
    } catch (e) {
      console.error(e);
      alert('Error updating country setting');
    }
  };

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setShiftError(null);
    setIsShiftSaving(true);
    
    // Sum opening cash
    const total = Object.entries(shiftDenomCounts).reduce(
      (sum, [denom, count]) => sum + parseInt(denom) * (count || 0), 0
    ) + Number(shiftCoins);

    try {
      const response = await fetch(`${API_BASE}/shift/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: currentUser.UserId,
          OpeningCash: total,
          OpeningCashDenominations: JSON.stringify({ counts: shiftDenomCounts, coins: shiftCoins })
        })
      });

      let responseData: any;
      const text = await response.text();
      try {
        responseData = text ? JSON.parse(text) : {};
      } catch (e) {
        responseData = { message: text || `Server error (Status ${response.status})` };
      }

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to open shift.');
      }

      const openedShift = responseData;
      setActiveShift(openedShift);
      
      // Clear forms
      setShiftDenomCounts({});
      setShiftCoins(0);
      setShiftNotes('');
    } catch (err: any) {
      setShiftError(err.message || 'Error opening shift.');
    } finally {
      setIsShiftSaving(false);
    }
  };

  const handleCloseShiftRecalculate = async () => {
    if (!currentUser) return;
    setShiftError(null);
    try {
      const data = await fetch(`${API_BASE}/shift/recalculate/${currentUser.UserId}`).then(r => r.json());
      setRecalculatedShiftData(data);
      setShiftDenomCounts({});
      setShiftCoins(0);
      setShiftNotes('');
      setIsCloseShiftModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Error calculating expected cash drawer balances.');
    }
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeShift || !recalculatedShiftData) return;
    setShiftError(null);
    setIsShiftSaving(true);

    // Sum closing cash counted
    const total = Object.entries(shiftDenomCounts).reduce(
      (sum, [denom, count]) => sum + parseInt(denom) * (count || 0), 0
    ) + Number(shiftCoins);

    const expected = recalculatedShiftData.ExpectedCash;
    if (Math.round(total * 100) !== Math.round(expected * 100)) {
      setShiftError(`Discrepancy: closing counted cash (${currencySymbol}${total.toFixed(2)}) must exactly match expected cash (${currencySymbol}${expected.toFixed(2)}) to close counter.`);
      setIsShiftSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/shift/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ShiftId: activeShift.ShiftId,
          ActualClosingCash: total,
          ClosingCashDenominations: JSON.stringify({ counts: shiftDenomCounts, coins: shiftCoins }),
          Notes: shiftNotes
        })
      });

      let responseData: any;
      const text = await response.text();
      try {
        responseData = text ? JSON.parse(text) : {};
      } catch (e) {
        responseData = { message: text || `Server error (Status ${response.status})` };
      }

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to close shift.');
      }

      setActiveShift(null);
      setIsCloseShiftModalOpen(false);
      setRecalculatedShiftData(null);
    } catch (err: any) {
      setShiftError(err.message || 'Error closing shift.');
    } finally {
      setIsShiftSaving(false);
    }
  };

  // --- ACTIONS ENGINE ---

  const updatePatient = async (id: number, patient: Patient) => {
    try {
      await fetch(`${API_BASE}/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateAppointment = async (id: number, appt: Appointment) => {
    try {
      const { Patient, Doctor, ...rest } = appt as any;
      await fetch(`${API_BASE}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateSupplier = async (id: number, supplier: Supplier) => {
    try {
      await fetch(`${API_BASE}/inventory/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateInvoice = async (id: number, invoice: Invoice) => {
    try {
      const { Patient, Doctor, InvoiceItems, ...rest } = invoice as any;
      await fetch(`${API_BASE}/billing/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateDepartment = async (id: number, name: string) => {
    try {
      await fetch(`${API_BASE}/admin/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DepartmentId: id, DepartmentName: name })
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateDoctor = async (id: number, doctor: Doctor) => {
    try {
      const { User, Department, ...rest } = doctor as any;
      await fetch(`${API_BASE}/admin/doctors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const addDoctor = async (doctor: Omit<Doctor, 'DoctorId'>) => {
    try {
      const response = await fetch(`${API_BASE}/admin/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctor)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to add doctor.');
      }
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error adding doctor');
    }
  };

  const updateUser = async (id: number, user: User) => {
    try {
      const { Role, Doctor, ...rest } = user as any;
      await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const addUser = async (user: Omit<User, 'UserId' | 'CreatedAt'>) => {
    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to add user.');
      }
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error adding user');
    }
  };

  const updateTreatment = async (id: number, treatment: Treatment) => {
    try {
      const { Patient, Doctor, ...rest } = treatment as any;
      await fetch(`${API_BASE}/treatments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Patients Action
  const addPatient = async (patient: Omit<Patient, 'PatientId' | 'CreatedAt'>) => {
    try {
      await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };



  // 2. Appointments Action
  const addAppointment = async (appt: Omit<Appointment, 'AppointmentId' | 'TokenNumber' | 'CreatedAt'>) => {
    try {
      await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appt)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateAppointmentStatus = async (id: number, status: Appointment['Status']) => {
    try {
      await fetch(`${API_BASE}/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Clinical Consultations & Prescriptions Action
  const addConsultation = async (
    consult: Omit<Consultation, 'ConsultationId' | 'CreatedAt'>,
    prescs: Omit<Prescription, 'PrescriptionId' | 'ConsultationId'>[]
  ) => {
    try {
      const payload = {
        ...consult,
        Prescriptions: prescs
      };
      await fetch(`${API_BASE}/appointments/${consult.AppointmentId}/consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Treatments Action
  const addTreatment = async (
    treatment: Omit<Treatment, 'TreatmentId' | 'CreatedAt'>,
    steps: string[]
  ) => {
    try {
      const payload = {
        ...treatment,
        TreatmentSteps: steps.map(s => ({ StepDescription: s, Status: 'Pending' }))
      };
      await fetch(`${API_BASE}/treatments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateTreatmentStatus = async (id: number, status: Treatment['Status']) => {
    try {
      const tx = treatments.find(t => t.TreatmentId === id);
      if (!tx) return;
      const { Patient, Doctor, ...rest } = tx as any;
      const payload = { ...rest, Status: status };
      await fetch(`${API_BASE}/treatments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStepStatus = async (stepId: number) => {
    try {
      const step = treatmentSteps.find(s => s.StepId === stepId);
      if (!step) return;
      const nextStatus = step.Status === 'Completed' ? 'Pending' : 'Completed';
      await fetch(`${API_BASE}/treatments/steps/${stepId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextStatus)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Stock Transactions Action
  const addStockTransaction = async (
    tx: Omit<InventoryTransaction, 'TransactionId' | 'TransactionDate' | 'UserId' | 'QuantityBefore' | 'QuantityAfter'>
  ) => {
    try {
      await fetch(`${API_BASE}/inventory/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ItemId: tx.ItemId,
          TransactionType: tx.TransactionType,
          QuantityChange: tx.QuantityChange,
          Remarks: tx.Remarks
        })
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = async (item: Omit<Item, 'ItemId'>) => {
    try {
      await fetch(`${API_BASE}/inventory/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateItem = async (itemId: number, item: Item) => {
    try {
      await fetch(`${API_BASE}/inventory/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'SupplierId'>) => {
    try {
      await fetch(`${API_BASE}/inventory/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const addPurchase = async (purchase: {
    SupplierId: number;
    PaymentMode: string;
    Discount: number;
    TaxAmount: number;
    Notes: string;
    Items: {
      ItemId: number;
      Quantity: number;
      PurchaseRate: number;
      BatchNumber?: string;
      ExpiryDate?: string;
    }[];
    PaidAmount: number;
  }) => {
    try {
      await fetch(`${API_BASE}/inventory/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchase)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const paySupplier = async (payment: {
    SupplierId: number;
    PaymentMode: string;
    Amount: number;
    VoucherNo: string;
    Notes?: string;
  }) => {
    try {
      await fetch(`${API_BASE}/inventory/pay-supplier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const addLedger = async (ledger: any) => {
    try {
      const response = await fetch(`${API_BASE}/accounting/ledgers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ledger)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to add ledger.');
      }
      await loadAllData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateLedger = async (id: number, ledger: any) => {
    try {
      const response = await fetch(`${API_BASE}/accounting/ledgers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ledger)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update ledger.');
      }
      await loadAllData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteLedger = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/accounting/ledgers/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete ledger.');
      }
      await loadAllData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // 6. Invoicing Action (Double entry accounting side-effect)
  const addInvoice = async (
    invoice: Omit<Invoice, 'InvoiceId' | 'InvoiceNumber' | 'InvoiceDate' | 'SubTotal' | 'TotalAmount' | 'PaidAmount' | 'Status'>,
    itemsList: Omit<InvoiceItem, 'InvoiceItemId' | 'InvoiceId' | 'Amount'>[]
  ) => {
    try {
      const payload = {
        PatientId: invoice.PatientId,
        DoctorId: invoice.DoctorId,
        ConsultationId: invoice.ConsultationId,
        Discount: invoice.Discount,
        TaxAmount: invoice.TaxAmount,
        Notes: invoice.Notes,
        InvoiceItems: itemsList.map(item => ({
          ItemType: item.ItemType,
          ReferenceId: item.ReferenceId,
          Description: item.Description,
          Quantity: item.Quantity,
          Rate: item.Rate
        }))
      };
      await fetch(`${API_BASE}/billing/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Record Payment Receipt Action (Double Entry side-effect)
  const recordPayment = async (
    payment: Omit<Payment, 'PaymentId' | 'PaymentDate' | 'AccountTransactionId' | 'UserId'>
  ) => {
    try {
      await fetch(`${API_BASE}/billing/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // 8. Admin User Toggling
  const toggleUserStatus = async (userId: number) => {
    try {
      const user = users.find(u => u.UserId === userId);
      if (!user) return;
      const { Role, Doctor, ...rest } = user as any;
      const payload = { ...rest, IsActive: !user.IsActive };
      await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // 9. Role Permissions Matrix Checklist
  const toggleRolePermission = async (roleId: number, permissionId: number) => {
    try {
      await fetch(`${API_BASE}/admin/role-permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ RoleId: roleId, PermissionId: permissionId })
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // 10. Departments Add
  const addDepartment = async (name: string) => {
    try {
      await fetch(`${API_BASE}/admin/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DepartmentName: name })
      });
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // 11. Attendance Handlers
  const clockIn = async (userId: number, notes?: string) => {
    const res = await fetch(`${API_BASE}/attendance/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserId: userId, Notes: notes })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Clock-in failed.');
    }
    await loadAllData();
  };

  const clockOut = async (userId: number, notes?: string) => {
    const res = await fetch(`${API_BASE}/attendance/clock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserId: userId, Notes: notes })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Clock-out failed.');
    }
    await loadAllData();
  };

  const addManualAttendance = async (record: { UserId: number; ClockIn: string; ClockOut?: string | null; Notes?: string | null }) => {
    const res = await fetch(`${API_BASE}/attendance/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Log manual attendance failed.');
    }
    await loadAllData();
  };

  const updateAttendance = async (id: number, record: Attendance) => {
    const res = await fetch(`${API_BASE}/attendance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Update attendance failed.');
    }
    await loadAllData();
  };

  const deleteAttendance = async (id: number) => {
    const res = await fetch(`${API_BASE}/attendance/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Delete attendance failed.');
    }
    await loadAllData();
  };

  // Low stock global indicator calculation
  const lowStockCount = items.filter(i => i.CurrentStock <= i.ReorderLevel).length;

  if (!token || !currentUser) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.4rem'
            }}>
              DS
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Dental Suite</h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: 600 }}>CLINIC CONTROL ACCESS</span>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Username</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter username" 
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Enter password" 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>

            {loginError && (
              <div style={{ 
                color: '#f87171', 
                background: 'rgba(239, 68, 68, 0.1)', 
                padding: '10px', 
                borderRadius: '8px', 
                fontSize: '0.8rem',
                border: '1px solid rgba(239, 68, 68, 0.2)' 
              }}>
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoggingIn}
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                padding: '12px',
                borderRadius: '8px',
                marginTop: '8px',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              {isLoggingIn ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Demo Accounts:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                { name: 'Super Admin', username: 'admin' },
                { name: 'Doctor James', username: 'dr.james' },
                { name: 'Receptionist', username: 'linda.reception' },
                { name: 'Accountant', username: 'robert.accountant' }
              ].map(demo => (
                <button
                  key={demo.username}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px' }}
                  onClick={() => {
                    setLoginUsername(demo.username);
                    setLoginPassword('password');
                  }}
                >
                  {demo.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Receptionist shift open control guard
  if (currentUser.RoleId === 3 && !activeShift) {
    const totalOpen = Object.entries(shiftDenomCounts).reduce(
      (sum, [denom, count]) => sum + parseInt(denom) * (count || 0), 0
    ) + Number(shiftCoins);

    return (
      <div className="login-page" style={{ overflowY: 'auto', padding: '40px 20px' }}>
        <div className="login-card" style={{ maxWidth: '500px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.4rem'
            }}>
              DS
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Open Cash Drawer</h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: 600 }}>CASHIER SHIFT MANDATORY OPERATION</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
            Hi <strong>{currentUser.FullName}</strong>. You are logged in as a Receptionist. Before performing any tasks, you must declare the opening cash in the drawer.
          </p>

          <form onSubmit={handleOpenShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currency Denomination Count</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {denominations.map(denom => (
                  <div key={denom} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '60px' }}>{currencySymbol}{denom}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>x</span>
                    <input 
                      type="number"
                      className="input-field"
                      min="0"
                      placeholder="0"
                      value={shiftDenomCounts[denom] || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setShiftDenomCounts(prev => ({ ...prev, [denom]: val }));
                      }}
                      style={{ width: '80px', padding: '4px 8px', height: 'auto', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', width: '90px', textAlign: 'right' }}>
                      {currencySymbol}{((shiftDenomCounts[denom] || 0) * denom).toFixed(2)}
                    </span>
                  </div>
                ))}
                
                {/* Coins / Cent Change */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '60px' }}>Coins/Cent</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>value</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field"
                    placeholder="0.00"
                    value={shiftCoins || ''}
                    onChange={(e) => setShiftCoins(parseFloat(e.target.value) || 0)}
                    style={{ width: '80px', padding: '4px 8px', height: 'auto', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', width: '90px', textAlign: 'right' }}>
                    {currencySymbol}{shiftCoins.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Display */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-purple-glow)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--accent-purple)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total Drawer Cash:</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{currencySymbol}{totalOpen.toFixed(2)}</strong>
            </div>

            {shiftError && (
              <div style={{ 
                color: '#f87171', 
                background: 'rgba(239, 68, 68, 0.1)', 
                padding: '10px', 
                borderRadius: '8px', 
                fontSize: '0.8rem',
                border: '1px solid rgba(239, 68, 68, 0.2)' 
              }}>
                {shiftError}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isShiftSaving}
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {isShiftSaving ? 'Opening Shift...' : 'Start Cash Shift & Unlock App'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleLogout}
              style={{ width: '100%', border: 'none', background: 'transparent' }}
            >
              Sign Out / Cancel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Mobile Navigation Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* 1. Frosted Glass Navigation Sidebar */}
      <aside 
        className={isSidebarOpen ? 'open' : ''}
        style={{ 
          width: '260px', 
          background: 'var(--bg-sidebar)', 
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px'
        }}
      >
        
        {/* Upper Sidebar Logo & Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Brand header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingLeft: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '8px', 
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800
              }}>
                DS
              </div>
              <div>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Dental Suite</h1>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-teal)', fontWeight: 600 }}>CLINIC CONTROL</span>
              </div>
            </div>
            <button className="hamburger-btn mobile-only-close" style={{ padding: '6px' }} onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links list */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            
            {/* Dashboard tab */}
            {isTabAllowed('dashboard') && (
              <button 
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: tab === 'dashboard' ? 'var(--accent-purple-glow)' : 'transparent',
                  color: tab === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'dashboard' ? 600 : 400,
                  borderLeft: tab === 'dashboard' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0'
                }}
                onClick={() => handleTabChange('dashboard')}
              >
                <LayoutDashboard size={18} style={{ color: tab === 'dashboard' ? 'var(--accent-purple)' : 'inherit' }} /> Dashboard
              </button>
            )}

            {/* Patients tab */}
            {isTabAllowed('patients') && (
              <button 
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: tab === 'patients' ? 'var(--accent-purple-glow)' : 'transparent',
                  color: tab === 'patients' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'patients' ? 600 : 400,
                  borderLeft: tab === 'patients' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0'
                }}
                onClick={() => handleTabChange('patients')}
              >
                <Users size={18} style={{ color: tab === 'patients' ? 'var(--accent-purple)' : 'inherit' }} /> Patients Chart
              </button>
            )}

            {/* Appointments tab */}
            {isTabAllowed('appointments') && (
              <button 
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: tab === 'appointments' ? 'var(--accent-purple-glow)' : 'transparent',
                  color: tab === 'appointments' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'appointments' ? 600 : 400,
                  borderLeft: tab === 'appointments' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0'
                }}
                onClick={() => handleTabChange('appointments')}
              >
                <Calendar size={18} style={{ color: tab === 'appointments' ? 'var(--accent-purple)' : 'inherit' }} /> Queue Scheduler
              </button>
            )}

            {/* Treatments planner tab */}
            {isTabAllowed('treatments') && (
              <button 
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: tab === 'treatments' ? 'var(--accent-purple-glow)' : 'transparent',
                  color: tab === 'treatments' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'treatments' ? 600 : 400,
                  borderLeft: tab === 'treatments' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0'
                }}
                onClick={() => handleTabChange('treatments')}
              >
                <Activity size={18} style={{ color: tab === 'treatments' ? 'var(--accent-purple)' : 'inherit' }} /> Treatment Plans
              </button>
            )}

            {/* Inventory tab */}
            {isTabAllowed('inventory') && (
              <button 
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: tab === 'inventory' ? 'var(--accent-purple-glow)' : 'transparent',
                  color: tab === 'inventory' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'inventory' ? 600 : 400,
                  borderLeft: tab === 'inventory' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0'
                }}
                onClick={() => handleTabChange('inventory')}
              >
                <Package size={18} style={{ color: tab === 'inventory' ? 'var(--accent-purple)' : 'inherit' }} /> stock Inventory
                {lowStockCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                    {lowStockCount}
                  </span>
                )}
              </button>
            )}

            {/* Purchases tab */}
            {isTabAllowed('purchases') && (
              <button 
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: tab === 'purchases' ? 'var(--accent-purple-glow)' : 'transparent',
                  color: tab === 'purchases' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'purchases' ? 600 : 400,
                  borderLeft: tab === 'purchases' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0'
                }}
                onClick={() => handleTabChange('purchases')}
              >
                <ShoppingBag size={18} style={{ color: tab === 'purchases' ? 'var(--accent-purple)' : 'inherit' }} /> Purchases
              </button>
            )}

            {/* Billing tab */}
            {isTabAllowed('billing') && (
              <button 
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: tab === 'billing' ? 'var(--accent-purple-glow)' : 'transparent',
                  color: tab === 'billing' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'billing' ? 600 : 400,
                  borderLeft: tab === 'billing' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0'
                }}
                onClick={() => handleTabChange('billing')}
              >
                <DollarSign size={18} style={{ color: tab === 'billing' ? 'var(--accent-purple)' : 'inherit' }} /> Billing Accounts
              </button>
            )}

            {/* Accounting tab */}
            {isTabAllowed('accounting') && (
              <button 
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: tab === 'accounting' ? 'var(--accent-purple-glow)' : 'transparent',
                  color: tab === 'accounting' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'accounting' ? 600 : 400,
                  borderLeft: tab === 'accounting' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0'
                }}
                onClick={() => handleTabChange('accounting')}
              >
                <Briefcase size={18} style={{ color: tab === 'accounting' ? 'var(--accent-purple)' : 'inherit' }} /> Accounts Ledger
              </button>
            )}

            {/* Attendance tab */}
            {isTabAllowed('attendance') && (
              <button 
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: tab === 'attendance' ? 'var(--accent-purple-glow)' : 'transparent',
                  color: tab === 'attendance' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'attendance' ? 600 : 400,
                  borderLeft: tab === 'attendance' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0'
                }}
                onClick={() => handleTabChange('attendance')}
              >
                <Clock size={18} style={{ color: tab === 'attendance' ? 'var(--accent-purple)' : 'inherit' }} /> Attendance
              </button>
            )}

            {/* Administration settings tab */}
            {isTabAllowed('admin') && (
              <button 
                className="btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: tab === 'admin' ? 'var(--accent-purple-glow)' : 'transparent',
                  color: tab === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'admin' ? 600 : 400,
                  borderLeft: tab === 'admin' ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0'
                }}
                onClick={() => handleTabChange('admin')}
              >
                <Settings size={18} style={{ color: tab === 'admin' ? 'var(--accent-purple)' : 'inherit' }} /> Administration
              </button>
            )}

          </nav>
        </div>

        {/* Lower Sidebar Theme Toggler & User Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sun size={16} /> Light theme</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Moon size={16} /> Dark theme</span>
            )}
          </button>

          {currentUser && currentUser.RoleId === 3 && activeShift && (
            <button 
              className="btn" 
              style={{ 
                width: '100%', 
                justifyContent: 'center',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 600,
                borderRadius: '8px',
                padding: '8px 12px',
                marginTop: '8px'
              }}
              onClick={handleCloseShiftRecalculate}
            >
              Close Shift Drawer
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div 
              onClick={openProfileModal}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-purple-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                flex: 1, 
                minWidth: 0,
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
              }}
              title="View & Edit Profile"
            >
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                flexShrink: 0
              }}>
                {currentUser ? currentUser.FullName.split(' ').map(n => n[0]).join('') : 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                  {currentUser ? currentUser.FullName : 'User Profile'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser ? (roles.find(r => r.RoleId === currentUser.RoleId)?.RoleName || `Role #${currentUser.RoleId}`) : ''}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer'
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>

      </aside>

      {/* 2. Main Page Layout Wrapper */}
      <main style={{ 
        flex: 1, 
        height: '100vh', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--bg-app)'
      }}>

        {/* Mobile Header Bar */}
        <div className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '6px', 
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.8rem'
              }}>
                DS
              </div>
              <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Dental Suite</h1>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        
        {/* Top Control Bar */}
        <header style={{ 
          height: '70px', 
          borderBottom: '1px solid var(--border-color)', 
          padding: '0 30px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Active Module</span>
            <h2 style={{ fontSize: '1.25rem', marginTop: '2px', textTransform: 'capitalize' }}>{tab}</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Quick notifications */}
            {lowStockCount > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '0.8rem', 
                background: 'rgba(245, 158, 11, 0.1)', 
                color: 'rgb(245, 158, 11)',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <Bell size={14} />
                <span>{lowStockCount} materials at reorder level</span>
              </div>
            )}

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Server Time: <strong>{currentTime}</strong>
            </div>

          </div>
        </header>

        {/* Tab Router Panels */}
        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {tab === 'dashboard' && isTabAllowed('dashboard') && (
            <Dashboard 
              patients={patients}
              appointments={appointments}
              doctors={doctors}
              users={users}
              items={items}
              invoices={invoices}
              setTab={setTab}
              updateAppointmentStatus={updateAppointmentStatus}
              openBookingModal={() => setIsBookingModalOpen(true)}
              openPatientModal={() => setIsPatientModalOpen(true)}
              currentUser={currentUser}
            />
          )}

          {tab === 'patients' && isTabAllowed('patients') && (
            <PatientsTab 
              patients={patients}
              appointments={appointments}
              treatments={treatments}
              invoices={invoices}
              ledgers={ledgers}
              doctors={doctors}
              users={users}
              addPatient={addPatient}
              updatePatient={updatePatient}
              currentUser={currentUser || { RoleId: 0 } as any}
              isAddModalOpen={isPatientModalOpen}
              setIsAddModalOpen={setIsPatientModalOpen}
              currencySymbol={currencySymbol}
            />
          )}

          {tab === 'appointments' && isTabAllowed('appointments') && (
            <AppointmentsTab 
              appointments={appointments}
              patients={patients}
              doctors={doctors}
              users={users}
              items={items}
              addAppointment={addAppointment}
              updateAppointment={updateAppointment}
              updateAppointmentStatus={updateAppointmentStatus}
              addConsultation={addConsultation}
              currentUser={currentUser || { RoleId: 0 } as any}
              isBookingModalOpen={isBookingModalOpen}
              setIsBookingModalOpen={setIsBookingModalOpen}
              currencySymbol={currencySymbol}
            />
          )}

          {tab === 'treatments' && isTabAllowed('treatments') && (
            <TreatmentsTab 
              treatments={treatments}
              treatmentSteps={treatmentSteps}
              patients={patients}
              doctors={doctors}
              users={users}
              addTreatment={addTreatment}
              updateTreatment={updateTreatment}
              updateTreatmentStatus={updateTreatmentStatus}
              toggleStepStatus={toggleStepStatus}
              currentUser={currentUser || { RoleId: 0 } as any}
              currencySymbol={currencySymbol}
            />
          )}

          {tab === 'inventory' && isTabAllowed('inventory') && (
            <InventoryTab 
              items={items}
              categories={categories}
              units={units}
              addStockTransaction={addStockTransaction}
              addItem={addItem}
              updateItem={updateItem}
              currentUser={currentUser || { RoleId: 0 } as any}
              currencySymbol={currencySymbol}
            />
          )}

          {tab === 'purchases' && isTabAllowed('purchases') && (
            <PurchasesTab 
              items={items}
              suppliers={suppliers}
              transactions={inventoryTransactions}
              accountTransactions={accountTransactions}
              users={users}
              ledgers={ledgers}
              addSupplier={addSupplier}
              updateSupplier={updateSupplier}
              addPurchase={addPurchase}
              paySupplier={paySupplier}
              currentUser={currentUser || { RoleId: 0 } as any}
              currencySymbol={currencySymbol}
            />
          )}

          {tab === 'billing' && isTabAllowed('billing') && (
            <BillingTab 
              invoices={invoices}
              invoiceItems={invoiceItems}
              payments={payments}
              patients={patients}
              doctors={doctors}
              users={users}
              consultations={consultations}
              treatments={treatments}
              appointments={appointments}
              items={items}
              addInvoice={addInvoice}
              updateInvoice={updateInvoice}
              recordPayment={recordPayment}
              currentUser={currentUser || { RoleId: 0 } as any}
              currencySymbol={currencySymbol}
            />
          )}

          {tab === 'accounting' && isTabAllowed('accounting') && (
            <AccountingTab 
              ledgers={ledgers}
              accountGroups={accountGroups}
              transactions={accountTransactions}
              currencySymbol={currencySymbol}
              addLedger={addLedger}
              updateLedger={updateLedger}
              deleteLedger={deleteLedger}
            />
          )}

          {tab === 'attendance' && isTabAllowed('attendance') && (
            <AttendanceTab 
              attendances={attendances}
              currentUser={currentUser || { RoleId: 0 } as any}
              users={users}
              roles={roles}
              clockIn={clockIn}
              clockOut={clockOut}
              addManualAttendance={addManualAttendance}
              updateAttendance={updateAttendance}
              deleteAttendance={deleteAttendance}
            />
          )}

          {tab === 'admin' && isTabAllowed('admin') && (
            <AdminTab 
              users={users}
              roles={roles}
              permissions={permissions}
              rolePermissions={rolePermissions}
              departments={departments}
              toggleUserStatus={toggleUserStatus}
              toggleRolePermission={toggleRolePermission}
              addDepartment={addDepartment}
              updateDepartment={updateDepartment}
              updateDoctor={updateDoctor}
              updateUser={updateUser}
              addUser={addUser}
              doctors={doctors}
              addDoctor={addDoctor}
              currentUser={currentUser || { RoleId: 0 } as any}
              selectedCountry={selectedCountry}
              currencySymbol={currencySymbol}
              denominations={denominations}
              onCountryChange={handleCountryChange}
            />
          )}
        </div>

      </main>

      {/* 3. My Profile Modal Overlay */}
      {isProfileModalOpen && (
        <div 
          className="modal-overlay"
          style={{ zIndex: 2000 }}
          onClick={() => setIsProfileModalOpen(false)}
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Profile</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Update your account credentials and personal info</span>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px', minWidth: 'auto', border: 'none', background: 'transparent' }} 
                onClick={() => setIsProfileModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>New Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••"
                  value={profilePassword}
                  onChange={e => setProfilePassword(e.target.value)}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Leave blank to keep your current password</span>
              </div>

              {profileError && (
                <div style={{ 
                  color: '#f87171', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  fontSize: '0.8rem',
                  border: '1px solid rgba(239, 68, 68, 0.2)' 
                }}>
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div style={{ 
                  color: '#34d399', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  fontSize: '0.8rem',
                  border: '1px solid rgba(16, 185, 129, 0.2)' 
                }}>
                  Profile updated successfully!
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsProfileModalOpen(false)}
                  disabled={isUpdatingProfile}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))', border: 'none', color: '#ffffff' }}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Close Shift Modal Overlay */}
      {isCloseShiftModalOpen && recalculatedShiftData && (
        <div 
          className="modal-overlay"
          style={{ zIndex: 2000 }}
          onClick={() => setIsCloseShiftModalOpen(false)}
        >
          <div 
            style={{
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
              margin: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Close Cash Drawer Shift</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reconcile counter cash drawer before shift end</span>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px', minWidth: 'auto', border: 'none', background: 'transparent' }} 
                onClick={() => setIsCloseShiftModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Reconciliation Details Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px', 
              background: 'rgba(0, 0, 0, 0.15)', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Opening Cash:</span>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '2px' }}>
                  {currencySymbol}{recalculatedShiftData.OpeningCash.toFixed(2)}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Cash Sales (Inflows):</span>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--accent-teal)', marginTop: '2px' }}>
                  +{currencySymbol}{recalculatedShiftData.CashSales.toFixed(2)}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}></div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Cash Outflows:</span>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#f87171', marginTop: '2px' }}>
                  -{currencySymbol}{recalculatedShiftData.CashOutflows.toFixed(2)}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Expected Cash:</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {currencySymbol}{recalculatedShiftData.ExpectedCash.toFixed(2)}
                </div>
              </div>
            </div>

            <form onSubmit={handleCloseShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Declare Closing Count</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '6px' }}>
                  {denominations.map(denom => (
                    <div key={denom} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '60px' }}>{currencySymbol}{denom}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>x</span>
                      <input 
                        type="number"
                        className="input-field"
                        min="0"
                        placeholder="0"
                        value={shiftDenomCounts[denom] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setShiftDenomCounts(prev => ({ ...prev, [denom]: val }));
                        }}
                        style={{ width: '80px', padding: '4px 8px', height: 'auto', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', width: '90px', textAlign: 'right' }}>
                        {currencySymbol}{((shiftDenomCounts[denom] || 0) * denom).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  
                  {/* Coins / Cent Change */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '60px' }}>Coins/Cent</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>value</span>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field"
                      placeholder="0.00"
                      value={shiftCoins || ''}
                      onChange={(e) => setShiftCoins(parseFloat(e.target.value) || 0)}
                      style={{ width: '80px', padding: '4px 8px', height: 'auto', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', width: '90px', textAlign: 'right' }}>
                      {currencySymbol}{shiftCoins.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Display */}
              {(() => {
                const totalClose = Object.entries(shiftDenomCounts).reduce(
                  (sum, [denom, count]) => sum + parseInt(denom) * (count || 0), 0
                ) + Number(shiftCoins);
                const isDiscrepancy = Math.abs(totalClose - recalculatedShiftData.ExpectedCash) > 0.005;
                const difference = totalClose - recalculatedShiftData.ExpectedCash;

                return (
                  <>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: isDiscrepancy ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-purple-glow)', 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: isDiscrepancy ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--accent-purple)' 
                    }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total Counted Cash:</span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{currencySymbol}{totalClose.toFixed(2)}</strong>
                    </div>

                    {isDiscrepancy ? (
                      <div style={{ 
                        color: '#f87171', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        fontSize: '0.8rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        lineHeight: '1.4'
                      }}>
                        <strong>Discrepancy: {difference > 0 ? '+' : ''}{currencySymbol}{difference.toFixed(2)}</strong>
                        <br />
                        closing counted cash must exactly match expected cash ({currencySymbol}{recalculatedShiftData.ExpectedCash.toFixed(2)}) to close shift.
                      </div>
                    ) : (
                      <div style={{ 
                        color: '#34d399', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        padding: '10px', 
                        borderRadius: '8px', 
                        fontSize: '0.8rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)' 
                      }}>
                        Drawer reconciled. Ready to close.
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Shift Closing Notes</label>
                      <textarea 
                        className="input-field"
                        rows={2}
                        placeholder="Enter shift remarks, cash handling notes, etc."
                        value={shiftNotes}
                        onChange={e => setShiftNotes(e.target.value)}
                        style={{ resize: 'none', height: 'auto', padding: '8px' }}
                      />
                    </div>

                    {shiftError && (
                      <div style={{ 
                        color: '#f87171', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        padding: '10px', 
                        borderRadius: '8px', 
                        fontSize: '0.8rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)' 
                      }}>
                        {shiftError}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => setIsCloseShiftModalOpen(false)}
                        disabled={isShiftSaving}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))', border: 'none', color: '#ffffff' }}
                        disabled={isShiftSaving || isDiscrepancy}
                      >
                        {isShiftSaving ? 'Closing Shift...' : 'Reconcile & Close Shift'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
