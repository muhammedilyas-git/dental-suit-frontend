import React, { useState, useEffect } from 'react';
import type { Invoice, Patient, Doctor, InvoiceItem, Payment, Consultation, Treatment, User, Appointment, Item } from '../types';
import { Plus, CreditCard, Printer, X, Search, Edit, Settings } from 'lucide-react';

import clinicLogo from '../assets/clinic_logo.png';
import dentalXray from '../assets/dental_xray.png';
import doctorSign from '../assets/doctor_sign.png';

interface InvoiceTemplateConfig {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  logoType: 'none' | 'preset' | 'custom';
  customLogoUrl: string;
  showCustomPicture: boolean;
  pictureType: 'none' | 'xray' | 'signature' | 'custom';
  customPictureUrl: string;
  primaryColor: string;
  fontFamily: 'monospace' | 'sans-serif' | 'serif';
  headerNote: string;
  footerTerms: string;
  showDoctorName: boolean;
}

const DEFAULT_TEMPLATE_CONFIG: InvoiceTemplateConfig = {
  clinicName: 'DENTAL SUITE CLINICS',
  clinicAddress: '100 Dental Science Way, Medical District, NY',
  clinicPhone: 'Tel: +1 (555) DENTIST',
  logoType: 'preset',
  customLogoUrl: '',
  showCustomPicture: false,
  pictureType: 'none',
  customPictureUrl: '',
  primaryColor: '#8b5cf6', // purple
  fontFamily: 'monospace',
  headerNote: '',
  footerTerms: '~ Thank you for your visit. Keep smiling! ~',
  showDoctorName: true
};

const API_BASE = window.location.port === '5173' || window.location.port === '4173' || window.location.port === '5166'
  ? '/api'
  : (window.location.origin.includes('5166') ? '/api' : 'http://localhost:5166/api');

interface BillingTabProps {
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payments: Payment[];
  patients: Patient[];
  doctors: Doctor[];
  users: User[];
  consultations: Consultation[];
  treatments: Treatment[];
  appointments: Appointment[];
  items: Item[];
  addInvoice: (
    invoice: Omit<Invoice, 'InvoiceId' | 'InvoiceNumber' | 'InvoiceDate' | 'SubTotal' | 'TotalAmount' | 'PaidAmount' | 'Status'>,
    items: Omit<InvoiceItem, 'InvoiceItemId' | 'InvoiceId' | 'Amount'>[]
  ) => void;
  updateInvoice: (id: number, invoice: Invoice) => void;
  recordPayment: (
    payment: Omit<Payment, 'PaymentId' | 'PaymentDate' | 'AccountTransactionId' | 'UserId'>
  ) => void;
  currentUser: User;
  currencySymbol?: string;
}

export const BillingTab: React.FC<BillingTabProps> = ({
  invoices,
  invoiceItems,
  payments,
  patients,
  doctors,
  users,
  consultations,
  treatments,
  appointments,
  items,
  addInvoice,
  updateInvoice,
  recordPayment,
  currentUser,
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

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState<number | null>(null);
  const [invoiceEditForm, setInvoiceEditForm] = useState({
    Status: 'Draft' as Invoice['Status'],
    Discount: 0,
    TaxAmount: 0,
    Notes: ''
  });

  // Fetch system settings on load to get the custom invoice template config
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/settings`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.InvoiceTemplateConfig) {
          try {
            const config = JSON.parse(data.InvoiceTemplateConfig);
            setTemplateConfig(config);
            setDesignerForm(config);
          } catch (e) {
            console.error('Failed to parse invoice template config:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load invoice template configuration from backend settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Invoice Designer States
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [templateConfig, setTemplateConfig] = useState<InvoiceTemplateConfig>(() => {
    const saved = localStorage.getItem('invoiceTemplateConfig');
    if (saved) {
      try {
        return { ...DEFAULT_TEMPLATE_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_TEMPLATE_CONFIG;
      }
    }
    return DEFAULT_TEMPLATE_CONFIG;
  });

  // Designer temporary form state
  const [designerForm, setDesignerForm] = useState<InvoiceTemplateConfig>({ ...templateConfig });

  const handleEditInvoice = (inv: Invoice) => {
    setEditInvoiceId(inv.InvoiceId);
    setInvoiceEditForm({
      Status: inv.Status,
      Discount: inv.Discount,
      TaxAmount: inv.TaxAmount,
      Notes: inv.Notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoiceId) return;

    const existing = invoices.find(i => i.InvoiceId === editInvoiceId);
    if (!existing) return;

    updateInvoice(editInvoiceId, {
      ...existing,
      Status: invoiceEditForm.Status,
      Discount: Number(invoiceEditForm.Discount) || 0,
      TaxAmount: Number(invoiceEditForm.TaxAmount) || 0,
      Notes: invoiceEditForm.Notes
    });

    setIsEditModalOpen(false);
    setEditInvoiceId(null);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [balanceFilter, setBalanceFilter] = useState('All');
  const [amountFilter, setAmountFilter] = useState('All');

  const filteredInvoices = invoices.filter(inv => {
    const patName = getPatientName(inv.PatientId).toLowerCase();
    const invNum = inv.InvoiceNumber.toLowerCase();
    const notes = (inv.Notes || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = patName.includes(search) || invNum.includes(search) || notes.includes(search);

    const matchesStatus = statusFilter === 'All' || inv.Status === statusFilter;

    let matchesBalance = true;
    if (balanceFilter === 'HasOutstanding') {
      matchesBalance = inv.TotalAmount > inv.PaidAmount;
    } else if (balanceFilter === 'FullyPaid') {
      matchesBalance = inv.TotalAmount <= inv.PaidAmount;
    }

    let matchesAmount = true;
    if (amountFilter === 'Low') {
      matchesAmount = inv.TotalAmount < 100;
    } else if (amountFilter === 'Medium') {
      matchesAmount = inv.TotalAmount >= 100 && inv.TotalAmount <= 500;
    } else if (amountFilter === 'High') {
      matchesAmount = inv.TotalAmount > 500;
    }

    return matchesSearch && matchesStatus && matchesBalance && matchesAmount;
  }).sort((a, b) => b.InvoiceId - a.InvoiceId);

  const [invoiceForm, setInvoiceForm] = useState({
    PatientId: '',
    DoctorId: '',
    ConsultationId: '',
    Discount: 0.00,
    TaxAmount: 0.00,
    Notes: ''
  });

  // Filter completed consultations that have not been invoiced yet
  const pendingConsultations = consultations.filter(c => {
    const isAlreadyInvoiced = invoices.some(inv => inv.ConsultationId === c.ConsultationId);
    if (isAlreadyInvoiced) return false;
    const appt = appointments.find(a => a.AppointmentId === c.AppointmentId);
    return appt && appt.Status === 'Completed';
  }).sort((a, b) => b.ConsultationId - a.ConsultationId);

  const [billingItems, setBillingItems] = useState<(Omit<InvoiceItem, 'InvoiceItemId' | 'InvoiceId' | 'Amount'> & { Amount: number; ReferenceId?: number })[]>([]);

  // Payment form states
  const [paymentForm, setPaymentForm] = useState({
    Amount: 0.00,
    PaymentMode: 'Cash' as Payment['PaymentMode'],
    TransactionReference: ''
  });

  // Handlers for Invoice Creation
  const handleConsultationSelectChange = (consultIdStr: string) => {
    const cId = parseInt(consultIdStr);
    if (isNaN(cId)) {
      setInvoiceForm(prev => ({
        ...prev,
        ConsultationId: '',
        PatientId: '',
        DoctorId: '',
        Discount: 0,
        TaxAmount: 0
      }));
      setBillingItems([]);
      return;
    }

    const consult = consultations.find(c => c.ConsultationId === cId);
    if (!consult) return;

    const appt = appointments.find(a => a.AppointmentId === consult.AppointmentId);
    if (!appt) return;

    const patientId = appt.PatientId;
    const doctorId = appt.DoctorId;

    // Load consultation fee
    const consultationFeeItem = {
      ItemType: 'Consultation' as const,
      ReferenceId: consult.ConsultationId,
      Description: 'General Dental Consultation & Diagnostic Checkup',
      Quantity: 1,
      Rate: consult.ConsultationCharges,
      Amount: consult.ConsultationCharges
    };

    // Load medicines (internal prescriptions from this consultation)
    const medicineItems = (consult.Prescriptions || [])
      .filter(p => !p.IsExternalPurchase && p.ItemId)
      .map(p => {
        const itemObj = items.find(i => i.ItemId === p.ItemId);
        const itemName = itemObj ? itemObj.ItemName : (p.ExternalMedicineName || 'Medicine');
        const sellingRate = itemObj ? itemObj.SellingRate : 0;
        return {
          ItemType: 'Medicine' as const,
          ReferenceId: p.PrescriptionId,
          Description: `Medicine: ${itemName}`,
          Quantity: p.Quantity,
          Rate: sellingRate,
          Amount: p.Quantity * sellingRate
        };
      });

    // Load other charges (completed treatments for this patient that are not yet invoiced)
    const invoicedTreatmentIds = new Set(
      invoiceItems.filter(item => item.ItemType === 'Treatment').map(item => item.ReferenceId)
    );
    const patientTreatments = treatments.filter(t => 
      t.PatientId === patientId && 
      t.Status === 'Completed' && 
      !invoicedTreatmentIds.has(t.TreatmentId)
    );
    const treatmentItems = patientTreatments.map(t => ({
      ItemType: 'Treatment' as const,
      ReferenceId: t.TreatmentId,
      Description: `Treatment: ${t.Description || 'Dental Procedure'} (Tooth: ${t.ToothNumber || 'General'})`,
      Quantity: 1,
      Rate: t.EstimatedCost,
      Amount: t.EstimatedCost
    }));

    const loadedItems = [
      consultationFeeItem,
      ...medicineItems,
      ...treatmentItems
    ];

    setInvoiceForm(prev => ({
      ...prev,
      ConsultationId: consultIdStr,
      PatientId: patientId.toString(),
      DoctorId: doctorId.toString(),
      TaxAmount: 0,
      Discount: 0
    }));

    setBillingItems(loadedItems);
  };

  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.PatientId || !invoiceForm.DoctorId || billingItems.length === 0) {
      alert('Patient, Doctor, and at least 1 invoice item line are required. Please select a completed consultation.');
      return;
    }

    addInvoice(
      {
        PatientId: parseInt(invoiceForm.PatientId),
        DoctorId: parseInt(invoiceForm.DoctorId),
        ConsultationId: invoiceForm.ConsultationId ? parseInt(invoiceForm.ConsultationId) : null,
        Discount: Number(invoiceForm.Discount) || 0,
        TaxAmount: Number(invoiceForm.TaxAmount) || 0,
        Notes: invoiceForm.Notes
      },
      billingItems.map(item => ({
        ItemType: item.ItemType,
        ReferenceId: item.ReferenceId,
        Description: item.Description,
        Quantity: item.Quantity,
        Rate: item.Rate
      }))
    );

    // Reset forms
    setInvoiceForm({
      PatientId: '',
      DoctorId: '',
      ConsultationId: '',
      Discount: 0.00,
      TaxAmount: 0.00,
      Notes: ''
    });
    setBillingItems([]);
    setIsInvoiceModalOpen(false);
  };

  // Handlers for payment receipt posting
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;

    recordPayment({
      InvoiceId: selectedInvoiceId,
      Amount: Number(paymentForm.Amount),
      PaymentMode: paymentForm.PaymentMode,
      TransactionReference: paymentForm.TransactionReference
    });

    setPaymentForm({
      Amount: 0.00,
      PaymentMode: 'Cash',
      TransactionReference: ''
    });
    setIsPaymentModalOpen(false);
  };

  const selectedInvoice = invoices.find(i => i.InvoiceId === selectedInvoiceId);
  const selectedInvoiceItems = invoiceItems.filter(item => item.InvoiceId === selectedInvoiceId);
  const selectedInvoicePayments = payments.filter(p => p.InvoiceId === selectedInvoiceId).sort((a, b) => b.PaymentId - a.PaymentId);

  return (
    <>
      <div className={`fade-in billing-main-grid ${selectedInvoiceId ? '' : 'single-column'}`}>
      
      {/* Invoice list */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.4rem' }}>Billing & Invoicing Ledger</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => { setDesignerForm({ ...templateConfig }); setIsDesignerOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={16} /> Invoice Designer
            </button>
            <button className="btn btn-primary" onClick={() => setIsInvoiceModalOpen(true)}>
              <Plus size={16} /> Create Invoice
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '2 1 200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search invoice number, patient, notes..." 
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
            <option value="Draft">Draft</option>
            <option value="Final">Final</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select 
            className="input-field" 
            style={{ flex: '1 1 120px' }}
            value={balanceFilter}
            onChange={e => setBalanceFilter(e.target.value)}
          >
            <option value="All">All Balances</option>
            <option value="HasOutstanding">Has Outstanding</option>
            <option value="FullyPaid">Fully Paid</option>
          </select>
          <select 
            className="input-field" 
            style={{ flex: '1 1 120px' }}
            value={amountFilter}
            onChange={e => setAmountFilter(e.target.value)}
          >
            <option value="All">All Amounts</option>
            <option value="Low">Under {currencySymbol}100</option>
            <option value="Medium">{currencySymbol}100 - {currencySymbol}500</option>
            <option value="High">Above {currencySymbol}500</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Patient</th>
                <th>Total Bill</th>
                <th>Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No invoices found.</td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr 
                    key={inv.InvoiceId}
                    onClick={() => {
                      setSelectedInvoiceId(inv.InvoiceId);
                      // Pre-fill payment amount with outstanding total
                      setPaymentForm(prev => ({ ...prev, Amount: inv.TotalAmount - inv.PaidAmount }));
                    }}
                    style={{ cursor: 'pointer', background: selectedInvoiceId === inv.InvoiceId ? 'rgba(139, 92, 246, 0.08)' : 'transparent' }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{inv.InvoiceNumber}</td>
                    <td style={{ fontWeight: 600 }}>{getPatientName(inv.PatientId)}</td>
                    <td>{currencySymbol}{inv.TotalAmount.toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-teal)' }}>{currencySymbol}{inv.PaidAmount.toFixed(2)}</td>
                    <td>
                      <span className={
                        inv.Status === 'Paid' ? 'badge badge-completed' :
                        inv.Status === 'Draft' ? 'badge badge-draft' : 'badge badge-waiting'
                      } style={{ fontSize: '0.65rem' }}>
                        {inv.Status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Drawer / Simulated Printable Slip */}
      {selectedInvoiceId && selectedInvoice && (
        <div className="glass-panel fade-in" style={{ padding: '24px', position: 'relative' }}>
          
          <button 
            onClick={() => setSelectedInvoiceId(null)}
            style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>

          {/* Receipt Panel */}
          <div style={{ 
            background: 'var(--bg-app)', 
            border: `1.5px solid ${templateConfig.primaryColor}`, 
            padding: '30px', 
            borderRadius: '12px', 
            color: 'var(--text-primary)', 
            fontFamily: templateConfig.fontFamily === 'monospace' ? 'monospace' : templateConfig.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif', 
            fontSize: '0.85rem',
            position: 'relative'
          }}>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center', 
              borderBottom: '1.5px dashed var(--border-color)', 
              paddingBottom: '16px', 
              marginBottom: '16px',
              gap: '8px'
            }}>
              {templateConfig.logoType !== 'none' && (
                <img 
                  src={templateConfig.logoType === 'preset' ? clinicLogo : templateConfig.customLogoUrl} 
                  alt="Clinic Logo" 
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', marginBottom: '4px', color: templateConfig.primaryColor }}>{templateConfig.clinicName}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{templateConfig.clinicAddress}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{templateConfig.clinicPhone}</p>
                {templateConfig.headerNote && (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px', fontWeight: 600 }}>{templateConfig.headerNote}</p>
                )}
              </div>
            </div>

            <div className="billing-summary-grid">
              <div>
                <strong>BILL TO:</strong>
                <p>{getPatientName(selectedInvoice.PatientId)}</p>
                <p>Date: {new Date(selectedInvoice.InvoiceDate).toLocaleDateString()}</p>
                {templateConfig.showDoctorName && selectedInvoice.DoctorId && (
                  <p style={{ marginTop: '4px' }}>Attending Dentist: <strong>{getDoctorName(selectedInvoice.DoctorId)}</strong></p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>INVOICE NO:</strong>
                <p style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>{selectedInvoice.InvoiceNumber}</p>
                <p>Status: {selectedInvoice.Status.toUpperCase()}</p>
              </div>
            </div>

            {/* Invoice Line Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px 0', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoiceItems.map(item => (
                  <tr key={item.InvoiceItemId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 0' }}>{item.Description} ({item.ItemType})</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>{item.Quantity}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>{currencySymbol}{item.Rate.toFixed(2)}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>{currencySymbol}{item.Amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px', width: '200px', marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{currencySymbol}{selectedInvoice.SubTotal.toFixed(2)}</span>
              </div>
              {selectedInvoice.Discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                  <span>Discount:</span>
                  <span>-{currencySymbol}{selectedInvoice.Discount.toFixed(2)}</span>
                </div>
              )}
              {selectedInvoice.TaxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax (5%):</span>
                  <span>+{currencySymbol}{selectedInvoice.TaxAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                <span>Total Due:</span>
                <span>{currencySymbol}{selectedInvoice.TotalAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-teal)', fontWeight: 600 }}>
                <span>Paid Amount:</span>
                <span>{currencySymbol}{selectedInvoice.PaidAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1.5px dashed var(--border-color)', paddingTop: '6px', color: (selectedInvoice.TotalAmount - selectedInvoice.PaidAmount) > 0 ? '#f87171' : 'var(--status-completed-text)' }}>
                <span>Balance:</span>
                <span>{currencySymbol}{(selectedInvoice.TotalAmount - selectedInvoice.PaidAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Audit Logs */}
            {selectedInvoicePayments.length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <strong>PAYMENT HISTORY LOGS:</strong>
                {selectedInvoicePayments.map(p => (
                  <div key={p.PaymentId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <span>{new Date(p.PaymentDate).toLocaleString()} via {p.PaymentMode}</span>
                    <span>Amt: {currencySymbol}{p.Amount.toFixed(2)} (Ref: {p.TransactionReference || 'N/A'})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Picture Field / Attachment */}
            {templateConfig.showCustomPicture && templateConfig.pictureType !== 'none' && (
              <div style={{ 
                marginTop: '20px', 
                borderTop: '1px solid var(--border-color)', 
                paddingTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {templateConfig.pictureType === 'xray' ? 'Clinical Case Attachment (Radiograph)' : templateConfig.pictureType === 'signature' ? 'Doctor Verification Stamp' : 'Invoice Image Attachment'}
                </span>
                <img 
                  src={
                    templateConfig.pictureType === 'xray' ? dentalXray : 
                    templateConfig.pictureType === 'signature' ? doctorSign : 
                    templateConfig.customPictureUrl
                  } 
                  alt="Invoice Attachment" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: templateConfig.pictureType === 'signature' ? '80px' : '180px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color)',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {templateConfig.footerTerms && (
              <div style={{ textAlign: 'center', marginTop: '30px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontStyle: 'italic', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                {templateConfig.footerTerms}
              </div>
            )}

          </div>

          {/* Quick Actions for Invoice */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
            {currentUser.RoleId === 1 && (
              <button className="btn btn-secondary" onClick={() => handleEditInvoice(selectedInvoice)}>
                <Edit size={16} /> Edit Invoice
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => alert('Sending PDF to printer spool...')}>
              <Printer size={16} /> Print Receipt
            </button>
            {selectedInvoice.TotalAmount > selectedInvoice.PaidAmount && (
              <button className="btn btn-teal" onClick={() => setIsPaymentModalOpen(true)}>
                <CreditCard size={16} /> Process Payment Receipt
              </button>
            )}
          </div>

        </div>
      )}
      </div>

      {/* 1. Create Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Generate Clinical Invoice</h2>
              <button 
                onClick={() => setIsInvoiceModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label className="label-text">Select Completed Consultation Appointment *</label>
                <select 
                  className="input-field" 
                  required 
                  value={invoiceForm.ConsultationId}
                  onChange={e => handleConsultationSelectChange(e.target.value)}
                >
                  <option value="">-- Choose Consultation Appointment --</option>
                  {pendingConsultations.map(c => {
                    const appt = appointments.find(a => a.AppointmentId === c.AppointmentId);
                    const patientName = appt ? getPatientName(appt.PatientId) : 'Unknown Patient';
                    const doctorName = appt ? getDoctorName(appt.DoctorId) : 'Unknown Dentist';
                    const dateStr = appt ? new Date(appt.AppointmentDate).toLocaleDateString() : '';
                    return (
                      <option key={c.ConsultationId} value={c.ConsultationId}>
                        {patientName} - {dateStr} (Dentist: {doctorName})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Informational display of Patient & Dentist */}
              {invoiceForm.ConsultationId && (
                <div className="grid-2" style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Patient Name</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {getPatientName(parseInt(invoiceForm.PatientId))}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Attending Dentist</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {getDoctorName(parseInt(invoiceForm.DoctorId))}
                    </div>
                  </div>
                </div>
              )}

              {/* Loaded items list (read-only list) */}
              <div>
                <label className="label-text">Loaded Invoice Line Items</label>
                {billingItems.length === 0 ? (
                  <div style={{ padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-color)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No items loaded. Please select a completed consultation appointment to automatically populate the billable items.
                  </div>
                ) : (
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px 4px' }}>Item Description</th>
                          <th style={{ padding: '8px 4px' }}>Type</th>
                          <th style={{ padding: '8px 4px', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: '8px 4px', textAlign: 'right' }}>Rate</th>
                          <th style={{ padding: '8px 4px', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingItems.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '8px 4px', fontWeight: 500 }}>{item.Description}</td>
                            <td style={{ padding: '8px 4px' }}>
                              <span className="badge badge-waiting" style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>{item.ItemType}</span>
                            </td>
                            <td style={{ padding: '8px 4px', textAlign: 'center' }}>{item.Quantity}</td>
                            <td style={{ padding: '8px 4px', textAlign: 'right' }}>{currencySymbol}{item.Rate.toFixed(2)}</td>
                            <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {currencySymbol}{item.Amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="label-text">Invoice Remarks / Billing Notes</label>
                <textarea 
                  className="input-field" 
                  style={{ height: '60px', resize: 'none' }}
                  placeholder="Payment expected in 14 days, insurance claim details..."
                  value={invoiceForm.Notes}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, Notes: e.target.value }))}
                />
              </div>

              {/* Adjust discount & tax */}
              <div className="grid-2">
                <div>
                  <label className="label-text">Apply Discount ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="input-field" 
                    value={invoiceForm.Discount}
                    onChange={e => setInvoiceForm(prev => ({ ...prev, Discount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="label-text">Tax Amount ({currencySymbol}) - 5% auto recommendation</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="input-field" 
                    value={invoiceForm.TaxAmount}
                    onChange={e => setInvoiceForm(prev => ({ ...prev, TaxAmount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Subtotal & Total Amount cards */}
              {billingItems.length > 0 && (
                <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '4px 0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Subtotal (Before Discount & Tax)</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {currencySymbol}{billingItems.reduce((sum, item) => sum + item.Amount, 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-teal)', marginBottom: '4px' }}>Total Amount (After Discount & Tax)</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
                      {currencySymbol}{Math.max(0, billingItems.reduce((sum, item) => sum + item.Amount, 0) - invoiceForm.Discount + invoiceForm.TaxAmount).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={billingItems.length === 0}>Generate Final Invoice</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Process Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Process Payment Receipt</h2>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <span className="label-text">Invoiced To</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{getPatientName(selectedInvoice.PatientId)}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Invoice: {selectedInvoice.InvoiceNumber} • Outstanding: {currencySymbol}{(selectedInvoice.TotalAmount - selectedInvoice.PaidAmount).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="label-text">Received Payment Amount ({currencySymbol}) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  max={selectedInvoice.TotalAmount - selectedInvoice.PaidAmount}
                  className="input-field" 
                  required 
                  value={paymentForm.Amount}
                  onChange={e => setPaymentForm(prev => ({ ...prev, Amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Payment Mode *</label>
                  <select 
                    className="input-field" 
                    required 
                    value={paymentForm.PaymentMode}
                    onChange={e => setPaymentForm(prev => ({ ...prev, PaymentMode: e.target.value as Payment['PaymentMode'] }))}
                  >
                    <option value="Cash">Cash in Hand</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="BankTransfer">Direct Bank Deposit</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Transaction Reference / Receipt ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. CARD-8871 / UPI-TXN" 
                    className="input-field" 
                    value={paymentForm.TransactionReference}
                    onChange={e => setPaymentForm(prev => ({ ...prev, TransactionReference: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Receipt Voucher</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3. Edit Invoice Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Modify Invoice Metadata</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-2">
                <div>
                  <label className="label-text">Invoice Status</label>
                  <select 
                    className="input-field" 
                    value={invoiceEditForm.Status}
                    onChange={e => setInvoiceEditForm(prev => ({ ...prev, Status: e.target.value as Invoice['Status'] }))}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Final">Final</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Discount Amount ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input-field" 
                    value={invoiceEditForm.Discount}
                    onChange={e => setInvoiceEditForm(prev => ({ ...prev, Discount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Tax Amount ({currencySymbol})</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-field" 
                  value={invoiceEditForm.TaxAmount}
                  onChange={e => setInvoiceEditForm(prev => ({ ...prev, TaxAmount: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <label className="label-text">Billing Notes / Narration</label>
                <textarea 
                  className="input-field" 
                  style={{ height: '60px', resize: 'none' }}
                  placeholder="e.g. Special corporate discount applied..."
                  value={invoiceEditForm.Notes}
                  onChange={e => setInvoiceEditForm(prev => ({ ...prev, Notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. Invoice Designer Modal Overlay */}
      {isDesignerOpen && (
        <div 
          className="modal-overlay"
          style={{ zIndex: 2000 }}
          onClick={() => setIsDesignerOpen(false)}
        >
          <div 
            className="designer-modal-card"
            onClick={e => e.stopPropagation()}
          >
            {/* Left Column: Form Controls */}
            <div className="designer-modal-left">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Invoice Designer</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Customize receipt branding, layout, and attachments</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', margin: 0 }}>Clinic Branding Details</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="label-text" style={{ fontSize: '0.75rem' }}>Clinic Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={designerForm.clinicName}
                    onChange={e => setDesignerForm(prev => ({ ...prev, clinicName: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="label-text" style={{ fontSize: '0.75rem' }}>Clinic Address</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={designerForm.clinicAddress}
                    onChange={e => setDesignerForm(prev => ({ ...prev, clinicAddress: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="label-text" style={{ fontSize: '0.75rem' }}>Clinic Phone / Contact</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={designerForm.clinicPhone}
                    onChange={e => setDesignerForm(prev => ({ ...prev, clinicPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', margin: 0 }}>Logo Configuration</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="label-text" style={{ fontSize: '0.75rem' }}>Logo Type</label>
                  <select 
                    className="input-field" 
                    value={designerForm.logoType}
                    onChange={e => setDesignerForm(prev => ({ ...prev, logoType: e.target.value as any }))}
                  >
                    <option value="none">No Logo</option>
                    <option value="preset">Preset Dental Clinic Logo (Generated)</option>
                    <option value="custom">Custom Image URL</option>
                  </select>
                </div>

                {designerForm.logoType === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label className="label-text" style={{ fontSize: '0.75rem' }}>Upload Logo Image</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setDesignerForm(prev => ({ ...prev, customLogoUrl: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="input-field"
                        style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label className="label-text" style={{ fontSize: '0.75rem' }}>Or Logo Image URL</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="https://example.com/logo.png"
                        value={designerForm.customLogoUrl}
                        onChange={e => setDesignerForm(prev => ({ ...prev, customLogoUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', margin: 0 }}>Clinical / Stamp Picture Attachment</h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="showCustomPictureCheckbox"
                    checked={designerForm.showCustomPicture}
                    onChange={e => setDesignerForm(prev => ({ ...prev, showCustomPicture: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="showCustomPictureCheckbox" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Show Picture Field on Invoice
                  </label>
                </div>

                {designerForm.showCustomPicture && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label className="label-text" style={{ fontSize: '0.75rem' }}>Attachment Picture Type</label>
                      <select 
                        className="input-field" 
                        value={designerForm.pictureType}
                        onChange={e => setDesignerForm(prev => ({ ...prev, pictureType: e.target.value as any }))}
                      >
                        <option value="none">No Picture</option>
                        <option value="xray">Clinical X-Ray Preset (Generated)</option>
                        <option value="signature">Doctor Signature Stamp Preset (Generated)</option>
                        <option value="custom">Custom Image URL</option>
                      </select>
                    </div>

                    {designerForm.pictureType === 'custom' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label className="label-text" style={{ fontSize: '0.75rem' }}>Upload Custom Picture</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setDesignerForm(prev => ({ ...prev, customPictureUrl: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="input-field"
                            style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label className="label-text" style={{ fontSize: '0.75rem' }}>Or Picture Image URL</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="https://example.com/case-xray.png"
                            value={designerForm.customPictureUrl}
                            onChange={e => setDesignerForm(prev => ({ ...prev, customPictureUrl: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', margin: 0 }}>Aesthetics & Layout</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Font Style</label>
                    <select 
                      className="input-field" 
                      value={designerForm.fontFamily}
                      onChange={e => setDesignerForm(prev => ({ ...prev, fontFamily: e.target.value as any }))}
                    >
                      <option value="monospace">Retro Monospace</option>
                      <option value="sans-serif">Modern Sans-Serif</option>
                      <option value="serif">Classic Elegant Serif</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Accent Highlight Color</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      {[
                        { name: 'Purple', hex: '#8b5cf6' },
                        { name: 'Teal', hex: '#14b8a6' },
                        { name: 'Blue', hex: '#3b82f6' },
                        { name: 'Green', hex: '#10b981' },
                        { name: 'Slate', hex: '#64748b' }
                      ].map(color => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setDesignerForm(prev => ({ ...prev, primaryColor: color.hex }))}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: color.hex,
                            border: designerForm.primaryColor === color.hex ? '2.5px solid #ffffff' : '1px solid rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            transition: 'transform 0.1s'
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input 
                    type="checkbox" 
                    id="showDoctorCheckbox"
                    checked={designerForm.showDoctorName}
                    onChange={e => setDesignerForm(prev => ({ ...prev, showDoctorName: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="showDoctorCheckbox" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Show Attending Dentist Name
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="label-text" style={{ fontSize: '0.75rem' }}>Additional Header Subtitle / Note</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Cosmetic & Implant Dentistry Center"
                    value={designerForm.headerNote}
                    onChange={e => setDesignerForm(prev => ({ ...prev, headerNote: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="label-text" style={{ fontSize: '0.75rem' }}>Invoice Terms / Footer Terms</label>
                  <textarea 
                    className="input-field" 
                    rows={2}
                    value={designerForm.footerTerms}
                    onChange={e => setDesignerForm(prev => ({ ...prev, footerTerms: e.target.value }))}
                    style={{ resize: 'none', height: 'auto', padding: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setDesignerForm(DEFAULT_TEMPLATE_CONFIG);
                  }}
                >
                  Restore Defaults
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsDesignerOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))', border: 'none', color: '#ffffff' }}
                  onClick={async () => {
                    localStorage.setItem('invoiceTemplateConfig', JSON.stringify(designerForm));
                    setTemplateConfig(designerForm);
                    
                    try {
                      await fetch(`${API_BASE}/admin/settings/InvoiceTemplateConfig`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ Value: JSON.stringify(designerForm) })
                      });
                    } catch (err) {
                      console.error('Failed to save invoice template config to backend:', err);
                    }
                    
                    setIsDesignerOpen(false);
                  }}
                >
                  Save & Apply Template
                </button>
              </div>
            </div>

            {/* Right Column: Live Interactive Preview */}
            <div className="designer-modal-right">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Design Template Preview
              </div>

              <div 
                className="designer-preview-scroll"
                style={{ 
                  border: `2px solid ${designerForm.primaryColor}`, 
                  fontFamily: designerForm.fontFamily === 'monospace' ? 'monospace' : designerForm.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif'
                }}
              >
                {/* Header preview */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center', 
                  borderBottom: '1.5px dashed var(--border-color)', 
                  paddingBottom: '12px', 
                  marginBottom: '12px',
                  gap: '6px'
                }}>
                  {designerForm.logoType !== 'none' && (
                    <img 
                      src={designerForm.logoType === 'preset' ? clinicLogo : designerForm.customLogoUrl} 
                      alt="Logo" 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', marginBottom: '2px', color: designerForm.primaryColor }}>{designerForm.clinicName || 'Clinic Name'}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{designerForm.clinicAddress || 'Clinic Address'}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{designerForm.clinicPhone || 'Clinic Phone'}</p>
                    {designerForm.headerNote && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontStyle: 'italic', marginTop: '2px', fontWeight: 600 }}>{designerForm.headerNote}</p>
                    )}
                  </div>
                </div>

                {/* Summary Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.75rem' }}>
                  <div>
                    <strong>BILL TO:</strong>
                    <p>John Doe (Patient)</p>
                    {designerForm.showDoctorName && (
                      <p style={{ marginTop: '2px' }}>Attending Dentist: <strong>Dr. Sarah Connor</strong></p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>INVOICE NO:</strong>
                    <p style={{ color: designerForm.primaryColor, fontWeight: 600 }}>INV-2026-0042</p>
                    <p>Status: PAID</p>
                  </div>
                </div>

                {/* Simulated Table */}
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', marginBottom: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
                      <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Item</th>
                      <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Qty</th>
                      <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Rate</th>
                      <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ paddingTop: '4px', paddingBottom: '4px' }}>Composite Resin Filling (Tooth #14)</td>
                      <td style={{ textAlign: 'right' }}>1</td>
                      <td style={{ textAlign: 'right' }}>{currencySymbol}120.00</td>
                      <td style={{ textAlign: 'right' }}>{currencySymbol}120.00</td>
                    </tr>
                    <tr>
                      <td style={{ paddingTop: '4px', paddingBottom: '4px' }}>Clinical Consultation & X-Ray</td>
                      <td style={{ textAlign: 'right' }}>1</td>
                      <td style={{ textAlign: 'right' }}>{currencySymbol}50.00</td>
                      <td style={{ textAlign: 'right' }}>{currencySymbol}50.00</td>
                    </tr>
                  </tbody>
                </table>

                {/* Calculations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', width: '160px', marginLeft: 'auto', textAlign: 'right', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>{currencySymbol}170.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span>Total Due:</span>
                    <span>{currencySymbol}170.00</span>
                  </div>
                </div>

                {/* Picture Field attachment preview */}
                {designerForm.showCustomPicture && designerForm.pictureType !== 'none' && (
                  <div style={{ 
                    marginTop: '12px', 
                    borderTop: '1px solid var(--border-color)', 
                    paddingTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {designerForm.pictureType === 'xray' ? 'Clinical Case Attachment (Radiograph)' : designerForm.pictureType === 'signature' ? 'Doctor Verification Stamp' : 'Invoice Image Attachment'}
                    </span>
                    <img 
                      src={
                        designerForm.pictureType === 'xray' ? dentalXray : 
                        designerForm.pictureType === 'signature' ? doctorSign : 
                        designerForm.customPictureUrl
                      } 
                      alt="Attachment Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: designerForm.pictureType === 'signature' ? '60px' : '120px', 
                        borderRadius: '4px', 
                        border: '1px solid var(--border-color)',
                        objectFit: 'contain'
                      }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Footer preview */}
                {designerForm.footerTerms && (
                  <div style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-secondary)', fontSize: '0.7rem', fontStyle: 'italic', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                    {designerForm.footerTerms}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
