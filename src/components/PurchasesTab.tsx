import React, { useState, useEffect } from 'react';
import type { Item, Supplier, InventoryTransaction, AccountTransaction, User, Ledger } from '../types';
import { ShoppingBag, Plus, FileText, X, Trash2, Users, Search, Edit } from 'lucide-react';

interface PurchasesTabProps {
  items: Item[];
  suppliers: Supplier[];
  transactions: InventoryTransaction[];
  accountTransactions: AccountTransaction[];
  users: User[];
  ledgers: Ledger[];
  addSupplier: (supplier: Omit<Supplier, 'SupplierId'>) => void;
  updateSupplier: (id: number, supplier: Supplier) => void;
  currentUser: User;
  addPurchase: (purchase: {
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
  }) => void;
  paySupplier: (payment: {
    SupplierId: number;
    PaymentMode: string;
    Amount: number;
    VoucherNo: string;
    Notes?: string;
  }) => void;
  currencySymbol?: string;
}

interface PurchaseGroup {
  VoucherNo: string;
  SupplierName: string;
  SupplierId: number;
  Date: string;
  HandledBy: string;
  Items: {
    ItemId: number;
    Quantity: number;
    Remarks?: string;
  }[];
  TotalAmount: number;
  PaymentMode: string;
  Notes?: string;
}

export const PurchasesTab: React.FC<PurchasesTabProps> = ({
  items,
  suppliers,
  transactions,
  accountTransactions,
  users,
  ledgers,
  addSupplier,
  updateSupplier,
  addPurchase,
  paySupplier,
  currentUser,
  currencySymbol = '$'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'create' | 'suppliers'>('invoices');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('All');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [supplierBalanceFilter, setSupplierBalanceFilter] = useState('All');
  const [selectedVoucherNo, setSelectedVoucherNo] = useState<string | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState<number | null>(null);

  const handleEditSupplier = (supplier: Supplier) => {
    setEditSupplierId(supplier.SupplierId);
    setSupplierForm({
      SupplierName: supplier.SupplierName,
      ContactPerson: supplier.ContactPerson || '',
      ContactNumber: supplier.ContactNumber || '',
      Email: supplier.Email || '',
      Address: supplier.Address || '',
      OpeningBalance: supplier.OpeningBalance || 0.00
    });
    setIsSupplierModalOpen(true);
  };
  const [selectedSupplierOutstandingId, setSelectedSupplierOutstandingId] = useState<number | null>(null);
  const [payingVoucherNo, setPayingVoucherNo] = useState<string | null>(null);
  const [supplierPaymentForm, setSupplierPaymentForm] = useState({
    PaymentMode: 'Cash' as 'Cash' | 'BankTransfer',
    Amount: 0,
    Notes: ''
  });

  // Supplier Form State
  const [supplierForm, setSupplierForm] = useState({
    SupplierName: '',
    ContactPerson: '',
    ContactNumber: '',
    Email: '',
    Address: '',
    OpeningBalance: 0.00
  });

  // Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({
    SupplierId: '',
    PaymentMode: 'Cash' as 'Cash' | 'BankTransfer' | 'Credit',
    Discount: 0.00,
    TaxAmount: 0.00,
    Notes: '',
    PaidAmount: 0.00,
    ImmediatePaymentMode: 'Cash' as 'Cash' | 'BankTransfer'
  });

  const [userHasEditedPaidAmount, setUserHasEditedPaidAmount] = useState(false);

  const [purchaseItems, setPurchaseItems] = useState<{
    ItemId: number;
    Quantity: number;
    PurchaseRate: number;
    BatchNumber: string;
    ExpiryDate: string;
  }[]>([]);

  const [newPurchaseItem, setNewPurchaseItem] = useState({
    ItemId: '',
    Quantity: 10,
    PurchaseRate: 5.00,
    BatchNumber: '',
    ExpiryDate: ''
  });

  // Helpers
  const getItemName = (itemId: number) => {
    const item = items.find(i => i.ItemId === itemId);
    return item ? item.ItemName : `Item #${itemId}`;
  };

  const getUserName = (userId: number) => {
    const u = users.find(usr => usr.UserId === userId);
    return u ? u.FullName : `User #${userId}`;
  };

  // Group purchase transactions by Voucher Number parsed from Remarks
  const parseVoucherNo = (remarks?: string) => {
    if (!remarks) return null;
    const match = remarks.match(/\[Voucher:\s*([^\]]+)\]/);
    return match ? match[1] : null;
  };

  const purchaseTransactions = transactions.filter(t => t.TransactionType === 'Purchase');

  // Build the list of purchase groups
  const purchaseGroupsMap = new Map<string, PurchaseGroup>();

  purchaseTransactions.forEach(tx => {
    const voucherNo = parseVoucherNo(tx.Remarks) || `PV-MOCK-${new Date(tx.TransactionDate).getTime().toString().slice(-4)}`;
    
    // Extract supplier name from remarks
    let supplierName = 'Unknown Supplier';
    let supplierId = 0;
    if (tx.Remarks) {
      const supMatch = tx.Remarks.match(/Supplier:\s*([^.]+)/);
      if (supMatch) {
        supplierName = supMatch[1].trim();
        const sup = suppliers.find(s => s.SupplierName === supplierName);
        if (sup) supplierId = sup.SupplierId;
      }
    }

    // Lookup accounting info for this voucher
    const relatedVoucherTxs = accountTransactions.filter(at => at.VoucherNo === voucherNo);
    const debitTx = relatedVoucherTxs.find(at => at.TransactionType === 'Dr');
    const creditTx = relatedVoucherTxs.find(at => at.TransactionType === 'Cr');
    
    const totalAmount = debitTx ? Number(debitTx.Amount) : 0;
    
    let paymentMode = 'Cash';
    if (debitTx?.VoucherType === 'Journal') {
      paymentMode = 'Credit';
    } else if (creditTx) {
      paymentMode = creditTx.LedgerId === 2 ? 'BankTransfer' : 'Cash';
    }

    const itemDetails = {
      ItemId: tx.ItemId,
      Quantity: tx.QuantityChange,
      Remarks: tx.Remarks
    };

    if (purchaseGroupsMap.has(voucherNo)) {
      const existing = purchaseGroupsMap.get(voucherNo)!;
      existing.Items.push(itemDetails);
      // Double check amount if multiple transactions are linked
      if (existing.TotalAmount === 0 && totalAmount > 0) {
        existing.TotalAmount = totalAmount;
        existing.PaymentMode = paymentMode;
        existing.Notes = debitTx?.Narration;
      }
    } else {
      purchaseGroupsMap.set(voucherNo, {
        VoucherNo: voucherNo,
        SupplierName: supplierName,
        SupplierId: supplierId,
        Date: tx.TransactionDate,
        HandledBy: getUserName(tx.UserId),
        Items: [itemDetails],
        TotalAmount: totalAmount || (tx.QuantityChange * (items.find(i => i.ItemId === tx.ItemId)?.PurchaseRate || 0)), // fallback calculation
        PaymentMode: paymentMode,
        Notes: debitTx?.Narration || tx.Remarks
      });
    }
  });

  const purchaseGroups = Array.from(purchaseGroupsMap.values()).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

  const getVoucherBalance = (group: PurchaseGroup) => {
    const totalBill = group.TotalAmount;
    
    // Find initial credit to supplier payable ledger for this voucher
    const supplierLedger = ledgers.find(l => l.ReferenceType === 'Supplier' && l.ReferenceId === group.SupplierId);
    const initialCreditTx = accountTransactions.find(at => 
      at.VoucherNo === group.VoucherNo && 
      at.TransactionType === 'Cr' && 
      supplierLedger && at.LedgerId === supplierLedger.LedgerId
    );
    
    const initialOutstanding = initialCreditTx ? Number(initialCreditTx.Amount) : 0;
    
    if (initialOutstanding === 0) {
      return {
        totalBill,
        paidAmount: totalBill,
        balance: 0
      };
    }
    
    // Find subsequent payments
    const subsequentPaid = accountTransactions
      .filter(at => at.TransactionType === 'Dr' && at.Narration && at.Narration.includes(`[Paid Voucher: ${group.VoucherNo}]`))
      .reduce((sum, at) => sum + Number(at.Amount), 0);
    
    return {
      totalBill,
      paidAmount: (totalBill - initialOutstanding) + subsequentPaid,
      balance: Math.max(0, initialOutstanding - subsequentPaid)
    };
  };

  const getSupplierOutstanding = (supplierId: number) => {
    const supplierLedger = ledgers.find(l => l.ReferenceType === 'Supplier' && l.ReferenceId === supplierId);
    return supplierLedger ? Number(supplierLedger.CurrentBalance) : 0;
  };

  const handleSupplierPaymentSubmit = (e: React.FormEvent, voucherNo: string, supplierId: number) => {
    e.preventDefault();
    if (supplierPaymentForm.Amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    
    paySupplier({
      SupplierId: supplierId,
      PaymentMode: supplierPaymentForm.PaymentMode,
      Amount: Math.round(supplierPaymentForm.Amount * 100) / 100,
      VoucherNo: voucherNo,
      Notes: supplierPaymentForm.Notes
    });

    setPayingVoucherNo(null);
    setSupplierPaymentForm({
      PaymentMode: 'Cash',
      Amount: 0,
      Notes: ''
    });
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.SupplierName) {
      alert('Supplier Name is required.');
      return;
    }

    if (editSupplierId) {
      updateSupplier(editSupplierId, {
        SupplierId: editSupplierId,
        SupplierName: supplierForm.SupplierName,
        ContactPerson: supplierForm.ContactPerson || undefined,
        ContactNumber: supplierForm.ContactNumber || undefined,
        Email: supplierForm.Email || undefined,
        Address: supplierForm.Address || undefined,
        OpeningBalance: Math.round((Number(supplierForm.OpeningBalance) || 0) * 100) / 100
      } as Supplier);
    } else {
      addSupplier({
        SupplierName: supplierForm.SupplierName,
        ContactPerson: supplierForm.ContactPerson || undefined,
        ContactNumber: supplierForm.ContactNumber || undefined,
        Email: supplierForm.Email || undefined,
        Address: supplierForm.Address || undefined,
        OpeningBalance: Math.round((Number(supplierForm.OpeningBalance) || 0) * 100) / 100
      });
    }

    setSupplierForm({
      SupplierName: '',
      ContactPerson: '',
      ContactNumber: '',
      Email: '',
      Address: '',
      OpeningBalance: 0.00
    });
    setEditSupplierId(null);
    setIsSupplierModalOpen(false);
  };

  const handleAddPurchaseItem = () => {
    if (!newPurchaseItem.ItemId || newPurchaseItem.Quantity <= 0) {
      alert('Item and valid quantity are required.');
      return;
    }
    const alreadyExists = purchaseItems.some(i => i.ItemId === parseInt(newPurchaseItem.ItemId));
    if (alreadyExists) {
      alert('Item is already added to the purchase list.');
      return;
    }

    setPurchaseItems(prev => [...prev, {
      ItemId: parseInt(newPurchaseItem.ItemId),
      Quantity: Number(newPurchaseItem.Quantity) || 1,
      PurchaseRate: Number(newPurchaseItem.PurchaseRate) || 0,
      BatchNumber: newPurchaseItem.BatchNumber || '',
      ExpiryDate: newPurchaseItem.ExpiryDate || ''
    }]);

    setNewPurchaseItem({
      ItemId: '',
      Quantity: 10,
      PurchaseRate: 5.00,
      BatchNumber: '',
      ExpiryDate: ''
    });
  };

  const handleRemovePurchaseItem = (idx: number) => {
    setPurchaseItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.SupplierId || purchaseItems.length === 0) {
      alert('Supplier and at least 1 item are required.');
      return;
    }

    const finalPaymentMode = purchaseForm.PaymentMode === 'Credit' 
      ? (purchaseForm.PaidAmount > 0 ? purchaseForm.ImmediatePaymentMode : 'Credit')
      : purchaseForm.PaymentMode;
    const paid = Math.round(purchaseForm.PaidAmount * 100) / 100;

    addPurchase({
      SupplierId: parseInt(purchaseForm.SupplierId),
      PaymentMode: finalPaymentMode,
      Discount: Math.round((Number(purchaseForm.Discount) || 0) * 100) / 100,
      TaxAmount: Math.round((Number(purchaseForm.TaxAmount) || 0) * 100) / 100,
      Notes: purchaseForm.Notes,
      Items: purchaseItems.map(i => ({
        ItemId: i.ItemId,
        Quantity: i.Quantity,
        PurchaseRate: Math.round(i.PurchaseRate * 100) / 100,
        BatchNumber: i.BatchNumber ? i.BatchNumber : undefined,
        ExpiryDate: i.ExpiryDate ? i.ExpiryDate : undefined
      })),
      PaidAmount: paid
    });

    setPurchaseForm({
      SupplierId: '',
      PaymentMode: 'Cash',
      Discount: 0.00,
      TaxAmount: 0.00,
      Notes: '',
      PaidAmount: 0.00,
      ImmediatePaymentMode: 'Cash'
    });
    setUserHasEditedPaidAmount(false);
    setPurchaseItems([]);
    setActiveSubTab('invoices');
  };

  const purchaseSubtotal = purchaseItems.reduce((acc, curr) => acc + (curr.Quantity * curr.PurchaseRate), 0);
  const purchaseTotal = (purchaseSubtotal - Number(purchaseForm.Discount) || 0) + (Number(purchaseForm.TaxAmount) || 0);

  useEffect(() => {
    if (!userHasEditedPaidAmount) {
      if (purchaseForm.PaymentMode === 'Credit') {
        setPurchaseForm(prev => ({ ...prev, PaidAmount: 0.00 }));
      } else {
        setPurchaseForm(prev => ({ ...prev, PaidAmount: purchaseTotal }));
      }
    }
  }, [purchaseTotal, purchaseForm.PaymentMode, userHasEditedPaidAmount]);

  // Selected Purchase details modal
  const selectedGroup = purchaseGroups.find(g => g.VoucherNo === selectedVoucherNo);
  const selectedVoucherTxs = selectedVoucherNo ? accountTransactions.filter(at => at.VoucherNo === selectedVoucherNo) : [];

  // Parse transaction summary
  let subTotal = 0;
  let discount = 0;
  let tax = 0;
  let paidAmount = 0;
  let balance = 0;
  let totalBill = 0;

  if (selectedGroup) {
    const debitTx = selectedVoucherTxs.find(at => at.TransactionType === 'Dr');
    const narration = debitTx?.Narration || selectedGroup.Notes || '';
    const subTotalMatch = narration.match(/SubTotal:\s*([\d.]+)/i);
    const discountMatch = narration.match(/Discount:\s*([\d.]+)/i);
    const taxMatch = narration.match(/Tax:\s*([\d.]+)/i);

    const parsedSubTotal = subTotalMatch ? parseFloat(subTotalMatch[1]) : null;
    const parsedDiscount = discountMatch ? parseFloat(discountMatch[1]) : null;
    const parsedTax = taxMatch ? parseFloat(taxMatch[1]) : null;

    totalBill = selectedGroup.TotalAmount;

    if (parsedSubTotal !== null) {
      subTotal = parsedSubTotal;
      discount = parsedDiscount || 0;
      tax = parsedTax || 0;
    } else {
      // Fallback calculation using current rate from items list
      const calculatedSubtotal = selectedGroup.Items.reduce((sum, item) => {
        const rate = items.find(i => i.ItemId === item.ItemId)?.PurchaseRate || 0;
        return sum + (item.Quantity * rate);
      }, 0);

      if (calculatedSubtotal > 0) {
        subTotal = calculatedSubtotal;
        if (totalBill < calculatedSubtotal) {
          discount = calculatedSubtotal - totalBill;
          tax = 0;
        } else if (totalBill > calculatedSubtotal) {
          tax = totalBill - calculatedSubtotal;
          discount = 0;
        } else {
          discount = 0;
          tax = 0;
        }
      } else {
        subTotal = totalBill;
        discount = 0;
        tax = 0;
      }
    }

    const voucherBalances = getVoucherBalance(selectedGroup);
    paidAmount = voucherBalances.paidAmount;
    balance = voucherBalances.balance;
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="sub-tabs-container">
          <button 
            className="btn" 
            style={{ 
              background: activeSubTab === 'invoices' ? 'var(--accent-purple-glow)' : 'transparent',
              color: activeSubTab === 'invoices' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderLeft: activeSubTab === 'invoices' ? '3px solid var(--accent-purple)' : '3px solid transparent',
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
            onClick={() => setActiveSubTab('invoices')}
          >
            <FileText size={16} /> Purchase Invoices
          </button>
          <button 
            className="btn" 
            style={{ 
              background: activeSubTab === 'create' ? 'var(--accent-purple-glow)' : 'transparent',
              color: activeSubTab === 'create' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderLeft: activeSubTab === 'create' ? '3px solid var(--accent-purple)' : '3px solid transparent',
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
            onClick={() => setActiveSubTab('create')}
          >
            <ShoppingBag size={16} /> Record Purchase
          </button>
          <button 
            className="btn" 
            style={{ 
              background: activeSubTab === 'suppliers' ? 'var(--accent-purple-glow)' : 'transparent',
              color: activeSubTab === 'suppliers' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderLeft: activeSubTab === 'suppliers' ? '3px solid var(--accent-purple)' : '3px solid transparent',
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
            onClick={() => setActiveSubTab('suppliers')}
          >
            <Users size={16} /> Suppliers Directory
          </button>
        </div>

        <div>
          {activeSubTab === 'suppliers' && (
            <button className="btn btn-teal" onClick={() => setIsSupplierModalOpen(true)}>
              <Plus size={16} /> Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* 1. Sub-Tab: Purchase Invoices List */}
      {activeSubTab === 'invoices' && (() => {
        const filteredPurchaseGroups = purchaseGroups.filter(group => {
          const voucher = group.VoucherNo.toLowerCase();
          const supName = group.SupplierName.toLowerCase();
          const notes = (group.Notes || '').toLowerCase();
          const search = invoiceSearchTerm.toLowerCase();
          const matchesSearch = voucher.includes(search) || supName.includes(search) || notes.includes(search);

          const matchesMode = paymentModeFilter === 'All' || group.PaymentMode.toLowerCase() === paymentModeFilter.toLowerCase();

          return matchesSearch && matchesMode;
        }).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

        return (
          <div className="glass-panel fade-in" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Purchase Invoices / Vouchers Journal</h3>
            
            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '2 1 200px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search voucher no, supplier, notes..." 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={invoiceSearchTerm}
                  onChange={e => setInvoiceSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="input-field" 
                style={{ flex: '1 1 150px' }}
                value={paymentModeFilter}
                onChange={e => setPaymentModeFilter(e.target.value)}
              >
                <option value="All">All Payment Modes</option>
                <option value="Cash">Cash</option>
                <option value="BankTransfer">Bank Deposit</option>
                <option value="Credit">Credit</option>
              </select>
            </div>

            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Voucher No</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchaseGroups.map(group => (
                    <tr key={group.VoucherNo}>
                      <td>
                        <button 
                          className="btn btn-link" 
                          style={{ color: 'var(--accent-teal)', fontWeight: 600, padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
                          onClick={() => setSelectedVoucherNo(group.VoucherNo)}
                        >
                          {group.VoucherNo}
                        </button>
                      </td>
                      <td>{new Date(group.Date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{group.SupplierName}</td>
                      <td style={{ fontWeight: 700 }}>{currencySymbol}{group.TotalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {filteredPurchaseGroups.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No purchases match filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 2. Sub-Tab: Record Purchase Form */}
      {activeSubTab === 'create' && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Record Purchase Invoice</h3>
            
            <form onSubmit={handlePurchaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="grid-2">
                <div>
                  <label className="label-text">Select Supplier *</label>
                  <select 
                    className="input-field" 
                    required 
                    value={purchaseForm.SupplierId}
                    onChange={e => setPurchaseForm(prev => ({ ...prev, SupplierId: e.target.value }))}
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.SupplierId} value={s.SupplierId}>{s.SupplierName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Payment Mode *</label>
                  <select 
                    className="input-field" 
                    required 
                    value={purchaseForm.PaymentMode}
                    onChange={e => {
                      const newMode = e.target.value as any;
                      setPurchaseForm(prev => ({ 
                        ...prev, 
                        PaymentMode: newMode,
                        PaidAmount: newMode === 'Credit' ? 0.00 : purchaseTotal
                      }));
                      setUserHasEditedPaidAmount(false);
                    }}
                  >
                    <option value="Cash">Paid via Cash</option>
                    <option value="BankTransfer">Paid via Bank Deposit</option>
                    <option value="Credit">On Account (Credit/Accounts Payable)</option>
                  </select>
                </div>
              </div>

              {/* Items in purchase list */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--accent-teal)' }}>Invoice Items</h4>
                
                {purchaseItems.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                    No items added yet. Use the selector panel on the right.
                  </p>
                ) : (
                  <div className="table-container" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Product</th>
                          <th style={{ padding: '8px' }}>Batch</th>
                          <th style={{ padding: '8px' }}>Expiry</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Purchase Rate</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: '8px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseItems.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{getItemName(item.ItemId)}</td>
                            <td style={{ padding: '8px' }}>{item.BatchNumber || 'N/A'}</td>
                            <td style={{ padding: '8px' }}>{item.ExpiryDate ? new Date(item.ExpiryDate).toLocaleDateString() : 'N/A'}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{item.Quantity}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{currencySymbol}{item.PurchaseRate.toFixed(2)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{currencySymbol}{(item.Quantity * item.PurchaseRate).toFixed(2)}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                onClick={() => handleRemovePurchaseItem(idx)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div>
                  <label className="label-text">Discount ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input-field" 
                    value={purchaseForm.Discount}
                    onChange={e => setPurchaseForm(prev => ({ ...prev, Discount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="label-text">Tax & Charges ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input-field" 
                    value={purchaseForm.TaxAmount}
                    onChange={e => setPurchaseForm(prev => ({ ...prev, TaxAmount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--accent-teal)' }}>Payment Allocation</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label className="label-text">Paid Amount ({currencySymbol}) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      max={purchaseTotal}
                      className="input-field" 
                      value={purchaseForm.PaidAmount}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setPurchaseForm(prev => ({ ...prev, PaidAmount: val }));
                        setUserHasEditedPaidAmount(true);
                      }}
                    />
                  </div>
                  
                  <div>
                    {purchaseForm.PaymentMode === 'Credit' ? (
                      purchaseForm.PaidAmount > 0 ? (
                        <>
                          <label className="label-text">Immediate Payment Mode *</label>
                          <select 
                            className="input-field" 
                            value={purchaseForm.ImmediatePaymentMode}
                            onChange={e => setPurchaseForm(prev => ({ ...prev, ImmediatePaymentMode: e.target.value as any }))}
                          >
                            <option value="Cash">Paid portion via Cash</option>
                            <option value="BankTransfer">Paid portion via Bank Deposit</option>
                          </select>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '20px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            100% on Credit (No immediate payment)
                          </span>
                        </div>
                      )
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '20px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Method: <strong>{purchaseForm.PaymentMode === 'Cash' ? 'Cash' : 'Bank Deposit'}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {purchaseTotal - purchaseForm.PaidAmount > 0 && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#fbbf24', 
                    background: 'rgba(251, 191, 36, 0.08)', 
                    padding: '8px 12px', 
                    borderRadius: '6px',
                    border: '1px solid rgba(251, 191, 36, 0.15)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Remaining Balance (Accounts Payable):</span>
                    <strong style={{ fontSize: '0.9rem' }}>{currencySymbol}{(purchaseTotal - purchaseForm.PaidAmount).toFixed(2)}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="label-text">Purchase Remarks / Notes</label>
                <textarea 
                  className="input-field" 
                  style={{ height: '60px', resize: 'none' }}
                  placeholder="Billing reference details..."
                  value={purchaseForm.Notes}
                  onChange={e => setPurchaseForm(prev => ({ ...prev, Notes: e.target.value }))}
                />
              </div>

              {purchaseItems.length > 0 && (
                <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
                  Post Purchase Voucher
                </button>
              )}

            </form>
          </div>

          {/* Selector Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Add Product</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="label-text" style={{ fontSize: '0.75rem' }}>Select Product *</label>
                  <select 
                    className="input-field" 
                    value={newPurchaseItem.ItemId}
                    onChange={e => {
                      const id = parseInt(e.target.value);
                      const item = items.find(i => i.ItemId === id);
                      setNewPurchaseItem(prev => ({
                        ...prev,
                        ItemId: e.target.value,
                        PurchaseRate: item ? item.PurchaseRate : 5.00
                      }));
                    }}
                  >
                    <option value="">-- Choose Product --</option>
                    {items.filter(i => i.IsActive).map(i => (
                      <option key={i.ItemId} value={i.ItemId}>{i.ItemName}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                  <div>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Quantity *</label>
                    <input 
                      type="number" 
                      min="1"
                      className="input-field" 
                      value={newPurchaseItem.Quantity}
                      onChange={e => setNewPurchaseItem(prev => ({ ...prev, Quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Purchase Rate ({currencySymbol}) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="input-field" 
                      value={newPurchaseItem.PurchaseRate}
                      onChange={e => setNewPurchaseItem(prev => ({ ...prev, PurchaseRate: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Batch Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. BT-404"
                      className="input-field" 
                      value={newPurchaseItem.BatchNumber}
                      onChange={e => setNewPurchaseItem(prev => ({ ...prev, BatchNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label-text" style={{ fontSize: '0.75rem' }}>Expiry Date</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={newPurchaseItem.ExpiryDate}
                      onChange={e => setNewPurchaseItem(prev => ({ ...prev, ExpiryDate: e.target.value }))}
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-teal" 
                  style={{ width: '100%', padding: '10px' }} 
                  onClick={handleAddPurchaseItem}
                >
                  Add to Purchase
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Calculation Breakdown</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>{currencySymbol}{purchaseSubtotal.toFixed(2)}</span>
              </div>
              {Number(purchaseForm.Discount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#f87171' }}>
                  <span>Discount:</span>
                  <span>-{currencySymbol}{Number(purchaseForm.Discount).toFixed(2)}</span>
                </div>
              )}
              {Number(purchaseForm.TaxAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Tax & Charges:</span>
                  <span>+{currencySymbol}{Number(purchaseForm.TaxAmount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px dashed var(--border-color)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
                <span>Total Bill:</span>
                <span>{currencySymbol}{purchaseTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Sub-Tab: Suppliers List */}
      {activeSubTab === 'suppliers' && (() => {
        const filteredSuppliers = suppliers.filter(sup => {
          const name = sup.SupplierName.toLowerCase();
          const contact = (sup.ContactPerson || '').toLowerCase();
          const email = (sup.Email || '').toLowerCase();
          const phone = (sup.ContactNumber || '').toLowerCase();
          const search = supplierSearchTerm.toLowerCase();
          const matchesSearch = name.includes(search) || contact.includes(search) || email.includes(search) || phone.includes(search);

          const outstanding = getSupplierOutstanding(sup.SupplierId);
          let matchesBalance = true;
          if (supplierBalanceFilter === 'HasOutstanding') {
            matchesBalance = outstanding > 0;
          } else if (supplierBalanceFilter === 'NoOutstanding') {
            matchesBalance = outstanding === 0;
          }

          return matchesSearch && matchesBalance;
        }).sort((a, b) => b.SupplierId - a.SupplierId);

        return (
          <div className="glass-panel fade-in" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Registered Suppliers Directory</h3>
            
            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '2 1 200px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search supplier company, contact person, contact details..." 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={supplierSearchTerm}
                  onChange={e => setSupplierSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="input-field" 
                style={{ flex: '1 1 150px' }}
                value={supplierBalanceFilter}
                onChange={e => setSupplierBalanceFilter(e.target.value)}
              >
                <option value="All">All Suppliers</option>
                <option value="HasOutstanding">Has Outstanding Balance</option>
                <option value="NoOutstanding">No Outstanding Balance</option>
              </select>
            </div>

            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Contact Person</th>
                    <th>Phone Number</th>
                    <th>Email Address</th>
                    <th>Warehouse Address</th>
                    <th style={{ textAlign: 'right' }}>Outstanding Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No suppliers match filters.</td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(sup => {
                      const outstanding = getSupplierOutstanding(sup.SupplierId);
                      return (
                        <tr key={sup.SupplierId}>
                          <td style={{ fontWeight: 600 }}>{sup.SupplierName}</td>
                          <td>{sup.ContactPerson || 'N/A'}</td>
                          <td>{sup.ContactNumber || 'N/A'}</td>
                          <td>{sup.Email || 'N/A'}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sup.Address || 'N/A'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {outstanding > 0 ? (
                              <button 
                                className="btn btn-link" 
                                style={{ 
                                  color: '#fbbf24', 
                                  background: 'none', 
                                  border: 'none', 
                                  padding: 0, 
                                  cursor: 'pointer', 
                                  fontWeight: 700, 
                                  textDecoration: 'underline',
                                  fontSize: 'inherit'
                                }}
                                onClick={() => setSelectedSupplierOutstandingId(sup.SupplierId)}
                              >
                                {currencySymbol}{outstanding.toFixed(2)}
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>{currencySymbol}0.00</span>
                            )}
                          </td>
                          <td>
                            {currentUser.RoleId === 1 ? (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => handleEditSupplier(sup)}
                              >
                                <Edit size={12} /> Edit
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Locked</span>
                            )}
                          </td>
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

      {/* Purchase Invoice Details Modal */}
      {selectedVoucherNo && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Purchase Invoice Details</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Voucher: <strong style={{ color: 'var(--accent-teal)' }}>{selectedGroup.VoucherNo}</strong></span>
              </div>
              <button 
                onClick={() => setSelectedVoucherNo(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Info grid */}
              <div className="grid-2" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '16px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Supplier</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedGroup.SupplierName}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Date</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {new Date(selectedGroup.Date).toLocaleDateString()} {new Date(selectedGroup.Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Payment Mode</span>
                    <span className={`badge ${selectedGroup.PaymentMode === 'Credit' ? 'badge-waiting' : 'badge-completed'}`} style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                      {selectedGroup.PaymentMode === 'Credit' ? 'On Credit (Payable)' : `Paid (${selectedGroup.PaymentMode})`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Posted By</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedGroup.HandledBy}</strong>
                  </div>
                  {selectedGroup.Notes && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Narration / Notes</span>
                      <em style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-word', fontStyle: 'normal' }}>
                        {selectedGroup.Notes.replace(/\s*\[SubTotal:[^\]]+\]/gi, '')}
                      </em>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase lines */}
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--accent-teal)' }}>Invoice Items</h4>
                <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>Product</th>
                        <th style={{ padding: '10px 12px' }}>Batch</th>
                        <th style={{ padding: '10px 12px' }}>Expiry</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Purchase Rate</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGroup.Items.map((item, idx) => {
                        const itemFromStore = items.find(i => i.ItemId === item.ItemId);
                        const remarks = item.Remarks || '';
                        
                        const batchMatch = remarks.match(/Batch:\s*([^;.|\]\n]+)/i);
                        const expiryMatch = remarks.match(/Expiry:\s*([^;.|\]\n]+)/i);
                        const rateMatch = remarks.match(/Rate:\s*([\d.]+)/i);

                        const batch = batchMatch ? batchMatch[1].trim() : (itemFromStore?.BatchNumber || 'N/A');
                        const expiryRaw = expiryMatch ? expiryMatch[1].trim() : '';
                        const expiry = expiryRaw 
                          ? (expiryRaw === 'N/A' ? 'N/A' : new Date(expiryRaw).toLocaleDateString())
                          : (itemFromStore?.ExpiryDate ? new Date(itemFromStore.ExpiryDate).toLocaleDateString() : 'N/A');
                        
                        const rate = rateMatch ? parseFloat(rateMatch[1]) : (itemFromStore?.PurchaseRate || 0);
                        const amount = item.Quantity * rate;

                        return (
                          <tr key={idx} style={{ borderBottom: idx === selectedGroup.Items.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{getItemName(item.ItemId)}</td>
                            <td style={{ padding: '10px 12px' }}>{batch}</td>
                            <td style={{ padding: '10px 12px' }}>{expiry}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.Quantity}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{currencySymbol}{rate.toFixed(2)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{currencySymbol}{amount.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction Summary */}
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Transaction Summary</h4>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currencySymbol}{subTotal.toFixed(2)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#f87171' }}>
                      <span>Discount</span>
                      <span>-{currencySymbol}{discount.toFixed(2)}</span>
                    </div>
                  )}

                  {tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>Tax & Charges</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>+{currencySymbol}{tax.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ borderTop: '1px dashed var(--border-color)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span>Total Bill</span>
                    <span>{currencySymbol}{totalBill.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--status-completed-text)' }}>
                    <span>Paid Amount</span>
                    <span style={{ fontWeight: 600 }}>{currencySymbol}{paidAmount.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, color: balance > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                    <span>Balance Due</span>
                    <span>{currencySymbol}{balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Supplier Register Modal */}
      {isSupplierModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>{editSupplierId ? 'Modify Supplier Details' : 'Register New Supplier'}</h2>
              <button 
                onClick={() => {
                  setEditSupplierId(null);
                  setIsSupplierModalOpen(false);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-text">Supplier Company Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  placeholder="e.g. Apex Dental Supplies"
                  value={supplierForm.SupplierName}
                  onChange={e => setSupplierForm(prev => ({ ...prev, SupplierName: e.target.value }))}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Contact Representative</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Thomas Scott"
                    value={supplierForm.ContactPerson}
                    onChange={e => setSupplierForm(prev => ({ ...prev, ContactPerson: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-text">Contact Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. +1 (555) 777-1122"
                    value={supplierForm.ContactNumber}
                    onChange={e => setSupplierForm(prev => ({ ...prev, ContactNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Email Address</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    placeholder="e.g. orders@apexdental.com"
                    value={supplierForm.Email}
                    onChange={e => setSupplierForm(prev => ({ ...prev, Email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-text">Opening Balance / Outstanding ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="input-field" 
                    placeholder="e.g. 0.00"
                    value={supplierForm.OpeningBalance}
                    onChange={e => setSupplierForm(prev => ({ ...prev, OpeningBalance: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Warehouse Address</label>
                <textarea 
                  className="input-field" 
                  style={{ height: '60px', resize: 'none' }}
                  placeholder="e.g. Chicago, IL"
                  value={supplierForm.Address}
                  onChange={e => setSupplierForm(prev => ({ ...prev, Address: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setEditSupplierId(null);
                  setIsSupplierModalOpen(false);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editSupplierId ? 'Save Changes' : 'Register Vendor'}</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Outstanding Purchases Modal */}
      {selectedSupplierOutstandingId && (
        (() => {
          const outstandingSupplier = suppliers.find(s => s.SupplierId === selectedSupplierOutstandingId);
          const outstandingPurchases = purchaseGroups.filter(g => g.SupplierId === selectedSupplierOutstandingId && getVoucherBalance(g).balance > 0).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
          
          return (
            <div className="modal-overlay">
              <div className="modal-content glass-panel" style={{ maxWidth: '800px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem' }}>Outstanding Purchases</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Supplier: <strong style={{ color: 'var(--accent-teal)' }}>{outstandingSupplier?.SupplierName}</strong></span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedSupplierOutstandingId(null);
                      setPayingVoucherNo(null);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {outstandingPurchases.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No outstanding credit invoices found for this supplier.</p>
                ) : (
                  <div className="table-container" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px' }}>Voucher No</th>
                          <th style={{ padding: '10px 12px' }}>Date</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Bill</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Paid Amount</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Outstanding</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outstandingPurchases.map(group => {
                          const { totalBill, paidAmount, balance } = getVoucherBalance(group);
                          const isPaying = payingVoucherNo === group.VoucherNo;
                          
                          return (
                            <React.Fragment key={group.VoucherNo}>
                              <tr style={{ borderBottom: isPaying ? 'none' : '1px solid var(--border-color)' }}>
                                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{group.VoucherNo}</td>
                                <td style={{ padding: '10px 12px' }}>{new Date(group.Date).toLocaleDateString()}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>{currencySymbol}{totalBill.toFixed(2)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--status-completed-text)' }}>{currencySymbol}{paidAmount.toFixed(2)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>{currencySymbol}{balance.toFixed(2)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  {!isPaying && (
                                    <button 
                                      className="btn btn-teal" 
                                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                      onClick={() => {
                                        setPayingVoucherNo(group.VoucherNo);
                                        setSupplierPaymentForm({
                                          PaymentMode: 'Cash',
                                          Amount: balance,
                                          Notes: ''
                                        });
                                      }}
                                    >
                                      Pay Bill
                                    </button>
                                  )}
                                </td>
                              </tr>
                              {isPaying && (
                                <tr style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
                                  <td colSpan={6} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                    <form onSubmit={(e) => handleSupplierPaymentSubmit(e, group.VoucherNo, group.SupplierId)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                      <h5 style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', margin: 0 }}>Record Payment for {group.VoucherNo}</h5>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div>
                                          <label className="label-text" style={{ fontSize: '0.7rem' }}>Payment Mode *</label>
                                          <select 
                                            className="input-field" 
                                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                            value={supplierPaymentForm.PaymentMode}
                                            onChange={ev => setSupplierPaymentForm(prev => ({ ...prev, PaymentMode: ev.target.value as any }))}
                                          >
                                            <option value="Cash">Cash</option>
                                            <option value="BankTransfer">Bank Deposit</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="label-text" style={{ fontSize: '0.7rem' }}>Amount to Pay ({currencySymbol}) *</label>
                                          <input 
                                            type="number" 
                                            step="0.01"
                                            min="0.01"
                                            max={balance}
                                            className="input-field" 
                                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                            value={supplierPaymentForm.Amount}
                                            onChange={ev => setSupplierPaymentForm(prev => ({ ...prev, Amount: parseFloat(ev.target.value) || 0 }))}
                                          />
                                        </div>
                                        <div>
                                          <label className="label-text" style={{ fontSize: '0.7rem' }}>Payment Notes</label>
                                          <input 
                                            type="text" 
                                            placeholder="Partial payment details..."
                                            className="input-field" 
                                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                            value={supplierPaymentForm.Notes}
                                            onChange={ev => setSupplierPaymentForm(prev => ({ ...prev, Notes: ev.target.value }))}
                                          />
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                                        <button 
                                          type="button" 
                                          className="btn btn-secondary" 
                                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                          onClick={() => setPayingVoucherNo(null)}
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          type="submit" 
                                          className="btn btn-primary" 
                                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                          Post Payment
                                        </button>
                                      </div>
                                    </form>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}

    </div>
  );
};
