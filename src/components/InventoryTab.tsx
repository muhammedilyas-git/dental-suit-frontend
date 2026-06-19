import React, { useState } from 'react';
import type { Item, ItemCategory, Unit, InventoryTransaction, User } from '../types';
import { Package, Plus, AlertTriangle, Edit, Search } from 'lucide-react';

interface InventoryTabProps {
  items: Item[];
  categories: ItemCategory[];
  units: Unit[];
  addStockTransaction: (
    transaction: Omit<InventoryTransaction, 'TransactionId' | 'TransactionDate' | 'UserId' | 'QuantityBefore' | 'QuantityAfter'>
  ) => void;
  addItem: (item: Omit<Item, 'ItemId'>) => void;
  updateItem: (itemId: number, item: Item) => void;
  currentUser: User;
  currencySymbol?: string;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  items,
  categories,
  units,
  addStockTransaction,
  addItem,
  updateItem,
  currentUser,
  currencySymbol = '$'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'products'>('stock');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [stockExpiryFilter, setStockExpiryFilter] = useState('All');

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStatusFilter, setProductStatusFilter] = useState('All');

  // Modal controls
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Form states
  const [txForm, setTxForm] = useState({
    ItemId: '',
    TransactionType: 'StockIn' as 'StockIn' | 'StockOut' | 'Adjustment',
    QuantityChange: 10,
    Remarks: ''
  });

  const [productForm, setProductForm] = useState({
    ItemId: null as number | null, // set for edit mode
    ItemName: '',
    CategoryId: '',
    UnitId: '',
    BatchNumber: '',
    ExpiryDate: '',
    PurchaseRate: 0.00,
    SellingRate: 0.00,
    ReorderLevel: 5,
    CurrentStock: 0,
    IsActive: true
  });

  // Helpers
  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.CategoryId === catId);
    return cat ? cat.CategoryName : `Category #${catId}`;
  };

  const getUnitName = (unitId: number) => {
    const u = units.find(un => un.UnitId === unitId);
    return u ? u.UnitName : `Unit #${unitId}`;
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.ItemId || !txForm.QuantityChange) {
      alert('Item and Quantity change are required.');
      return;
    }

    const item = items.find(i => i.ItemId === parseInt(txForm.ItemId));
    if (!item) return;

    const change = Number(txForm.QuantityChange);
    const multiplier = (txForm.TransactionType === 'StockOut') ? -1 : 1;
    const finalChange = change * multiplier;

    if (item.CurrentStock + finalChange < 0) {
      alert(`Warning: Insufficient stock. Cannot deduct ${change} from current stock of ${item.CurrentStock}.`);
      return;
    }

    addStockTransaction({
      ItemId: parseInt(txForm.ItemId),
      TransactionType: txForm.TransactionType as any,
      QuantityChange: finalChange,
      Remarks: txForm.Remarks
    });

    setTxForm({
      ItemId: '',
      TransactionType: 'StockIn',
      QuantityChange: 10,
      Remarks: ''
    });
    setIsTxModalOpen(false);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.ItemName || !productForm.CategoryId || !productForm.UnitId) {
      alert('Product Name, Category, and Unit are required.');
      return;
    }

    const payload = {
      ItemName: productForm.ItemName,
      CategoryId: parseInt(productForm.CategoryId),
      UnitId: parseInt(productForm.UnitId),
      BatchNumber: productForm.BatchNumber || undefined,
      ExpiryDate: productForm.ExpiryDate ? productForm.ExpiryDate : undefined,
      PurchaseRate: Number(productForm.PurchaseRate) || 0,
      SellingRate: Number(productForm.SellingRate) || 0,
      ReorderLevel: Number(productForm.ReorderLevel) || 0,
      CurrentStock: Number(productForm.CurrentStock) || 0,
      IsActive: productForm.IsActive
    };

    if (productForm.ItemId) {
      // Edit mode
      updateItem(productForm.ItemId, { ...payload, ItemId: productForm.ItemId });
    } else {
      // Add mode
      addItem(payload);
    }

    // Reset Form
    setProductForm({
      ItemId: null,
      ItemName: '',
      CategoryId: '',
      UnitId: '',
      BatchNumber: '',
      ExpiryDate: '',
      PurchaseRate: 0.00,
      SellingRate: 0.00,
      ReorderLevel: 5,
      CurrentStock: 0,
      IsActive: true
    });
    setIsProductModalOpen(false);
  };

  // Helper to check near expiry (e.g. within 90 days for mock data)
  const isNearExpiry = (dateStr?: string) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90; // Expiring in 90 days
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sub Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="sub-tabs-container">
          <button 
            className="btn" 
            style={{ 
              background: activeSubTab === 'stock' ? 'var(--accent-purple-glow)' : 'transparent',
              color: activeSubTab === 'stock' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderLeft: activeSubTab === 'stock' ? '3px solid var(--accent-purple)' : '3px solid transparent',
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
            onClick={() => setActiveSubTab('stock')}
          >
            <Package size={16} /> Stock Inventory
          </button>
          <button 
            className="btn" 
            style={{ 
              background: activeSubTab === 'products' ? 'var(--accent-purple-glow)' : 'transparent',
              color: activeSubTab === 'products' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderLeft: activeSubTab === 'products' ? '3px solid var(--accent-purple)' : '3px solid transparent',
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
            onClick={() => setActiveSubTab('products')}
          >
            <Edit size={16} /> Product Catalog
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {activeSubTab === 'products' && (
            <button className="btn btn-teal" onClick={() => {
              setProductForm({
                ItemId: null,
                ItemName: '',
                CategoryId: categories[0]?.CategoryId.toString() || '',
                UnitId: units[0]?.UnitId.toString() || '',
                BatchNumber: '',
                ExpiryDate: '',
                PurchaseRate: 0.00,
                SellingRate: 0.00,
                ReorderLevel: 5,
                CurrentStock: 0,
                IsActive: true
              });
              setIsProductModalOpen(true);
            }}>
              <Plus size={16} /> Add Product
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setIsTxModalOpen(true)}>
            <Plus size={16} /> Manual Adjustment
          </button>
        </div>
      </div>

      {/* 1. Sub-Tab: Stock Inventory */}
      {activeSubTab === 'stock' && (() => {
        // Filtered items for Stock Tab
        const filteredStockItems = items.filter(item => {
          const name = item.ItemName.toLowerCase();
          const batch = (item.BatchNumber || '').toLowerCase();
          const search = stockSearchTerm.toLowerCase();
          const matchesSearch = name.includes(search) || batch.includes(search) || item.ItemId.toString().includes(search);

          const matchesCategory = stockCategoryFilter === 'All' || item.CategoryId === parseInt(stockCategoryFilter);

          let matchesStock = true;
          if (stockStatusFilter === 'LowStock') {
            matchesStock = item.CurrentStock <= item.ReorderLevel;
          } else if (stockStatusFilter === 'OutOfStock') {
            matchesStock = item.CurrentStock === 0;
          } else if (stockStatusFilter === 'InStock') {
            matchesStock = item.CurrentStock > 0;
          }

          let matchesExpiry = true;
          if (stockExpiryFilter !== 'All') {
            const isNear = isNearExpiry(item.ExpiryDate);
            const isExpired = item.ExpiryDate ? new Date(item.ExpiryDate).getTime() < new Date().getTime() : false;
            if (stockExpiryFilter === 'ExpiringSoon') {
              matchesExpiry = isNear && !isExpired;
            } else if (stockExpiryFilter === 'Expired') {
              matchesExpiry = isExpired;
            } else if (stockExpiryFilter === 'Good') {
              matchesExpiry = !isNear && !isExpired;
            }
          }

          return matchesSearch && matchesCategory && matchesStock && matchesExpiry;
        });

        return (
          <div className="glass-panel fade-in" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Material & Medicine Stock List</h3>
              <span style={{ fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.08)', color: '#f87171', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} /> Low stock items: {items.filter(i => i.CurrentStock <= i.ReorderLevel).length}
              </span>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '2 1 200px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search item name, batch or ID..." 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={stockSearchTerm}
                  onChange={e => setStockSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="input-field" 
                style={{ flex: '1 1 120px' }}
                value={stockCategoryFilter}
                onChange={e => setStockCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.CategoryId} value={c.CategoryId}>{c.CategoryName}</option>
                ))}
              </select>
              <select 
                className="input-field" 
                style={{ flex: '1 1 120px' }}
                value={stockStatusFilter}
                onChange={e => setStockStatusFilter(e.target.value)}
              >
                <option value="All">All Stock Levels</option>
                <option value="LowStock">Low Stock</option>
                <option value="OutOfStock">Out of Stock</option>
                <option value="InStock">In Stock</option>
              </select>
              <select 
                className="input-field" 
                style={{ flex: '1 1 120px' }}
                value={stockExpiryFilter}
                onChange={e => setStockExpiryFilter(e.target.value)}
              >
                <option value="All">All Expiries</option>
                <option value="ExpiringSoon">Expiring Soon</option>
                <option value="Expired">Expired</option>
                <option value="Good">Good Expiry</option>
              </select>
            </div>

            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Batch / Expiry</th>
                    <th>Current Stock</th>
                    <th>Rates (Cost/Sell)</th>
                    <th>Reorder limit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No stock items match filters.</td>
                    </tr>
                  ) : (
                    filteredStockItems.map(item => {
                      const isLow = item.CurrentStock <= item.ReorderLevel;
                      const isNear = isNearExpiry(item.ExpiryDate);
                      return (
                        <tr key={item.ItemId}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.ItemName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: #{item.ItemId}</div>
                          </td>
                          <td>{getCategoryName(item.CategoryId)}</td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>Batch: {item.BatchNumber || 'N/A'}</div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: isNear ? '#f87171' : 'var(--text-secondary)',
                              fontWeight: isNear ? 600 : 400
                            }}>
                              Exp: {item.ExpiryDate ? new Date(item.ExpiryDate).toLocaleDateString() : 'N/A'} {isNear && '(Expiring Soon)'}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: isLow ? '#fbbf24' : 'var(--text-primary)' }}>
                            {item.CurrentStock} {getUnitName(item.UnitId)}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>Buy: {currencySymbol}{item.PurchaseRate.toFixed(2)}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--accent-teal)' }}>Sell: {currencySymbol}{item.SellingRate.toFixed(2)}</div>
                          </td>
                          <td>{item.ReorderLevel} {getUnitName(item.UnitId)}</td>
                          <td>
                            {isLow ? (
                              <span className="badge badge-waiting" style={{ fontSize: '0.65rem' }}>Reorder Now</span>
                            ) : (
                              <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>Good Stock</span>
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

      {/* 2. Sub-Tab: Product Catalog (Manage Items) */}
      {activeSubTab === 'products' && (() => {
        // Filtered items for Product Catalog Tab
        const filteredProductCatalog = items.filter(item => {
          const name = item.ItemName.toLowerCase();
          const search = productSearchTerm.toLowerCase();
          const matchesSearch = name.includes(search) || item.ItemId.toString().includes(search);

          const matchesCategory = productCategoryFilter === 'All' || item.CategoryId === parseInt(productCategoryFilter);

          let matchesStatus = true;
          if (productStatusFilter === 'Active') {
            matchesStatus = item.IsActive;
          } else if (productStatusFilter === 'Inactive') {
            matchesStatus = !item.IsActive;
          }

          return matchesSearch && matchesCategory && matchesStatus;
        });

        return (
          <div className="glass-panel fade-in" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Product & Material Catalog</h3>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '2 1 200px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search product name or ID..." 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={productSearchTerm}
                  onChange={e => setProductSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="input-field" 
                style={{ flex: '1 1 120px' }}
                value={productCategoryFilter}
                onChange={e => setProductCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.CategoryId} value={c.CategoryId}>{c.CategoryName}</option>
                ))}
              </select>
              <select 
                className="input-field" 
                style={{ flex: '1 1 120px' }}
                value={productStatusFilter}
                onChange={e => setProductStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            
            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Category</th>
                    <th>Packaging Unit</th>
                    <th>Default Purchase Cost</th>
                    <th>Default Selling Rate</th>
                    <th>Reorder Threshold</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No products match filters.</td>
                    </tr>
                  ) : (
                    filteredProductCatalog.map(item => (
                      <tr key={item.ItemId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.ItemName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: #{item.ItemId}</div>
                        </td>
                        <td>{getCategoryName(item.CategoryId)}</td>
                        <td>{getUnitName(item.UnitId)}</td>
                        <td>{currencySymbol}{item.PurchaseRate.toFixed(2)}</td>
                        <td style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>{currencySymbol}{item.SellingRate.toFixed(2)}</td>
                        <td>{item.ReorderLevel}</td>
                        <td>
                          <span className={`badge ${item.IsActive ? 'badge-completed' : 'badge-cancelled'}`}>
                            {item.IsActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {currentUser.RoleId === 1 ? (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setProductForm({
                                  ItemId: item.ItemId,
                                  ItemName: item.ItemName,
                                  CategoryId: item.CategoryId.toString(),
                                  UnitId: item.UnitId.toString(),
                                  BatchNumber: item.BatchNumber || '',
                                  ExpiryDate: item.ExpiryDate ? item.ExpiryDate.substring(0, 10) : '',
                                  PurchaseRate: item.PurchaseRate,
                                  SellingRate: item.SellingRate,
                                  ReorderLevel: item.ReorderLevel,
                                  CurrentStock: item.CurrentStock,
                                  IsActive: item.IsActive
                                });
                                setIsProductModalOpen(true);
                              }}
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
        );
      })()}

      {/* Manual Adjustment Modal */}
      {isTxModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Log Inventory Movement / Adjustment</h2>
              <button 
                onClick={() => setIsTxModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleTxSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-text">Select Inventory Item *</label>
                <select 
                  className="input-field" 
                  required 
                  value={txForm.ItemId}
                  onChange={e => setTxForm(prev => ({ ...prev, ItemId: e.target.value }))}
                >
                  <option value="">-- Choose Material/Medicine --</option>
                  {items.filter(i => i.IsActive).map(i => (
                    <option key={i.ItemId} value={i.ItemId}>{i.ItemName} (Current Stock: {i.CurrentStock})</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Transaction Type *</label>
                  <select 
                    className="input-field" 
                    required 
                    value={txForm.TransactionType}
                    onChange={e => setTxForm(prev => ({ ...prev, TransactionType: e.target.value as any }))}
                  >
                    <option value="StockIn">Stock In (Manual Adjustment Increase)</option>
                    <option value="StockOut">Stock Out (Wastage / Usage)</option>
                    <option value="Adjustment">Adjustment (Stocktake Correction)</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Quantity *</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="input-field" 
                    required 
                    value={txForm.QuantityChange}
                    onChange={e => setTxForm(prev => ({ ...prev, QuantityChange: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Movement Reason / Narration</label>
                <textarea 
                  className="input-field" 
                  style={{ height: '60px', resize: 'none' }}
                  placeholder="e.g. stocktake discrepancy adjustment..."
                  value={txForm.Remarks}
                  onChange={e => setTxForm(prev => ({ ...prev, Remarks: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTxModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Inventory Movement</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>{productForm.ItemId ? 'Modify Product Specifications' : 'Add New Product to Catalog'}</h2>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-text">Product/Material Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  placeholder="e.g. Paracetamol 500mg tablets"
                  value={productForm.ItemName}
                  onChange={e => setProductForm(prev => ({ ...prev, ItemName: e.target.value }))}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Category *</label>
                  <select 
                    className="input-field" 
                    required 
                    value={productForm.CategoryId}
                    onChange={e => setProductForm(prev => ({ ...prev, CategoryId: e.target.value }))}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(c => (
                      <option key={c.CategoryId} value={c.CategoryId}>{c.CategoryName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Packaging Unit *</label>
                  <select 
                    className="input-field" 
                    required 
                    value={productForm.UnitId}
                    onChange={e => setProductForm(prev => ({ ...prev, UnitId: e.target.value }))}
                  >
                    <option value="">-- Select Unit --</option>
                    {units.map(u => (
                      <option key={u.UnitId} value={u.UnitId}>{u.UnitName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Default Purchase Cost ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    value={productForm.PurchaseRate}
                    onChange={e => setProductForm(prev => ({ ...prev, PurchaseRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="label-text">Default Selling Price ({currencySymbol})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    value={productForm.SellingRate}
                    onChange={e => setProductForm(prev => ({ ...prev, SellingRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Reorder Threshold Level</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={productForm.ReorderLevel}
                    onChange={e => setProductForm(prev => ({ ...prev, ReorderLevel: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="label-text">Initial Stock Level (Optional)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    disabled={productForm.ItemId !== null} // Disabled in edit mode
                    value={productForm.CurrentStock}
                    onChange={e => setProductForm(prev => ({ ...prev, CurrentStock: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label-text">Default Batch Number</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={productForm.BatchNumber}
                    onChange={e => setProductForm(prev => ({ ...prev, BatchNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-text">Default Expiry Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={productForm.ExpiryDate}
                    onChange={e => setProductForm(prev => ({ ...prev, ExpiryDate: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="isActiveCheck"
                  checked={productForm.IsActive}
                  onChange={e => setProductForm(prev => ({ ...prev, IsActive: e.target.checked }))}
                />
                <label htmlFor="isActiveCheck" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Item is Active (Visible in dropdowns)</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
