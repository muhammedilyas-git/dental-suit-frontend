import React, { useState, useEffect } from 'react';
import type { Invoice, Patient, Doctor, InvoiceItem, Payment, Consultation, Treatment, User, Appointment, Item } from '../types';
import { Plus, CreditCard, Printer, X, Search, Edit, Settings } from 'lucide-react';

import clinicLogo from '../assets/clinic_logo.png';
import dentalXray from '../assets/dental_xray.png';
import doctorSign from '../assets/doctor_sign.png';

interface InvoiceCustomField {
  id: string;
  type: 'db_field' | 'custom_text' | 'picture' | 'divider' | 'table' | 'calculations' | 'payment_history';
  value: string; // The db field key (e.g. 'patient.FullName'), custom text, or image type/URL
  label: string; // Display label
  section: 'header' | 'details_header' | 'details_footer' | 'footer';
  x: number; // percentage left
  y: number; // percentage top
  fontSize: number;
  color: string;
  fontFamily: 'monospace' | 'sans-serif' | 'serif' | 'inherit';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  width?: number; // width in percentage
  height?: number; // height in px (useful for picture / divider)
}

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
  customFields?: InvoiceCustomField[];
}

const DEFAULT_CUSTOM_FIELDS: InvoiceCustomField[] = [
  // Header Section
  {
    id: 'clinic-logo',
    type: 'picture',
    value: 'preset',
    label: 'Clinic Logo',
    section: 'header',
    x: 46,
    y: 5,
    width: 8,
    height: 54,
    fontSize: 12,
    color: '#1f2937',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center'
  },
  {
    id: 'clinic-name',
    type: 'custom_text',
    value: 'DENTAL SUITE CLINICS',
    label: 'Clinic Name',
    section: 'header',
    x: 10,
    y: 42,
    fontSize: 20,
    color: '#8b5cf6',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    width: 80
  },
  {
    id: 'clinic-address',
    type: 'custom_text',
    value: '100 Dental Science Way, Medical District, NY',
    label: 'Clinic Address',
    section: 'header',
    x: 10,
    y: 68,
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    width: 80
  },
  {
    id: 'clinic-phone',
    type: 'custom_text',
    value: 'Tel: +1 (555) DENTIST',
    label: 'Clinic Phone',
    section: 'header',
    x: 10,
    y: 82,
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    width: 80
  },
  {
    id: 'header-divider',
    type: 'divider',
    value: '#cbd5e1',
    label: 'Header Separator Line',
    section: 'header',
    x: 2,
    y: 95,
    fontSize: 12,
    color: '#cbd5e1',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    width: 96,
    height: 2
  },
  
  // Details Header Section
  {
    id: 'label-billto',
    type: 'custom_text',
    value: 'BILL TO:',
    label: 'Bill To Label',
    section: 'details_header',
    x: 4,
    y: 10,
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left'
  },
  {
    id: 'patient-name',
    type: 'db_field',
    value: 'patient.FullName',
    label: 'Patient Full Name',
    section: 'details_header',
    x: 4,
    y: 28,
    fontSize: 13,
    color: '#1e293b',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left'
  },
  {
    id: 'patient-mobile',
    type: 'db_field',
    value: 'patient.Mobile',
    label: 'Patient Mobile',
    section: 'details_header',
    x: 4,
    y: 46,
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left'
  },
  {
    id: 'doctor-name',
    type: 'db_field',
    value: 'doctor.FullName',
    label: 'Attending Doctor Name',
    section: 'details_header',
    x: 4,
    y: 64,
    fontSize: 11,
    color: '#475569',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'italic',
    textDecoration: 'none',
    textAlign: 'left'
  },
  {
    id: 'label-invno',
    type: 'custom_text',
    value: 'INVOICE NO:',
    label: 'Invoice No Label',
    section: 'details_header',
    x: 66,
    y: 10,
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'right',
    width: 30
  },
  {
    id: 'invoice-number',
    type: 'db_field',
    value: 'invoice.InvoiceNumber',
    label: 'Invoice Number',
    section: 'details_header',
    x: 66,
    y: 28,
    fontSize: 13,
    color: '#0d9488',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'right',
    width: 30
  },
  {
    id: 'invoice-date',
    type: 'db_field',
    value: 'invoice.InvoiceDate',
    label: 'Invoice Date',
    section: 'details_header',
    x: 66,
    y: 46,
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'right',
    width: 30
  },
  
  // Details Footer Section
  {
    id: 'invoice-calculations',
    type: 'calculations',
    value: '',
    label: 'Calculations Summary',
    section: 'details_footer',
    x: 58,
    y: 10,
    fontSize: 12,
    color: '#1f2937',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'right',
    width: 38
  },
  {
    id: 'payment-history',
    type: 'payment_history',
    value: '',
    label: 'Payment History Log',
    section: 'details_footer',
    x: 4,
    y: 10,
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    width: 48
  },
  {
    id: 'xray-attachment',
    type: 'picture',
    value: 'xray',
    label: 'X-Ray Preset Attachment',
    section: 'details_footer',
    x: 4,
    y: 55,
    width: 35,
    height: 80,
    fontSize: 12,
    color: '#1f2937',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center'
  },
  {
    id: 'signature-attachment',
    type: 'picture',
    value: 'signature',
    label: 'Doctor Signature Stamp',
    section: 'details_footer',
    x: 65,
    y: 65,
    width: 30,
    height: 50,
    fontSize: 12,
    color: '#1f2937',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center'
  },
  
  // Footer Section
  {
    id: 'footer-terms',
    type: 'custom_text',
    value: '~ Thank you for your visit. Keep smiling! ~',
    label: 'Footer Terms / Note',
    section: 'footer',
    x: 10,
    y: 35,
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'italic',
    textDecoration: 'none',
    textAlign: 'center',
    width: 80
  }
];

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
  showDoctorName: true,
  customFields: DEFAULT_CUSTOM_FIELDS
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
            const parsedConfig = {
              ...DEFAULT_TEMPLATE_CONFIG,
              ...config,
              customFields: config.customFields && config.customFields.length > 0 
                ? config.customFields 
                : DEFAULT_CUSTOM_FIELDS
            };
            setTemplateConfig(parsedConfig);
            setDesignerForm(parsedConfig);
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
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_TEMPLATE_CONFIG,
          ...parsed,
          customFields: parsed.customFields && parsed.customFields.length > 0 
            ? parsed.customFields 
            : DEFAULT_CUSTOM_FIELDS
        };
      } catch (e) {
        return DEFAULT_TEMPLATE_CONFIG;
      }
    }
    return DEFAULT_TEMPLATE_CONFIG;
  });

  // Designer temporary form state
  const [designerForm, setDesignerForm] = useState<InvoiceTemplateConfig>({ ...templateConfig });

  // Custom Fields Interactive States
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [addFieldType, setAddFieldType] = useState<'db_field' | 'custom_text' | 'picture' | 'divider'>('custom_text');
  const [addFieldDbKey, setAddFieldDbKey] = useState<string>('patient.FullName');
  const [addFieldText, setAddFieldText] = useState<string>('New Custom Text');
  const [addFieldPicValue, setAddFieldPicValue] = useState<string>('preset');
  const [addFieldPicUrl, setAddFieldPicUrl] = useState<string>('');
  const [addFieldSection, setAddFieldSection] = useState<'header' | 'details_header' | 'details_footer' | 'footer'>('header');

  const resolveDbField = (fieldKey: string, invoice: Invoice | null): string => {
    if (!invoice) {
      switch (fieldKey) {
        case 'patient.FullName': return 'John Doe (Patient)';
        case 'patient.Mobile': return '+1 (555) 019-2834';
        case 'patient.Email': return 'johndoe@example.com';
        case 'patient.Address': return '123 Main St, Dental Hills, NY';
        case 'patient.InsuranceProvider': return 'Premium Dental Ins.';
        case 'patient.InsurancePolicyNumber': return 'POL-998877';
        case 'doctor.FullName': return 'Dr. Sarah Connor';
        case 'doctor.Specialization': return 'Orthodontist';
        case 'doctor.Qualification': return 'DDS, MS';
        case 'invoice.InvoiceNumber': return 'INV-2026-0042';
        case 'invoice.InvoiceDate': return '2026-06-19';
        case 'invoice.Status': return 'PAID';
        case 'invoice.SubTotal': return `${currencySymbol}170.00`;
        case 'invoice.TaxAmount': return `${currencySymbol}8.50`;
        case 'invoice.Discount': return `${currencySymbol}10.00`;
        case 'invoice.TotalAmount': return `${currencySymbol}168.50`;
        case 'invoice.PaidAmount': return `${currencySymbol}168.50`;
        case 'invoice.BalanceDue': return `${currencySymbol}0.00`;
        case 'invoice.Notes': return 'Keep smiling!';
        case 'consultation.Diagnosis': return 'Mild dental gingivitis';
        case 'consultation.Symptoms': return 'Sensitivity to cold';
        case 'consultation.TreatmentAdvice': return 'Rinse twice daily';
        case 'consultation.FollowUpDate': return '2026-12-19';
        default: return `[${fieldKey}]`;
      }
    }

    const patient = patients.find(p => p.PatientId === invoice.PatientId);
    const doctor = doctors.find(d => d.DoctorId === invoice.DoctorId);
    const docUser = doctor ? users.find(u => u.UserId === doctor.UserId) : null;
    const consultation = invoice.ConsultationId ? consultations.find(c => c.ConsultationId === invoice.ConsultationId) : null;

    switch (fieldKey) {
      case 'patient.FullName':
        return patient ? `${patient.FirstName} ${patient.LastName}` : `Patient #${invoice.PatientId}`;
      case 'patient.Mobile':
        return patient?.Mobile || 'N/A';
      case 'patient.Email':
        return patient?.Email || 'N/A';
      case 'patient.Address':
        return patient?.Address || 'N/A';
      case 'patient.InsuranceProvider':
        return patient?.InsuranceProvider || 'N/A';
      case 'patient.InsurancePolicyNumber':
        return patient?.InsurancePolicyNumber || 'N/A';
      case 'doctor.FullName':
        return docUser ? docUser.FullName : `Dr. #${invoice.DoctorId}`;
      case 'doctor.Specialization':
        return doctor?.Specialization || 'N/A';
      case 'doctor.Qualification':
        return doctor?.Qualification || 'N/A';
      case 'invoice.InvoiceNumber':
        return invoice.InvoiceNumber;
      case 'invoice.InvoiceDate':
        return new Date(invoice.InvoiceDate).toLocaleDateString();
      case 'invoice.Status':
        return invoice.Status;
      case 'invoice.SubTotal':
        return `${currencySymbol}${invoice.SubTotal.toFixed(2)}`;
      case 'invoice.TaxAmount':
        return `${currencySymbol}${invoice.TaxAmount.toFixed(2)}`;
      case 'invoice.Discount':
        return `${currencySymbol}${invoice.Discount.toFixed(2)}`;
      case 'invoice.TotalAmount':
        return `${currencySymbol}${invoice.TotalAmount.toFixed(2)}`;
      case 'invoice.PaidAmount':
        return `${currencySymbol}${invoice.PaidAmount.toFixed(2)}`;
      case 'invoice.BalanceDue':
        return `${currencySymbol}${(invoice.TotalAmount - invoice.PaidAmount).toFixed(2)}`;
      case 'invoice.Notes':
        return invoice.Notes || 'N/A';
      case 'consultation.Diagnosis':
        return consultation?.Diagnosis || 'N/A';
      case 'consultation.Symptoms':
        return consultation?.Symptoms || 'N/A';
      case 'consultation.TreatmentAdvice':
        return consultation?.TreatmentAdvice || 'N/A';
      case 'consultation.FollowUpDate':
        return consultation?.FollowUpDate ? new Date(consultation.FollowUpDate).toLocaleDateString() : 'N/A';
      default:
        return '';
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setSelectedFieldId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, section: InvoiceCustomField['section']) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    
    // Compute dropped position inside container in percentage
    const rawX = ((e.clientX - canvasRect.left - dragOffset.x) / canvasRect.width) * 100;
    const rawY = ((e.clientY - canvasRect.top - dragOffset.y) / canvasRect.height) * 100;
    
    // Snap to 1% grid and clamp to container
    const snappedX = Math.round(rawX);
    const snappedY = Math.round(rawY);
    const x = Math.max(0, Math.min(95, snappedX));
    const y = Math.max(0, Math.min(95, snappedY));

    // Update in designerForm
    setDesignerForm(prev => {
      const fields = prev.customFields || DEFAULT_CUSTOM_FIELDS;
      const updatedFields = fields.map(field => {
        if (field.id === itemId) {
          return { ...field, section, x, y };
        }
        return field;
      });
      return { ...prev, customFields: updatedFields };
    });
  };

  const handleAddField = () => {
    let value = '';
    let label = '';
    let width = 30;
    let height = 30;

    if (addFieldType === 'db_field') {
      value = addFieldDbKey;
      label = `DB: ${addFieldDbKey.split('.').pop()}`;
    } else if (addFieldType === 'custom_text') {
      value = addFieldText;
      label = `Text: ${addFieldText.substring(0, 10)}`;
      width = 50;
    } else if (addFieldType === 'picture') {
      value = addFieldPicValue === 'custom' ? addFieldPicUrl || 'https://via.placeholder.com/150' : addFieldPicValue;
      label = `Image: ${addFieldPicValue}`;
      width = 25;
      height = 60;
    } else if (addFieldType === 'divider') {
      value = '#cbd5e1';
      label = 'Horizontal Divider';
      width = 96;
      height = 2;
    }

    const newField: InvoiceCustomField = {
      id: `field-${Date.now()}`,
      type: addFieldType,
      value,
      label,
      section: addFieldSection,
      x: 10,
      y: 10,
      fontSize: 12,
      color: designerForm.primaryColor || '#1f2937',
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      width,
      height
    };

    setDesignerForm(prev => ({
      ...prev,
      customFields: [...(prev.customFields || DEFAULT_CUSTOM_FIELDS), newField]
    }));

    setSelectedFieldId(newField.id);
  };

  const handleUpdateFieldProperty = (id: string, property: keyof InvoiceCustomField, val: any) => {
    setDesignerForm(prev => {
      const fields = prev.customFields || DEFAULT_CUSTOM_FIELDS;
      return {
        ...prev,
        customFields: fields.map(f => f.id === id ? { ...f, [property]: val } : f)
      };
    });
  };

  const handleRemoveField = (id: string) => {
    setDesignerForm(prev => {
      const fields = prev.customFields || DEFAULT_CUSTOM_FIELDS;
      return {
        ...prev,
        customFields: fields.filter(f => f.id !== id)
      };
    });
    setSelectedFieldId(null);
  };

  const renderTableContent = (invoice: Invoice | null) => {
    const itemsList = invoice 
      ? invoiceItems.filter(item => item.InvoiceId === invoice.InvoiceId)
      : [
          { InvoiceItemId: 1, Description: 'Composite Resin Filling (Tooth #14)', ItemType: 'Treatment', Quantity: 1, Rate: 120.00, Amount: 120.00 },
          { InvoiceItemId: 2, Description: 'Clinical Consultation & X-Ray', ItemType: 'Consultation', Quantity: 1, Rate: 50.00, Amount: 50.00 }
        ];

    return (
      <table style={{ width: '100%', fontSize: 'inherit', borderCollapse: 'collapse', marginTop: '10px', marginBottom: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', fontWeight: 700 }}>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Description</th>
            <th style={{ textAlign: 'right', padding: '6px 4px', width: '10%' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '6px 4px', width: '20%' }}>Rate</th>
            <th style={{ textAlign: 'right', padding: '6px 4px', width: '20%' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {itemsList.map(item => (
            <tr key={item.InvoiceItemId} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '6px 4px' }}>{item.Description} ({item.ItemType})</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>{item.Quantity}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>{currencySymbol}{item.Rate.toFixed(2)}</td>
              <td style={{ padding: '6px 4px', textAlign: 'right' }}>{currencySymbol}{item.Amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCalculationsContent = (invoice: Invoice | null) => {
    const subtotal = invoice ? invoice.SubTotal : 170.00;
    const discount = invoice ? invoice.Discount : 10.00;
    const tax = invoice ? invoice.TaxAmount : 8.50;
    const total = invoice ? invoice.TotalAmount : 168.50;
    const paid = invoice ? invoice.PaidAmount : 168.50;
    const balance = invoice ? (invoice.TotalAmount - invoice.PaidAmount) : 0.00;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 'inherit', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>{currencySymbol}{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
            <span>Discount:</span>
            <span>-{currencySymbol}{discount.toFixed(2)}</span>
          </div>
        )}
        {tax > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax (5%):</span>
            <span>+{currencySymbol}{tax.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '4px', marginTop: '2px' }}>
          <span>Total:</span>
          <span>{currencySymbol}{total.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-teal)', fontWeight: 600 }}>
          <span>Paid:</span>
          <span>{currencySymbol}{paid.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1.5px dashed var(--border-color)', paddingTop: '4px', color: balance > 0 ? '#f87171' : 'var(--status-completed-text)' }}>
          <span>Balance:</span>
          <span>{currencySymbol}{balance.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  const renderPaymentHistoryContent = (invoice: Invoice | null) => {
    const paymentLogs = invoice
      ? payments.filter(p => p.InvoiceId === invoice.InvoiceId).sort((a, b) => b.PaymentId - a.PaymentId)
      : [
          { PaymentId: 1, PaymentDate: new Date().toISOString(), PaymentMode: 'Card', Amount: 168.50, TransactionReference: 'TXN-998811' }
        ];

    if (paymentLogs.length === 0) return null;

    return (
      <div style={{ fontSize: 'inherit', width: '100%' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9em' }}>PAYMENT LOGS:</div>
        {paymentLogs.map(p => (
          <div key={p.PaymentId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', color: 'var(--text-secondary)', marginTop: '2px' }}>
            <span>{new Date(p.PaymentDate).toLocaleDateString()} ({p.PaymentMode})</span>
            <span>{currencySymbol}{p.Amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderFieldItem = (field: InvoiceCustomField, isDesignMode: boolean, invoice: Invoice | null) => {
    let content: React.ReactNode = '';
    
    if (field.type === 'db_field') {
      content = resolveDbField(field.value, invoice);
    } else if (field.type === 'custom_text') {
      content = field.value;
    } else if (field.type === 'divider') {
      content = <div className="designer-divider-line" style={{ borderColor: field.color || '#cbd5e1', borderTopWidth: `${field.height || 2}px` }} />;
    } else if (field.type === 'picture') {
      let imgSrc = '';
      if (field.value === 'preset') {
        imgSrc = clinicLogo;
      } else if (field.value === 'xray') {
        imgSrc = dentalXray;
      } else if (field.value === 'signature') {
        imgSrc = doctorSign;
      } else {
        imgSrc = field.value;
      }
      content = (
        <img 
          src={imgSrc} 
          alt={field.label} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    } else if (field.type === 'table') {
      content = renderTableContent(invoice);
    } else if (field.type === 'calculations') {
      content = renderCalculationsContent(invoice);
    } else if (field.type === 'payment_history') {
      content = renderPaymentHistoryContent(invoice);
    }

    const isSelected = selectedFieldId === field.id;
    const fontStyleFamily = field.fontFamily === 'monospace' ? 'monospace' : field.fontFamily === 'serif' ? 'Georgia, serif' : field.fontFamily === 'sans-serif' ? 'system-ui, sans-serif' : 'inherit';

    const style: React.CSSProperties = {
      left: `${field.x}%`,
      top: `${field.y}%`,
      fontSize: `${field.fontSize}px`,
      color: field.color,
      fontFamily: fontStyleFamily,
      fontWeight: field.fontWeight,
      fontStyle: field.fontStyle,
      textDecoration: field.textDecoration,
      textAlign: field.textAlign,
      width: field.width ? `${field.width}%` : 'auto',
      height: field.height ? `${field.height}px` : 'auto'
    };

    if (isDesignMode) {
      return (
        <div
          key={field.id}
          draggable={field.type !== 'table' && field.type !== 'calculations' && field.type !== 'payment_history'}
          onDragStart={(e) => handleDragStart(e, field.id)}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFieldId(field.id);
          }}
          className={`designer-field-item ${isSelected ? 'selected' : ''}`}
          style={style}
        >
          {content}
        </div>
      );
    }

    return (
      <div
        key={field.id}
        style={{
          position: 'absolute',
          ...style,
          boxSizing: 'border-box'
        }}
      >
        {content}
      </div>
    );
  };

  const renderInvoiceSlipLayout = (invoice: Invoice | null, isDesignMode: boolean) => {
    const fields = designerForm.customFields && designerForm.customFields.length > 0
      ? (isDesignMode ? designerForm.customFields : templateConfig.customFields || DEFAULT_CUSTOM_FIELDS)
      : (templateConfig.customFields && templateConfig.customFields.length > 0 ? templateConfig.customFields : DEFAULT_CUSTOM_FIELDS);

    const headerFields = fields.filter(f => f.section === 'header');
    const detailsHeaderFields = fields.filter(f => f.section === 'details_header');
    const detailsFooterFields = fields.filter(f => f.section === 'details_footer');
    const footerFields = fields.filter(f => f.section === 'footer');

    const config = isDesignMode ? designerForm : templateConfig;
    const fontStyleFamily = config.fontFamily === 'monospace' ? 'monospace' : config.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif';

    return (
      <div 
        style={{
          fontFamily: fontStyleFamily,
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Section */}
        <div 
          className={isDesignMode ? 'designer-canvas-section' : ''}
          onDragOver={isDesignMode ? handleDragOver : undefined}
          onDrop={isDesignMode ? (e) => handleDrop(e, 'header') : undefined}
          style={{
            position: 'relative',
            height: '150px',
            width: '100%',
            borderBottom: isDesignMode ? undefined : '1px dashed var(--border-color)',
            boxSizing: 'border-box'
          }}
        >
          {isDesignMode && <div className="designer-canvas-label">Header Section (Repeats on Top)</div>}
          {headerFields.map(f => renderFieldItem(f, isDesignMode, invoice))}
        </div>

        {/* Details Header Section */}
        <div 
          className={isDesignMode ? 'designer-canvas-section' : ''}
          onDragOver={isDesignMode ? handleDragOver : undefined}
          onDrop={isDesignMode ? (e) => handleDrop(e, 'details_header') : undefined}
          style={{
            position: 'relative',
            height: '110px',
            width: '100%',
            marginTop: '12px',
            boxSizing: 'border-box'
          }}
        >
          {isDesignMode && <div className="designer-canvas-label">Details Header Section</div>}
          {detailsHeaderFields.map(f => renderFieldItem(f, isDesignMode, invoice))}
        </div>

        {/* Dynamic Table (Standard flow) */}
        <div style={{ marginTop: '12px', marginBottom: '12px', width: '100%', padding: '0 8px', boxSizing: 'border-box' }}>
          {renderTableContent(invoice)}
        </div>

        {/* Details Footer Section */}
        <div 
          className={isDesignMode ? 'designer-canvas-section' : ''}
          onDragOver={isDesignMode ? handleDragOver : undefined}
          onDrop={isDesignMode ? (e) => handleDrop(e, 'details_footer') : undefined}
          style={{
            position: 'relative',
            height: '220px',
            width: '100%',
            marginTop: '12px',
            boxSizing: 'border-box'
          }}
        >
          {isDesignMode && <div className="designer-canvas-label">Details Footer Section</div>}
          {detailsFooterFields.map(f => renderFieldItem(f, isDesignMode, invoice))}
        </div>

        {/* Footer Section */}
        <div 
          className={isDesignMode ? 'designer-canvas-section' : ''}
          onDragOver={isDesignMode ? handleDragOver : undefined}
          onDrop={isDesignMode ? (e) => handleDrop(e, 'footer') : undefined}
          style={{
            position: 'relative',
            height: '80px',
            width: '100%',
            borderTop: isDesignMode ? undefined : '1px dashed var(--border-color)',
            marginTop: '12px',
            boxSizing: 'border-box'
          }}
        >
          {isDesignMode && <div className="designer-canvas-label">Footer Section (Repeats on Bottom)</div>}
          {footerFields.map(f => renderFieldItem(f, isDesignMode, invoice))}
        </div>
      </div>
    );
  };

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

  const generatePrintHtml = (invoice: Invoice) => {
    const fields = templateConfig.customFields && templateConfig.customFields.length > 0
      ? templateConfig.customFields
      : DEFAULT_CUSTOM_FIELDS;

    const headerFields = fields.filter(f => f.section === 'header');
    const detailsHeaderFields = fields.filter(f => f.section === 'details_header');
    const detailsFooterFields = fields.filter(f => f.section === 'details_footer');
    const footerFields = fields.filter(f => f.section === 'footer');

    const resolveFieldHtml = (field: InvoiceCustomField) => {
      let content = '';
      if (field.type === 'db_field') {
        content = resolveDbField(field.value, invoice);
      } else if (field.type === 'custom_text') {
        content = field.value;
      } else if (field.type === 'divider') {
        content = `<div style="border-top: ${field.height || 2}px dashed ${field.color}; width: 100%; height: 0;"></div>`;
      } else if (field.type === 'picture') {
        let imgSrc = '';
        if (field.value === 'preset') {
          imgSrc = clinicLogo;
        } else if (field.value === 'xray') {
          imgSrc = dentalXray;
        } else if (field.value === 'signature') {
          imgSrc = doctorSign;
        } else {
          imgSrc = field.value;
        }
        content = `<img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: contain;" />`;
      } else if (field.type === 'calculations') {
        const subtotal = invoice.SubTotal;
        const discount = invoice.Discount;
        const tax = invoice.TaxAmount;
        const total = invoice.TotalAmount;
        const paid = invoice.PaidAmount;
        const balance = invoice.TotalAmount - invoice.PaidAmount;

        content = `
          <div style="display: flex; flex-direction: column; gap: 4px; width: 100%; text-align: right; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${currencySymbol}${subtotal.toFixed(2)}</span></div>
            ${discount > 0 ? `<div style="display: flex; justify-content: space-between; color: #ef4444;"><span>Discount:</span><span>-${currencySymbol}${discount.toFixed(2)}</span></div>` : ''}
            ${tax > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Tax (5%):</span><span>+${currencySymbol}${tax.toFixed(2)}</span></div>` : ''}
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 2px;"><span>Total:</span><span>${currencySymbol}${total.toFixed(2)}</span></div>
            <div style="display: flex; justify-content: space-between; color: #0d9488; font-weight: bold;"><span>Paid:</span><span>${currencySymbol}${paid.toFixed(2)}</span></div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1.5px dashed #cbd5e1; padding-top: 4px; color: ${balance > 0 ? '#ef4444' : '#047857'};"><span>Balance:</span><span>${currencySymbol}${balance.toFixed(2)}</span></div>
          </div>
        `;
      } else if (field.type === 'payment_history') {
        const paymentLogs = payments.filter(p => p.InvoiceId === invoice.InvoiceId).sort((a, b) => b.PaymentId - a.PaymentId);
        if (paymentLogs.length > 0) {
          content = `
            <div style="width: 100%; text-align: left; box-sizing: border-box;">
              <div style="font-weight: bold; margin-bottom: 4px; font-size: 0.9em;">PAYMENT LOGS:</div>
              ${paymentLogs.map(p => `
                <div style="display: flex; justify-content: space-between; font-size: 0.9em; color: #475569; margin-top: 2px;">
                  <span>${new Date(p.PaymentDate).toLocaleDateString()} (${p.PaymentMode})</span>
                  <span>${currencySymbol}${p.Amount.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          `;
        }
      }

      const fontStyleFamily = field.fontFamily === 'monospace' ? 'monospace' : field.fontFamily === 'serif' ? 'Georgia, serif' : field.fontFamily === 'sans-serif' ? 'system-ui, sans-serif' : 'inherit';

      return `
        <div style="
          position: absolute;
          left: ${field.x}%;
          top: ${field.y}%;
          font-size: ${field.fontSize}px;
          color: ${field.color};
          font-family: ${fontStyleFamily};
          font-weight: ${field.fontWeight};
          font-style: ${field.fontStyle};
          text-decoration: ${field.textDecoration};
          text-align: ${field.textAlign};
          width: ${field.width ? `${field.width}%` : 'auto'};
          height: ${field.height ? `${field.height}px` : 'auto'};
          box-sizing: border-box;
        ">
          ${content}
        </div>
      `;
    };

    const itemsList = invoiceItems.filter(item => item.InvoiceId === invoice.InvoiceId);
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
        <thead>
          <tr style="border-bottom: 2px solid #cbd5e1; font-weight: bold;">
            <th style="text-align: left; padding: 8px 4px;">Description</th>
            <th style="text-align: right; padding: 8px 4px; width: 10%;">Qty</th>
            <th style="text-align: right; padding: 8px 4px; width: 20%;">Rate</th>
            <th style="text-align: right; padding: 8px 4px; width: 20%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList.map(item => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 4px;">${item.Description} (${item.ItemType})</td>
              <td style="padding: 8px 4px; text-align: right;">${item.Quantity}</td>
              <td style="padding: 8px 4px; text-align: right;">${currencySymbol}${item.Rate.toFixed(2)}</td>
              <td style="padding: 8px 4px; text-align: right;">${currencySymbol}${item.Amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const config = templateConfig;
    const fontStyleFamily = config.fontFamily === 'monospace' ? 'monospace' : config.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice Receipt ${invoice.InvoiceNumber}</title>
        <style>
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-wrapper-table {
              width: 100%;
            }
          }
          body {
            margin: 0;
            padding: 40px;
            background: #ffffff;
            color: #1f2937;
            font-family: ${fontStyleFamily};
            font-size: 13px;
            line-height: 1.5;
            box-sizing: border-box;
          }
          .print-header {
            position: relative;
            height: 150px;
            width: 100%;
            border-bottom: 1px dashed #cbd5e1;
            box-sizing: border-box;
          }
          .print-details-header {
            position: relative;
            height: 110px;
            width: 100%;
            margin-top: 12px;
            box-sizing: border-box;
          }
          .print-details-footer {
            position: relative;
            height: 220px;
            width: 100%;
            margin-top: 12px;
            box-sizing: border-box;
          }
          .print-footer {
            position: relative;
            height: 80px;
            width: 100%;
            border-top: 1px dashed #cbd5e1;
            margin-top: 12px;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <table class="print-wrapper-table">
          <thead>
            <tr>
              <td>
                <div class="print-header">
                  ${headerFields.map(f => resolveFieldHtml(f)).join('')}
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="print-details-header">
                  ${detailsHeaderFields.map(f => resolveFieldHtml(f)).join('')}
                </div>
                
                <div style="width: 100%; box-sizing: border-box; padding: 0 4px;">
                  ${tableHtml}
                </div>
                
                <div class="print-details-footer">
                  ${detailsFooterFields.map(f => resolveFieldHtml(f)).join('')}
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                <div class="print-footer">
                  ${footerFields.map(f => resolveFieldHtml(f)).join('')}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;
  };

  const handlePrintReceipt = () => {
    if (!selectedInvoice) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const htmlContent = generatePrintHtml(selectedInvoice);
    doc.write(htmlContent);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

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
          <div id="printable-invoice-slip" style={{ 
            background: 'var(--bg-app)', 
            border: `1.5px solid ${templateConfig.primaryColor}`, 
            padding: '30px', 
            borderRadius: '12px', 
            color: 'var(--text-primary)', 
            fontFamily: templateConfig.fontFamily === 'monospace' ? 'monospace' : templateConfig.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif', 
            fontSize: '0.85rem',
            position: 'relative'
          }}>
            {renderInvoiceSlipLayout(selectedInvoice, false)}
          </div>

          {/* Quick Actions for Invoice */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
            {currentUser.RoleId === 1 && (
              <button className="btn btn-secondary" onClick={() => handleEditInvoice(selectedInvoice)}>
                <Edit size={16} /> Edit Invoice
              </button>
            )}
            <button className="btn btn-secondary" onClick={handlePrintReceipt}>
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
            style={{ minHeight: '80vh' }}
          >
            {/* Left Column: Form Controls */}
            <div className="designer-modal-left" onClick={() => setSelectedFieldId(null)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Invoice Designer</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Design layout with drag & drop and custom fields</span>
                </div>
              </div>

              {/* SECTION 1: GLOBAL STYLING */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', margin: 0 }}>Global Theme Styles</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label-text" style={{ fontSize: '0.7rem' }}>Default Font Style</label>
                    <select 
                      className="input-field" 
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      value={designerForm.fontFamily}
                      onChange={e => setDesignerForm(prev => ({ ...prev, fontFamily: e.target.value as any }))}
                    >
                      <option value="monospace">Retro Monospace</option>
                      <option value="sans-serif">Modern Sans-Serif</option>
                      <option value="serif">Classic Elegant Serif</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-text" style={{ fontSize: '0.7rem' }}>Theme Color Accent</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
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
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: color.hex,
                            border: designerForm.primaryColor === color.hex ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            transition: 'transform 0.1s'
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ADD ELEMENT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', margin: 0 }}>Add Invoice Element</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="label-text" style={{ fontSize: '0.7rem' }}>Element Type</label>
                    <select 
                      className="input-field" 
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      value={addFieldType}
                      onChange={e => setAddFieldType(e.target.value as any)}
                    >
                      <option value="custom_text">Custom Text / Label</option>
                      <option value="db_field">Database Field Value</option>
                      <option value="picture">Picture Container</option>
                      <option value="divider">Horizontal Divider Line</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-text" style={{ fontSize: '0.7rem' }}>Initial Placement</label>
                    <select 
                      className="input-field" 
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      value={addFieldSection}
                      onChange={e => setAddFieldSection(e.target.value as any)}
                    >
                      <option value="header">Header (Top)</option>
                      <option value="details_header">Details Top</option>
                      <option value="details_footer">Details Bottom</option>
                      <option value="footer">Footer (Bottom)</option>
                    </select>
                  </div>
                </div>

                {/* Sub-inputs depending on element type selected */}
                {addFieldType === 'db_field' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label className="label-text" style={{ fontSize: '0.7rem' }}>Choose Database Field</label>
                    <select
                      className="input-field"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      value={addFieldDbKey}
                      onChange={e => setAddFieldDbKey(e.target.value)}
                    >
                      <optgroup label="Patient Fields">
                        <option value="patient.FullName">Patient Full Name</option>
                        <option value="patient.Mobile">Patient Mobile</option>
                        <option value="patient.Email">Patient Email</option>
                        <option value="patient.Address">Patient Address</option>
                        <option value="patient.InsuranceProvider">Insurance Provider</option>
                        <option value="patient.InsurancePolicyNumber">Insurance Policy No</option>
                      </optgroup>
                      <optgroup label="Doctor Fields">
                        <option value="doctor.FullName">Attending Doctor Name</option>
                        <option value="doctor.Specialization">Doctor Specialization</option>
                        <option value="doctor.Qualification">Doctor Qualification</option>
                      </optgroup>
                      <optgroup label="Invoice Fields">
                        <option value="invoice.InvoiceNumber">Invoice Number</option>
                        <option value="invoice.InvoiceDate">Invoice Date</option>
                        <option value="invoice.Status">Invoice Status</option>
                        <option value="invoice.SubTotal">Invoice Subtotal</option>
                        <option value="invoice.Discount">Invoice Discount</option>
                        <option value="invoice.TaxAmount">Invoice Tax</option>
                        <option value="invoice.TotalAmount">Invoice Total Due</option>
                        <option value="invoice.PaidAmount">Invoice Paid Amount</option>
                        <option value="invoice.BalanceDue">Outstanding Balance Due</option>
                        <option value="invoice.Notes">Invoice Notes</option>
                      </optgroup>
                      <optgroup label="Consultation Fields">
                        <option value="consultation.Diagnosis">Consultation Diagnosis</option>
                        <option value="consultation.Symptoms">Consultation Symptoms</option>
                        <option value="consultation.TreatmentAdvice">Treatment Advice</option>
                        <option value="consultation.FollowUpDate">Follow-up Date</option>
                      </optgroup>
                    </select>
                  </div>
                )}

                {addFieldType === 'custom_text' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label className="label-text" style={{ fontSize: '0.7rem' }}>Text Content</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      value={addFieldText}
                      onChange={e => setAddFieldText(e.target.value)}
                      placeholder="e.g. Terms & Conditions"
                    />
                  </div>
                )}

                {addFieldType === 'picture' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                      <div>
                        <label className="label-text" style={{ fontSize: '0.7rem' }}>Image Source</label>
                        <select
                          className="input-field"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          value={addFieldPicValue}
                          onChange={e => setAddFieldPicValue(e.target.value)}
                        >
                          <option value="preset">Clinic Logo Preset</option>
                          <option value="xray">X-Ray Attachment Preset</option>
                          <option value="signature">Signature Stamp Preset</option>
                          <option value="custom">Custom Image URL</option>
                        </select>
                      </div>
                      {addFieldPicValue === 'custom' && (
                        <div>
                          <label className="label-text" style={{ fontSize: '0.7rem' }}>Upload Image File</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setAddFieldPicUrl(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="input-field"
                            style={{ padding: '4px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}
                          />
                        </div>
                      )}
                    </div>
                    {addFieldPicValue === 'custom' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className="label-text" style={{ fontSize: '0.7rem' }}>Or Image URL</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          placeholder="https://example.com/image.png"
                          value={addFieldPicUrl}
                          onChange={e => setAddFieldPicUrl(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="button" 
                  className="btn btn-teal"
                  style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                  onClick={handleAddField}
                >
                  + Add Element to Template
                </button>
              </div>

              {/* SECTION 3: ELEMENT PROPERTIES EDITING */}
              {selectedFieldId ? (() => {
                const fields = designerForm.customFields || DEFAULT_CUSTOM_FIELDS;
                const field = fields.find(f => f.id === selectedFieldId);
                if (!field) return null;

                return (
                  <div 
                    onClick={e => e.stopPropagation()} 
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(139, 92, 246, 0.05)', padding: '12px', borderRadius: '8px', border: '1.5px solid var(--accent-purple)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', margin: 0 }}>Selected Element Properties</h4>
                      <span style={{ fontSize: '0.65rem', background: 'var(--accent-purple)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{field.type.replace('_', ' ')}</span>
                    </div>

                    {/* Content editing if applicable */}
                    {field.type === 'custom_text' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className="label-text" style={{ fontSize: '0.7rem' }}>Text Content</label>
                        <textarea 
                          className="input-field"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', resize: 'none' }}
                          rows={2}
                          value={field.value}
                          onChange={e => handleUpdateFieldProperty(field.id, 'value', e.target.value)}
                        />
                      </div>
                    )}

                    {field.type === 'db_field' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className="label-text" style={{ fontSize: '0.7rem' }}>Database Field</label>
                        <select
                          className="input-field"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          value={field.value}
                          onChange={e => {
                            handleUpdateFieldProperty(field.id, 'value', e.target.value);
                            handleUpdateFieldProperty(field.id, 'label', `DB: ${e.target.value.split('.').pop()}`);
                          }}
                        >
                          <optgroup label="Patient Fields">
                            <option value="patient.FullName">Patient Full Name</option>
                            <option value="patient.Mobile">Patient Mobile</option>
                            <option value="patient.Email">Patient Email</option>
                            <option value="patient.Address">Patient Address</option>
                            <option value="patient.InsuranceProvider">Insurance Provider</option>
                            <option value="patient.InsurancePolicyNumber">Insurance Policy No</option>
                          </optgroup>
                          <optgroup label="Doctor Fields">
                            <option value="doctor.FullName">Attending Doctor Name</option>
                            <option value="doctor.Specialization">Doctor Specialization</option>
                            <option value="doctor.Qualification">Doctor Qualification</option>
                          </optgroup>
                          <optgroup label="Invoice Fields">
                            <option value="invoice.InvoiceNumber">Invoice Number</option>
                            <option value="invoice.InvoiceDate">Invoice Date</option>
                            <option value="invoice.Status">Invoice Status</option>
                            <option value="invoice.SubTotal">Invoice Subtotal</option>
                            <option value="invoice.Discount">Invoice Discount</option>
                            <option value="invoice.TaxAmount">Invoice Tax</option>
                            <option value="invoice.TotalAmount">Invoice Total Due</option>
                            <option value="invoice.PaidAmount">Invoice Paid Amount</option>
                            <option value="invoice.BalanceDue">Outstanding Balance Due</option>
                            <option value="invoice.Notes">Invoice Notes</option>
                          </optgroup>
                          <optgroup label="Consultation Fields">
                            <option value="consultation.Diagnosis">Consultation Diagnosis</option>
                            <option value="consultation.Symptoms">Consultation Symptoms</option>
                            <option value="consultation.TreatmentAdvice">Treatment Advice</option>
                            <option value="consultation.FollowUpDate">Follow-up Date</option>
                          </optgroup>
                        </select>
                      </div>
                    )}

                    {field.type === 'picture' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                          <div>
                            <label className="label-text" style={{ fontSize: '0.7rem' }}>Image Source</label>
                            <select
                              className="input-field"
                              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                              value={field.value === 'preset' || field.value === 'xray' || field.value === 'signature' ? field.value : 'custom'}
                              onChange={e => {
                                if (e.target.value === 'custom') {
                                  handleUpdateFieldProperty(field.id, 'value', '');
                                } else {
                                  handleUpdateFieldProperty(field.id, 'value', e.target.value);
                                }
                              }}
                            >
                              <option value="preset">Clinic Logo Preset</option>
                              <option value="xray">X-Ray Attachment Preset</option>
                              <option value="signature">Signature Stamp Preset</option>
                              <option value="custom">Custom Image URL</option>
                            </select>
                          </div>
                          {field.value !== 'preset' && field.value !== 'xray' && field.value !== 'signature' && (
                            <div>
                              <label className="label-text" style={{ fontSize: '0.7rem' }}>Upload Image File</label>
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      handleUpdateFieldProperty(field.id, 'value', reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="input-field"
                                style={{ padding: '4px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}
                              />
                            </div>
                          )}
                        </div>
                        {field.value !== 'preset' && field.value !== 'xray' && field.value !== 'signature' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label className="label-text" style={{ fontSize: '0.7rem' }}>Or Image URL</label>
                            <input 
                              type="text" 
                              className="input-field" 
                              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                              placeholder="https://example.com/image.png"
                              value={field.value}
                              onChange={e => handleUpdateFieldProperty(field.id, 'value', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section Selector */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label className="label-text" style={{ fontSize: '0.7rem' }}>Placement Zone</label>
                        <select 
                          className="input-field"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          value={field.section}
                          onChange={e => handleUpdateFieldProperty(field.id, 'section', e.target.value)}
                        >
                          <option value="header">Header (Top)</option>
                          <option value="details_header">Details Top</option>
                          <option value="details_footer">Details Bottom</option>
                          <option value="footer">Footer (Bottom)</option>
                        </select>
                      </div>

                      <div>
                        <label className="label-text" style={{ fontSize: '0.7rem' }}>Font Family</label>
                        <select
                          className="input-field"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          value={field.fontFamily}
                          onChange={e => handleUpdateFieldProperty(field.id, 'fontFamily', e.target.value)}
                        >
                          <option value="inherit">Inherit Global Font</option>
                          <option value="sans-serif">Sans-Serif</option>
                          <option value="serif">Serif</option>
                          <option value="monospace">Monospace</option>
                        </select>
                      </div>
                    </div>

                    {/* Font sizes and Colors */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label className="label-text" style={{ fontSize: '0.7rem' }}>Font Size</label>
                        <select 
                          className="input-field"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          value={field.fontSize}
                          onChange={e => handleUpdateFieldProperty(field.id, 'fontSize', parseInt(e.target.value))}
                        >
                          {[8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28].map(size => (
                            <option key={size} value={size}>{size}px</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label-text" style={{ fontSize: '0.7rem' }}>Font Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input 
                            type="color" 
                            style={{ border: 'none', background: 'transparent', width: '28px', height: '28px', cursor: 'pointer', padding: 0 }}
                            value={field.color.startsWith('#') && field.color.length === 7 ? field.color : '#000000'}
                            onChange={e => handleUpdateFieldProperty(field.id, 'color', e.target.value)}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{field.color}</span>
                        </div>
                      </div>
                    </div>

                    {/* Alignment & Decoration buttons */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: field.fontWeight === 'bold' ? 'bold' : 'normal',
                            background: field.fontWeight === 'bold' ? 'var(--accent-purple)' : 'var(--border-color)',
                            color: '#ffffff'
                          }}
                          onClick={() => handleUpdateFieldProperty(field.id, 'fontWeight', field.fontWeight === 'bold' ? 'normal' : 'bold')}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontStyle: field.fontStyle === 'italic' ? 'italic' : 'normal',
                            background: field.fontStyle === 'italic' ? 'var(--accent-purple)' : 'var(--border-color)',
                            color: '#ffffff'
                          }}
                          onClick={() => handleUpdateFieldProperty(field.id, 'fontStyle', field.fontStyle === 'italic' ? 'normal' : 'italic')}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            textDecoration: field.textDecoration === 'underline' ? 'underline' : 'none',
                            background: field.textDecoration === 'underline' ? 'var(--accent-purple)' : 'var(--border-color)',
                            color: '#ffffff'
                          }}
                          onClick={() => handleUpdateFieldProperty(field.id, 'textDecoration', field.textDecoration === 'underline' ? 'none' : 'underline')}
                        >
                          U
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['left', 'center', 'right'].map(align => (
                          <button
                            key={align}
                            type="button"
                            className="btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.7rem',
                              background: field.textAlign === align ? 'var(--accent-teal)' : 'var(--border-color)',
                              color: '#ffffff'
                            }}
                            onClick={() => handleUpdateFieldProperty(field.id, 'textAlign', align)}
                          >
                            {align.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Width / Height sliders */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <span>Element Width: {field.width || 100}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        value={field.width || 100}
                        onChange={e => handleUpdateFieldProperty(field.id, 'width', parseInt(e.target.value))}
                        style={{ cursor: 'pointer', height: '4px', background: 'var(--border-color)' }}
                      />
                    </div>

                    {/* Height input for picture/divider */}
                    {(field.type === 'picture' || field.type === 'divider') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          <span>Element Height: {field.height || 30}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="2" 
                          max="200" 
                          value={field.height || 30}
                          onChange={e => handleUpdateFieldProperty(field.id, 'height', parseInt(e.target.value))}
                          style={{ cursor: 'pointer', height: '4px', background: 'var(--border-color)' }}
                        />
                      </div>
                    )}

                    {/* Coordinates manual sliders */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pos X: {field.x}%</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="95" 
                          value={field.x}
                          onChange={e => handleUpdateFieldProperty(field.id, 'x', parseInt(e.target.value))}
                          style={{ cursor: 'pointer', height: '4px', background: 'var(--border-color)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pos Y: {field.y}%</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="95" 
                          value={field.y}
                          onChange={e => handleUpdateFieldProperty(field.id, 'y', parseInt(e.target.value))}
                          style={{ cursor: 'pointer', height: '4px', background: 'var(--border-color)' }}
                        />
                      </div>
                    </div>

                    {/* Delete button */}
                    {field.id !== 'clinic-logo' && field.id !== 'clinic-name' && field.id !== 'invoice-items-table' && field.id !== 'invoice-calculations' && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '6px', fontSize: '0.8rem', marginTop: '4px' }}
                        onClick={() => handleRemoveField(field.id)}
                      >
                        Delete Element
                      </button>
                    )}
                  </div>
                );
              })() : (
                <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Click on any invoice element in the live preview to customize its font style, size, alignment, and coloring.
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setDesignerForm({ ...DEFAULT_TEMPLATE_CONFIG, customFields: DEFAULT_CUSTOM_FIELDS });
                  }}
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                >
                  Restore Defaults
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsDesignerOpen(false)}
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))', border: 'none', color: '#ffffff', padding: '8px 16px', fontSize: '0.8rem' }}
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
            <div className="designer-modal-right" onClick={() => setSelectedFieldId(null)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Design Canvas
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                  * Drag and drop items inside zones *
                </span>
              </div>

              <div 
                className="designer-preview-scroll"
                style={{ 
                  border: `2px solid ${designerForm.primaryColor}`,
                  borderRadius: '12px',
                  background: 'var(--bg-app)',
                  padding: '20px'
                }}
              >
                {renderInvoiceSlipLayout(null, true)}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
