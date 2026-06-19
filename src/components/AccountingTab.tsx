import React, { useState } from 'react';
import type { Ledger, AccountTransaction, AccountGroup } from '../types';
import { Book, Receipt, BarChart2, ShieldCheck, Search, CalendarDays, ArrowLeft, ArrowRight, Wallet, Landmark, CheckCircle2, AlertTriangle, Plus, Edit, Trash2, Lock, X } from 'lucide-react';

interface AccountingTabProps {
  ledgers: Ledger[];
  accountGroups: AccountGroup[];
  transactions: AccountTransaction[];
  currencySymbol?: string;
  addLedger: (ledger: any) => Promise<void>;
  updateLedger: (id: number, ledger: any) => Promise<void>;
  deleteLedger: (id: number) => Promise<void>;
}

export const AccountingTab: React.FC<AccountingTabProps> = ({
  ledgers,
  accountGroups,
  transactions,
  currencySymbol = '$',
  addLedger,
  updateLedger,
  deleteLedger
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'daybook' | 'ledgers' | 'journal' | 'trial'>('daybook');
  const [searchTerm, setSearchTerm] = useState('');
  const [ledgerGroupFilter, setLedgerGroupFilter] = useState('All');
  const [ledgerBalanceTypeFilter, setLedgerBalanceTypeFilter] = useState('All');

  const [dayBookSearchTerm, setDayBookSearchTerm] = useState('');
  const [dayBookVoucherTypeFilter, setDayBookVoucherTypeFilter] = useState('All');
  const [dayBookTransactionTypeFilter, setDayBookTransactionTypeFilter] = useState('All');

  const [journalSearchTerm, setJournalSearchTerm] = useState('');
  const [journalVoucherTypeFilter, setJournalVoucherTypeFilter] = useState('All');
  const [journalTransactionTypeFilter, setJournalTransactionTypeFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [editLedgerId, setEditLedgerId] = useState<number | null>(null);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ledgerForm, setLedgerForm] = useState({
    LedgerName: '',
    GroupId: 0,
    OpeningBalance: 0.00,
    BalanceType: 'Dr' as 'Dr' | 'Cr'
  });

  const handleEditLedger = (ledger: Ledger) => {
    setEditLedgerId(ledger.LedgerId);
    setLedgerForm({
      LedgerName: ledger.LedgerName,
      GroupId: ledger.GroupId,
      OpeningBalance: ledger.OpeningBalance,
      BalanceType: ledger.BalanceType as 'Dr' | 'Cr'
    });
    setLedgerError(null);
    setIsLedgerModalOpen(true);
  };

  const handleCreateLedgerClick = () => {
    setEditLedgerId(null);
    setLedgerForm({
      LedgerName: '',
      GroupId: 0,
      OpeningBalance: 0.00,
      BalanceType: 'Dr'
    });
    setLedgerError(null);
    setIsLedgerModalOpen(true);
  };

  const handleLedgerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ledgerForm.GroupId === 0) {
      setLedgerError('Please select a valid Account Group.');
      return;
    }
    try {
      if (editLedgerId) {
        await updateLedger(editLedgerId, {
          LedgerId: editLedgerId,
          ...ledgerForm
        });
      } else {
        await addLedger(ledgerForm);
      }
      setIsLedgerModalOpen(false);
      setEditLedgerId(null);
    } catch (err: any) {
      setLedgerError(err.message || 'An error occurred while saving the ledger.');
    }
  };

  const handleDeleteLedgerClick = async (ledger: Ledger) => {
    if (window.confirm(`Are you sure you want to delete the ledger "${ledger.LedgerName}"?`)) {
      try {
        await deleteLedger(ledger.LedgerId);
      } catch (err: any) {
        alert(err.message || 'Failed to delete ledger.');
      }
    }
  };

  const getGroupName = (groupId: number) => {
    const group = accountGroups.find(g => g.GroupId === groupId);
    return group ? group.GroupName : `Group #${groupId}`;
  };

  const getLedgerName = (ledgerId: number) => {
    const led = ledgers.find(l => l.LedgerId === ledgerId);
    return led ? led.LedgerName : `Ledger #${ledgerId}`;
  };

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Filter and sort transactions for Day Book
  const dayBookTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.VoucherDate);
    const txYear = txDate.getFullYear();
    const txMonth = String(txDate.getMonth() + 1).padStart(2, '0');
    const txDay = String(txDate.getDate()).padStart(2, '0');
    const txDateStr = `${txYear}-${txMonth}-${txDay}`;
    const matchesDate = txDateStr === selectedDate;

    const voucher = tx.VoucherNo.toLowerCase();
    const ledger = getLedgerName(tx.LedgerId).toLowerCase();
    const narration = (tx.Narration || '').toLowerCase();
    const search = dayBookSearchTerm.toLowerCase();
    const matchesSearch = voucher.includes(search) || ledger.includes(search) || narration.includes(search);

    const matchesVoucherType = dayBookVoucherTypeFilter === 'All' || tx.VoucherType === dayBookVoucherTypeFilter;
    const matchesTransactionType = dayBookTransactionTypeFilter === 'All' || tx.TransactionType === dayBookTransactionTypeFilter;

    return matchesDate && matchesSearch && matchesVoucherType && matchesTransactionType;
  });

  const sortedDayBookTransactions = [...dayBookTransactions].sort((a, b) => {
    if (a.VoucherNo !== b.VoucherNo) {
      return a.VoucherNo.localeCompare(b.VoucherNo);
    }
    if (a.TransactionType !== b.TransactionType) {
      return a.TransactionType === 'Dr' ? -1 : 1;
    }
    return a.TransactionId - b.TransactionId;
  });

  const dayTotalDebits = sortedDayBookTransactions
    .filter(tx => tx.TransactionType === 'Dr')
    .reduce((sum, tx) => sum + tx.Amount, 0);

  const dayTotalCredits = sortedDayBookTransactions
    .filter(tx => tx.TransactionType === 'Cr')
    .reduce((sum, tx) => sum + tx.Amount, 0);

  // Dynamic cash and bank ledger tracking
  const cashLedger = ledgers.find(l => l.LedgerName.toLowerCase() === 'cash in hand');
  const bankLedger = ledgers.find(l => l.LedgerName.toLowerCase().includes('bank'));

  const cashBalance = cashLedger ? cashLedger.CurrentBalance : 0;
  const bankBalance = bankLedger ? bankLedger.CurrentBalance : 0;

  // Day specific flows
  const todayCashDr = sortedDayBookTransactions
    .filter(tx => tx.LedgerId === (cashLedger?.LedgerId || 1) && tx.TransactionType === 'Dr')
    .reduce((sum, tx) => sum + tx.Amount, 0);
  const todayCashCr = sortedDayBookTransactions
    .filter(tx => tx.LedgerId === (cashLedger?.LedgerId || 1) && tx.TransactionType === 'Cr')
    .reduce((sum, tx) => sum + tx.Amount, 0);
  const todayCashNet = todayCashDr - todayCashCr;

  const todayBankDr = sortedDayBookTransactions
    .filter(tx => tx.LedgerId === (bankLedger?.LedgerId || 2) && tx.TransactionType === 'Dr')
    .reduce((sum, tx) => sum + tx.Amount, 0);
  const todayBankCr = sortedDayBookTransactions
    .filter(tx => tx.LedgerId === (bankLedger?.LedgerId || 2) && tx.TransactionType === 'Cr')
    .reduce((sum, tx) => sum + tx.Amount, 0);
  const todayBankNet = todayBankDr - todayBankCr;

  const uniqueVouchersCount = new Set(sortedDayBookTransactions.map(tx => tx.VoucherNo)).size;

  // Calculations for Trial Balance
  const totalDebits = ledgers
    .filter(l => l.BalanceType === 'Dr')
    .reduce((sum, l) => sum + l.CurrentBalance, 0);

  const totalCredits = ledgers
    .filter(l => l.BalanceType === 'Cr')
    .reduce((sum, l) => sum + l.CurrentBalance, 0);

  // Math checking of double-entry integrity
  // In a clean ledger, Sum(Dr) should equal Sum(Cr)
  const isDoubleEntryBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Filter ledgers
  const filteredLedgers = ledgers.filter(l => {
    const name = l.LedgerName.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = name.includes(search);

    const matchesGroup = ledgerGroupFilter === 'All' || l.GroupId === parseInt(ledgerGroupFilter);
    const matchesBalanceType = ledgerBalanceTypeFilter === 'All' || l.BalanceType === ledgerBalanceTypeFilter;

    return matchesSearch && matchesGroup && matchesBalanceType;
  });

  const filteredJournalTransactions = [...transactions].reverse().filter(tx => {
    const voucher = tx.VoucherNo.toLowerCase();
    const ledger = getLedgerName(tx.LedgerId).toLowerCase();
    const narration = (tx.Narration || '').toLowerCase();
    const search = journalSearchTerm.toLowerCase();
    const matchesSearch = voucher.includes(search) || ledger.includes(search) || narration.includes(search);

    const matchesVoucherType = journalVoucherTypeFilter === 'All' || tx.VoucherType === journalVoucherTypeFilter;
    const matchesTransactionType = journalTransactionTypeFilter === 'All' || tx.TransactionType === journalTransactionTypeFilter;

    return matchesSearch && matchesVoucherType && matchesTransactionType;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sub Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="btn" 
            style={{ 
              background: activeSubTab === 'daybook' ? 'var(--accent-purple)' : 'transparent',
              color: activeSubTab === 'daybook' ? '#ffffff' : 'var(--text-secondary)',
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
            onClick={() => setActiveSubTab('daybook')}
          >
            <CalendarDays size={16} /> Day Book
          </button>
          <button 
            className="btn" 
            style={{ 
              background: activeSubTab === 'ledgers' ? 'var(--accent-purple)' : 'transparent',
              color: activeSubTab === 'ledgers' ? '#ffffff' : 'var(--text-secondary)',
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
            onClick={() => setActiveSubTab('ledgers')}
          >
            <Book size={16} /> Chart of Accounts
          </button>
          <button 
            className="btn" 
            style={{ 
              background: activeSubTab === 'journal' ? 'var(--accent-purple)' : 'transparent',
              color: activeSubTab === 'journal' ? '#ffffff' : 'var(--text-secondary)',
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
            onClick={() => setActiveSubTab('journal')}
          >
            <Receipt size={16} /> Journal Vouchers
          </button>
          <button 
            className="btn" 
            style={{ 
              background: activeSubTab === 'trial' ? 'var(--accent-purple)' : 'transparent',
              color: activeSubTab === 'trial' ? '#ffffff' : 'var(--text-secondary)',
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
            onClick={() => setActiveSubTab('trial')}
          >
            <BarChart2 size={16} /> Trial Balance Report
          </button>
        </div>

        {/* Double-entry audit badge */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          fontSize: '0.8rem',
          background: isDoubleEntryBalanced ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          color: isDoubleEntryBalanced ? '#34d399' : '#f87171',
          padding: '6px 12px',
          borderRadius: '20px',
          border: isDoubleEntryBalanced ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <ShieldCheck size={16} />
          <span>Double-Entry Audit: <strong>{isDoubleEntryBalanced ? 'BALANCED' : 'DISCREPANCY DETECTED'}</strong></span>
        </div>
      </div>

      {/* 0. Day Book Report */}
      {activeSubTab === 'daybook' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Cash, Bank, and Day Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Cash in Hand Card */}
            <div className="glass-panel" style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, rgba(134, 59, 255, 0.05) 0%, rgba(134, 59, 255, 0.15) 100%)',
              border: '1px solid rgba(134, 59, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1, color: 'var(--accent-purple)' }}>
                <Wallet size={100} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                <Wallet size={18} style={{ color: 'var(--accent-purple)' }} />
                <span>Cash in Hand Balance</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                {currencySymbol}{cashBalance.toFixed(2)} <span style={{ fontSize: '0.9rem', color: 'var(--accent-purple)' }}>Dr</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: todayCashNet >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                {todayCashNet > 0 && `+${currencySymbol}${todayCashNet.toFixed(2)} Received today`}
                {todayCashNet < 0 && `-${currencySymbol}${Math.abs(todayCashNet).toFixed(2)} Paid today`}
                {todayCashNet === 0 && 'No cash activity today'}
              </div>
            </div>

            {/* Bank Balance Card */}
            <div className="glass-panel" style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(20, 184, 166, 0.15) 100%)',
              border: '1px solid rgba(20, 184, 166, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1, color: 'var(--accent-teal)' }}>
                <Landmark size={100} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                <Landmark size={18} style={{ color: 'var(--accent-teal)' }} />
                <span>Silicon Valley Bank Balance</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                {currencySymbol}{bankBalance.toFixed(2)} <span style={{ fontSize: '0.9rem', color: 'var(--accent-teal)' }}>Dr</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: todayBankNet >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                {todayBankNet > 0 && `+${currencySymbol}${todayBankNet.toFixed(2)} Deposited today`}
                {todayBankNet < 0 && `-${currencySymbol}${Math.abs(todayBankNet).toFixed(2)} Withdrawn today`}
                {todayBankNet === 0 && 'No bank activity today'}
              </div>
            </div>

            {/* Day Stats Card */}
            <div className="glass-panel" style={{ 
              padding: '20px', 
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
                <CalendarDays size={18} style={{ color: 'var(--text-muted)' }} />
                <span>Day Book Summary</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Vouchers Posted:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{uniqueVouchersCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Debit Volume:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol}{dayTotalDebits.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Credit Volume:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol}{dayTotalCredits.toFixed(2)}</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Date Selector & Navigation Bar */}
          <div className="glass-panel" style={{ 
            padding: '16px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                onClick={handlePrevDay}
              >
                <ArrowLeft size={14} /> Previous Day
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={handleToday}
              >
                Today
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                onClick={handleNextDay}
              >
                Next Day <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Select Book Date:</label>
              <input 
                type="date" 
                className="input-field" 
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: '160px' }}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Day Book Transactions Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Day Book Postings: <span style={{ color: 'var(--accent-teal)' }}>{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </h3>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '2 1 200px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search voucher, ledger, narration..." 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={dayBookSearchTerm}
                  onChange={e => setDayBookSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="input-field" 
                style={{ flex: '1 1 150px' }}
                value={dayBookVoucherTypeFilter}
                onChange={e => setDayBookVoucherTypeFilter(e.target.value)}
              >
                <option value="All">All Voucher Types</option>
                <option value="Payment">Payment</option>
                <option value="Receipt">Receipt</option>
                <option value="Journal">Journal</option>
              </select>
              <select 
                className="input-field" 
                style={{ flex: '1 1 150px' }}
                value={dayBookTransactionTypeFilter}
                onChange={e => setDayBookTransactionTypeFilter(e.target.value)}
              >
                <option value="All">All Dr/Cr Entries</option>
                <option value="Dr">Debit (Dr)</option>
                <option value="Cr">Credit (Cr)</option>
              </select>
            </div>

            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Voucher No</th>
                    <th>Voucher Type</th>
                    <th>Ledger Account</th>
                    <th>Debit (Dr)</th>
                    <th>Credit (Cr)</th>
                    <th>Narration</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDayBookTransactions.map(tx => (
                    <tr key={tx.TransactionId}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(tx.VoucherDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{tx.VoucherNo}</td>
                      <td>
                        <span className="badge badge-draft" style={{ fontSize: '0.65rem' }}>{tx.VoucherType}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{getLedgerName(tx.LedgerId)}</td>
                      <td style={{ fontWeight: 700, color: tx.TransactionType === 'Dr' ? 'var(--text-primary)' : 'transparent' }}>
                        {tx.TransactionType === 'Dr' ? `${currencySymbol}${tx.Amount.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ fontWeight: 700, color: tx.TransactionType === 'Cr' ? 'var(--accent-teal)' : 'transparent' }}>
                        {tx.TransactionType === 'Cr' ? `${currencySymbol}${tx.Amount.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.Narration}>
                        {tx.Narration || 'No narration.'}
                      </td>
                    </tr>
                  ))}
                  {sortedDayBookTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No transactions recorded on this day.
                      </td>
                    </tr>
                  )}
                </tbody>
                {sortedDayBookTransactions.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-color)', fontWeight: 700 }}>
                      <td colSpan={4} style={{ textAlign: 'right', padding: '12px 16px' }}>Total Day Book Volume:</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{currencySymbol}{dayTotalDebits.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--accent-teal)' }}>{currencySymbol}{dayTotalCredits.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {Math.abs(dayTotalDebits - dayTotalCredits) < 0.01 ? (
                          <span style={{ color: '#34d399', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> Balanced
                          </span>
                        ) : (
                          <span style={{ color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} title="Debit and Credit totals should balance">
                            <AlertTriangle size={14} /> Diff: {currencySymbol}{(dayTotalDebits - dayTotalCredits).toFixed(2)}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 1. Chart of Accounts Ledger */}
      {activeSubTab === 'ledgers' && (
        <div className="glass-panel fade-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>General Ledger Accounts</h3>
              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleCreateLedgerClick}
              >
                <Plus size={14} /> Add Ledger
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search ledger..." 
                  className="input-field" 
                  style={{ paddingLeft: '32px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.85rem' }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="input-field" 
                style={{ width: '180px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.85rem' }}
                value={ledgerGroupFilter}
                onChange={e => setLedgerGroupFilter(e.target.value)}
              >
                <option value="All">All Groups</option>
                {accountGroups.map(g => (
                  <option key={g.GroupId} value={g.GroupId}>{g.GroupName}</option>
                ))}
              </select>
              <select 
                className="input-field" 
                style={{ width: '120px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.85rem' }}
                value={ledgerBalanceTypeFilter}
                onChange={e => setLedgerBalanceTypeFilter(e.target.value)}
              >
                <option value="All">All Balances</option>
                <option value="Dr">Debit (Dr)</option>
                <option value="Cr">Credit (Cr)</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Ledger Name</th>
                  <th>Account Group</th>
                  <th>Opening Bal</th>
                  <th>Current Bal</th>
                  <th>Type</th>
                  <th>Reference Info</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedgers.map(l => {
                  const isGeneral = !l.ReferenceType || l.ReferenceType === 'General';
                  return (
                    <tr key={l.LedgerId}>
                      <td style={{ fontWeight: 600 }}>{l.LedgerName}</td>
                      <td>{getGroupName(l.GroupId)}</td>
                      <td>{currencySymbol}{l.OpeningBalance.toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{currencySymbol}{l.CurrentBalance.toFixed(2)}</td>
                      <td>
                        <span className={l.BalanceType === 'Dr' ? 'badge badge-scheduled' : 'badge badge-completed'} style={{ fontSize: '0.65rem' }}>
                          {l.BalanceType}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {l.ReferenceType ? `${l.ReferenceType} Bind (ID: #${l.ReferenceId})` : 'System General'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isGeneral ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleEditLedger(l)}
                            >
                              <Edit size={12} /> Edit
                            </button>
                            <button
                              className="btn"
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '0.75rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                              }}
                              onClick={() => handleDeleteLedgerClick(l)}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        ) : (
                          <span 
                            className="badge" 
                            style={{ 
                              fontSize: '0.65rem', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            <Lock size={10} /> Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Journal Vouchers Transactions */}
      {activeSubTab === 'journal' && (
        <div className="glass-panel fade-in" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Double-Entry Journal Postings</h3>
          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '2 1 200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search voucher, ledger, narration..." 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={journalSearchTerm}
                onChange={e => setJournalSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="input-field" 
              style={{ flex: '1 1 150px' }}
              value={journalVoucherTypeFilter}
              onChange={e => setJournalVoucherTypeFilter(e.target.value)}
            >
              <option value="All">All Voucher Types</option>
              <option value="Payment">Payment</option>
              <option value="Receipt">Receipt</option>
              <option value="Journal">Journal</option>
            </select>
            <select 
              className="input-field" 
              style={{ flex: '1 1 150px' }}
              value={journalTransactionTypeFilter}
              onChange={e => setJournalTransactionTypeFilter(e.target.value)}
            >
              <option value="All">All Dr/Cr Entries</option>
              <option value="Dr">Debit (Dr)</option>
              <option value="Cr">Credit (Cr)</option>
            </select>
          </div>

          <div className="table-container">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher No</th>
                  <th>Type</th>
                  <th>Ledger Account</th>
                  <th>Debit (Dr)</th>
                  <th>Credit (Cr)</th>
                  <th>Narration</th>
                </tr>
              </thead>
              <tbody>
                {filteredJournalTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No journal entries match filters.</td>
                  </tr>
                ) : (
                  filteredJournalTransactions.map(tx => (
                    <tr key={tx.TransactionId}>
                      <td>{new Date(tx.VoucherDate).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{tx.VoucherNo}</td>
                      <td>
                        <span className="badge badge-draft" style={{ fontSize: '0.65rem' }}>{tx.VoucherType}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{getLedgerName(tx.LedgerId)}</td>
                      <td style={{ fontWeight: 700, color: tx.TransactionType === 'Dr' ? 'var(--text-primary)' : 'transparent' }}>
                        {tx.TransactionType === 'Dr' ? `${currencySymbol}${tx.Amount.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ fontWeight: 700, color: tx.TransactionType === 'Cr' ? 'var(--accent-teal)' : 'transparent' }}>
                        {tx.TransactionType === 'Cr' ? `${currencySymbol}${tx.Amount.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tx.Narration || 'No narration.'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Trial Balance Report */}
      {activeSubTab === 'trial' && (
        <div className="glass-panel fade-in" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Trial Balance Sheet (June 2nd, 2026)</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
            A standard double-entry accounting trial balance verifying general ledger audit totals.
          </p>

          <div className="accounting-main-grid">
            
            {/* Debit Balances Column */}
            <div>
              <h4 style={{ fontSize: '1rem', borderBottom: '2px solid var(--accent-purple)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--accent-purple)' }}>
                Debit Ledger Balances (Dr)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ledgers.filter(l => l.BalanceType === 'Dr').map(l => (
                  <div key={l.LedgerId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span>{l.LedgerName}</span>
                    <span style={{ fontWeight: 600 }}>{currencySymbol}{l.CurrentBalance.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem', borderTop: '2px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                  <span>Total Debits:</span>
                  <span>{currencySymbol}{totalDebits.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Credit Balances Column */}
            <div>
              <h4 style={{ fontSize: '1rem', borderBottom: '2px solid var(--accent-teal)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--accent-teal)' }}>
                Credit Ledger Balances (Cr)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ledgers.filter(l => l.BalanceType === 'Cr').map(l => (
                  <div key={l.LedgerId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span>{l.LedgerName}</span>
                    <span style={{ fontWeight: 600 }}>{currencySymbol}{l.CurrentBalance.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem', borderTop: '2px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                  <span>Total Credits:</span>
                  <span>{currencySymbol}{totalCredits.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Audit Verification Footer */}
          <div style={{ 
            marginTop: '30px', 
            padding: '16px', 
            background: isDoubleEntryBalanced ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
            border: isDoubleEntryBalanced ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            {isDoubleEntryBalanced ? (
              <span style={{ color: '#34d399', fontWeight: 600 }}>
                ✓ General ledger audit completes successfully. Total Debits equals Total Credits ({currencySymbol}{totalDebits.toFixed(2)}).
              </span>
            ) : (
              <span style={{ color: '#f87171', fontWeight: 600 }}>
                ⚠ Audit Warning: Debits and Credits are out of balance by {currencySymbol}{(totalDebits - totalCredits).toFixed(2)}!
              </span>
            )}
          </div>

        </div>
      )}

      {/* Add / Edit Ledger Modal */}
      {isLedgerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
                {editLedgerId ? 'Modify Ledger Details' : 'Create New Account Ledger'}
              </h2>
              <button 
                onClick={() => {
                  setEditLedgerId(null);
                  setIsLedgerModalOpen(false);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {ledgerError && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.08)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                color: '#f87171', 
                padding: '10px 14px', 
                borderRadius: '6px', 
                fontSize: '0.85rem', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>{ledgerError}</span>
              </div>
            )}

            <form onSubmit={handleLedgerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-text">Ledger Account Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  placeholder="e.g. Office Rent Expense"
                  value={ledgerForm.LedgerName}
                  onChange={e => setLedgerForm(prev => ({ ...prev, LedgerName: e.target.value }))}
                />
              </div>

              <div>
                <label className="label-text">Account Group *</label>
                <select 
                  className="input-field" 
                  required
                  value={ledgerForm.GroupId || ''}
                  onChange={e => setLedgerForm(prev => ({ ...prev, GroupId: parseInt(e.target.value) || 0 }))}
                >
                  <option value="">Select Account Group...</option>
                  {accountGroups.map(g => (
                    <option key={g.GroupId} value={g.GroupId}>{g.GroupName}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Opening Balance *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    required
                    placeholder="e.g. 0.00"
                    value={ledgerForm.OpeningBalance}
                    onChange={e => setLedgerForm(prev => ({ ...prev, OpeningBalance: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="label-text">Balance Type *</label>
                  <select 
                    className="input-field" 
                    required
                    value={ledgerForm.BalanceType}
                    onChange={e => setLedgerForm(prev => ({ ...prev, BalanceType: e.target.value as 'Dr' | 'Cr' }))}
                  >
                    <option value="Dr">Debit (Dr)</option>
                    <option value="Cr">Credit (Cr)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setEditLedgerId(null);
                  setIsLedgerModalOpen(false);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editLedgerId ? 'Save Changes' : 'Create Ledger'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
