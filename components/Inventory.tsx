
import React, { useState, useRef, useEffect } from 'react';
import { Service, Product, ShopSettings, Supplier, StockLog } from '../types';
import { TRANSLATIONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { format, parseISO } from 'date-fns';

interface InventoryProps {
  services: Service[];
  products: Product[];
  suppliers: Supplier[];
  stockLogs: StockLog[];
  settings: ShopSettings;
  onUpdateServices: (services: Service[]) => void;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  onAddStockLog: (log: StockLog) => void;
}

const Inventory: React.FC<InventoryProps> = ({ 
  services, products, suppliers, stockLogs, settings, 
  onUpdateServices, onUpdateProducts, onUpdateSuppliers, onAddStockLog 
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'products' | 'suppliers' | 'logs'>('services');
  const [isEditing, setIsEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{id: string, type: 'service' | 'product' | 'supplier'} | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const isScannerActiveRef = useRef(false);

  const t = TRANSLATIONS[settings.language];

  useEffect(() => {
    let isMounted = true;

    const cleanupScanner = async () => {
        if (!html5QrCodeRef.current) return;
        
        try {
            if (isScannerActiveRef.current) {
                await html5QrCodeRef.current.stop();
            }
        } catch (error) {
            console.warn("Scanner stop warning:", error);
        } finally {
            isScannerActiveRef.current = false;
            try {
                await html5QrCodeRef.current.clear();
            } catch (e) {
                // Ignore clear errors
            }
            html5QrCodeRef.current = null;
        }
    };
    
    if (isScanning) {
        const startScanner = async () => {
            // Give modal animation time to finish and DOM to render
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (!isMounted || !isScanning) return;
            
            const elementId = "reader-inventory";
            if (!document.getElementById(elementId)) return;

            // Ensure previous instance is cleaned up
            await cleanupScanner();

            try {
                const html5QrCode = new Html5Qrcode(elementId, {
                  formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E
                  ],
                  verbose: false
                });
                
                html5QrCodeRef.current = html5QrCode;
                
                await html5QrCode.start(
                    { facingMode: "environment" }, 
                    { 
                        fps: 10, 
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const width = Math.floor(viewfinderWidth * 0.85);
                            const height = Math.floor(viewfinderHeight * 0.35);
                            return { width, height };
                        },
                        aspectRatio: 1.777778,
                    }, 
                    (decodedText) => {
                        if (isMounted) {
                            if (barcodeInputRef.current) barcodeInputRef.current.value = decodedText;
                            if ("vibrate" in navigator) navigator.vibrate(100);
                            setIsScanning(false); // Clean exit
                        }
                    },
                    () => {}
                );
                
                // Mark as active immediately after start returns successfully
                isScannerActiveRef.current = true;

                if (!isMounted) {
                    // Component unmounted while starting
                    await cleanupScanner();
                }
            } catch (err: any) {
                 // Differentiate permission errors from others
                 const isPermissionError = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || err?.message?.includes('Permission');
                 
                 if (isPermissionError) {
                     console.warn("Camera permission denied");
                     if (isMounted) {
                         setIsScanning(false);
                         setShowErrorAlert("Camera access denied. Please enable camera permissions in your browser settings.");
                         setTimeout(() => setShowErrorAlert(null), 3000);
                     }
                 } else {
                     console.error("Inventory scanner failed to start", err);
                     if (isMounted) {
                         setIsScanning(false);
                         setShowErrorAlert("Unable to start scanner. Please enter barcode manually.");
                         setTimeout(() => setShowErrorAlert(null), 3000);
                     }
                 }
                 await cleanupScanner();
            }
        };
        startScanner();
    }

    return () => {
        isMounted = false;
        if (html5QrCodeRef.current) {
            // Trigger cleanup immediately on unmount
            const scanner = html5QrCodeRef.current;
            const wasActive = isScannerActiveRef.current;
            
            // If active, stop it. If not, just clear.
            if (wasActive) {
                scanner.stop().catch((e) => console.warn("Stop failed during unmount", e))
                .finally(() => {
                    try { scanner.clear(); } catch(e) {}
                    isScannerActiveRef.current = false;
                });
            } else {
                try { scanner.clear(); } catch(e) {}
            }
        }
    };
  }, [isScanning]);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.nameUr && s.nameUr.includes(searchTerm)) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.contactName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.phone?.includes(searchTerm))
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.nameUr && p.nameUr.includes(searchTerm)) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const filteredLogs = stockLogs.filter(l => {
    const product = products.find(p => p.id === l.productId);
    return (product?.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.reason.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  const items = activeTab === 'services' ? filteredServices : 
                activeTab === 'products' ? filteredProducts :
                activeTab === 'suppliers' ? filteredSuppliers :
                filteredLogs;

  const deleteItem = (id: string, type: 'service' | 'product' | 'supplier') => {
    setShowDeleteConfirm({ id, type });
  };

  const confirmDelete = () => {
    if (!showDeleteConfirm) return;
    const { id, type } = showDeleteConfirm;
    if (type === 'service') onUpdateServices(services.filter(s => s.id !== id));
    else if (type === 'product') onUpdateProducts(products.filter(p => p.id !== id));
    else if (type === 'supplier') onUpdateSuppliers(suppliers.filter(s => s.id !== id));
    setShowDeleteConfirm(null);
  };

  const saveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const itemData = Object.fromEntries(formData.entries());
    
    if (activeTab === 'services') {
      const newService: Service = {
        id: isEditing?.id || Math.random().toString(36).substr(2, 9).toUpperCase(),
        name: itemData.name as string,
        nameUr: itemData.nameUr as string,
        price: parseFloat(itemData.price as string) || 0,
        duration: parseInt(itemData.duration as string) || 30,
        category: itemData.category as string,
      };
      if (isEditing.id) onUpdateServices(services.map(s => s.id === isEditing.id ? newService : s));
      else onUpdateServices([...services, newService]);
    } else if (activeTab === 'products') {
      const newProduct: Product = {
        id: isEditing?.id || Math.random().toString(36).substr(2, 9).toUpperCase(),
        name: itemData.name as string,
        nameUr: itemData.nameUr as string,
        price: parseFloat(itemData.price as string) || 0,
        cost: parseFloat(itemData.cost as string) || 0,
        stock: parseInt(itemData.stock as string) || 0,
        barcode: (itemData.barcode as string) || undefined,
        lowStockThreshold: parseInt(itemData.lowStockThreshold as string) || 15
      };

      // If stock changed manually, log it
      if (isEditing.id && isEditing.stock !== newProduct.stock) {
          onAddStockLog({
              id: Math.random().toString(36).substr(2, 9).toUpperCase(),
              productId: newProduct.id,
              change: newProduct.stock - isEditing.stock,
              reason: 'adjustment',
              timestamp: new Date().toISOString(),
              userId: 'admin' // Should be current user
          });
      }

      if (isEditing.id) onUpdateProducts(products.map(p => p.id === isEditing.id ? newProduct : p));
      else onUpdateProducts([...products, newProduct]);
    } else if (activeTab === 'suppliers') {
        const newSupplier: Supplier = {
            id: isEditing?.id || Math.random().toString(36).substr(2, 9).toUpperCase(),
            name: itemData.name as string,
            contactName: itemData.contactName as string,
            phone: itemData.phone as string,
            email: itemData.email as string,
            address: itemData.address as string
        };
        if (isEditing.id) onUpdateSuppliers(suppliers.map(s => s.id === isEditing.id ? newSupplier : s));
        else onUpdateSuppliers([...suppliers, newSupplier]);
    } else if (activeTab === 'logs') {
        const newLog: StockLog = {
            id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            productId: itemData.productId as string,
            change: parseInt(itemData.change as string) || 0,
            reason: itemData.reason as any,
            timestamp: new Date().toISOString(),
            userId: 'admin',
            notes: itemData.notes as string
        };
        onAddStockLog(newLog);
        
        // Update product stock
        const product = products.find(p => p.id === newLog.productId);
        if (product) {
            onUpdateProducts(products.map(p => 
                p.id === product.id ? { ...p, stock: Math.max(0, p.stock + newLog.change) } : p
            ));
        }
    }
    setIsEditing(null);
  };

  const getItemName = (item: any) => {
      if (settings.language === 'ur' && item.nameUr) return item.nameUr;
      return item.name;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white font-brand">{t.shopCatalog}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.updatePrices}</p>
        </div>
        <button onClick={() => setIsEditing({})} className="bg-slate-950 dark:bg-slate-800 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg text-sm w-full sm:w-auto justify-center active:scale-95">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          {activeTab === 'services' ? t.newService : 
           activeTab === 'products' ? t.newProduct : 
           activeTab === 'suppliers' ? t.newSupplier : t.addStockLog}
        </button>
      </div>
      
      <div className="relative">
        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input type="text" placeholder={t.searchCatalog} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="tt-input py-3.5 pl-12 pr-6" />
      </div>
      
      <div className="flex bg-[var(--tt-surface)] p-1 rounded-xl shadow-sm border border-[var(--tt-border)] self-start w-full sm:w-auto overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('services')} className={`flex-1 sm:px-8 py-2.5 rounded-lg font-bold transition-all text-[10px] md:text-sm whitespace-nowrap ${activeTab === 'services' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}>{t.services}</button>
        <button onClick={() => setActiveTab('products')} className={`flex-1 sm:px-8 py-2.5 rounded-lg font-bold transition-all text-[10px] md:text-sm whitespace-nowrap ${activeTab === 'products' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}>{t.inventory}</button>
        <button onClick={() => setActiveTab('suppliers')} className={`flex-1 sm:px-8 py-2.5 rounded-lg font-bold transition-all text-[10px] md:text-sm whitespace-nowrap ${activeTab === 'suppliers' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}>{t.suppliers}</button>
        <button onClick={() => setActiveTab('logs')} className={`flex-1 sm:px-8 py-2.5 rounded-lg font-bold transition-all text-[10px] md:text-sm whitespace-nowrap ${activeTab === 'logs' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}>{t.stockLogs}</button>
      </div>
      
      {/* Mobile & Desktop Combined View using flexible cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'logs' ? (
            stockLogs.map((log) => {
                const product = products.find(p => p.id === log.productId);
                return (
                    <div key={log.id} className="tt-card p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{product?.name || 'Unknown Product'}</h4>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{log.reason}</p>
                            </div>
                            <span className={`text-sm font-black ${log.change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {log.change > 0 ? '+' : ''}{log.change}
                            </span>
                        </div>
                        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400">
                            <span>{format(parseISO(log.timestamp), 'MMM dd, HH:mm')}</span>
                            <span>{log.userId}</span>
                        </div>
                    </div>
                );
            })
        ) : activeTab === 'suppliers' ? (
            filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="tt-card p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base leading-tight">{supplier.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">{supplier.contactName}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(supplier)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button onClick={() => deleteItem(supplier.id, 'supplier')} className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 space-y-1">
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                            {supplier.phone}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 012-2V7a2 2 0 01-2-2H5a2 2 0 01-2 2v10a2 2 0 012 2z"/></svg>
                            {supplier.email}
                        </p>
                    </div>
                </div>
            ))
        ) : (
            items.map((item: any) => (
           <div key={item.id} className="tt-card p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                 <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base leading-tight">{getItemName(item)}</h4>
                    {settings.language === 'en' && item.nameUr && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 text-right md:text-left">{item.nameUr}</p>}
                    {settings.language === 'ur' && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 text-left">{item.name}</p>}
                 </div>
                 <span className="text-lg font-black text-amber-500 whitespace-nowrap ml-2">{settings.currency}{item.price}</span>
              </div>
              
              <div className="flex justify-between items-end mt-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {activeTab === 'services' ? item.category : `${item.stock} ${t.unitsLeft}`}
                  </div>
                  
                  <div className="flex gap-2">
                      <button onClick={() => setIsEditing(item)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={() => deleteItem(item.id, activeTab === 'services' ? 'service' : 'product')} className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                  </div>
              </div>
           </div>
        )))}
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold">{t.noRecords}</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{t.noMatchingEntries}</p>
        </div>
      )}

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="tt-card w-full max-w-md p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{isEditing.id ? t.editEntry : t.newEntry}</h3><button onClick={() => setIsEditing(null)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg></button></div>
              <form onSubmit={saveItem} className="space-y-5">
                {activeTab === 'suppliers' ? (
                  <>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.supplierName}</label>
                        <input name="name" type="text" defaultValue={isEditing.name || ''} required className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.contactPerson}</label>
                        <input name="contactName" type="text" defaultValue={isEditing.contactName || ''} required className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.phone}</label>
                            <input name="phone" type="text" defaultValue={isEditing.phone || ''} required className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.email}</label>
                            <input name="email" type="email" defaultValue={isEditing.email || ''} className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.address}</label>
                        <textarea name="address" defaultValue={isEditing.address || ''} className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" rows={2} />
                    </div>
                  </>
                ) : activeTab === 'logs' ? (
                  <>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Product</label>
                        <select name="productId" required className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200">
                           <option value="">Select a product...</option>
                           {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Change</label>
                            <input name="change" type="number" placeholder="+5 or -2" required className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Reason</label>
                            <select name="reason" required className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200">
                                <option value="restock">{t.restock}</option>
                                <option value="adjustment">{t.adjustment}</option>
                                <option value="damage">{t.damage}</option>
                                <option value="return">{t.return}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">Notes (Optional)</label>
                        <input name="notes" type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.name}</label>
                        <input name="name" type="text" defaultValue={isEditing.name || ''} required className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.nameUr}</label>
                        <input
                          name="nameUr"
                          type="text"
                          defaultValue={isEditing.nameUr || ''}
                          className={`w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200 ${
                            settings.language === 'ur' ? 'font-urdu text-right' :
                            settings.language === 'ar' ? 'text-right' : ''
                          }`}
                          placeholder={(t as any).nameUrPlaceholder || 'Local language name'}
                          dir={settings.language === 'ur' || settings.language === 'ar' ? 'rtl' : 'ltr'}
                        />
                    </div>
                    
                    {activeTab === 'products' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.barcode}</label>
                        <div className="flex gap-2">
                            <input ref={barcodeInputRef} name="barcode" type="text" defaultValue={isEditing.barcode || ''} className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                            <button type="button" onClick={() => setIsScanning(true)} className="bg-slate-900 text-white p-3.5 rounded-2xl hover:bg-slate-800 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                            </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.price}</label>
                        <input name="price" type="number" step="0.01" defaultValue={isEditing.price || ''} required className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                      </div>
                      {activeTab === 'products' ? (
                          <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.cost}</label>
                            <input name="cost" type="number" step="0.01" defaultValue={isEditing.cost || ''} className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                          </div>
                      ) : (
                          <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.mins}</label>
                            <input name="duration" type="number" defaultValue={isEditing.duration || 30} className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                          </div>
                      )}
                    </div>

                    {activeTab === 'products' ? (
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.stock}</label>
                            <input name="stock" type="number" defaultValue={isEditing.stock || 0} className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.alertQty}</label>
                            <input name="lowStockThreshold" type="number" defaultValue={isEditing.lowStockThreshold || 15} className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                          </div>
                      </div>
                    ) : (
                       <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 ml-1">{t.category}</label>
                        <input name="category" type="text" defaultValue={isEditing.category || ''} required className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm font-bold dark:text-slate-200" />
                       </div>
                    )}
                  </>
                )}
                
                <button type="submit" className="w-full py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-base shadow-xl mt-4 active:scale-95 transition-transform">{t.saveChanges}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="w-full max-w-md tt-card overflow-hidden shadow-2xl relative">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center"><h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">{t.scanBarcode}</h3><button onClick={() => setIsScanning(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div>
                <div className="bg-black relative min-h-[300px] w-full overflow-hidden">
                    <div id="reader-inventory" className="w-full h-full"></div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showErrorAlert && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 z-[300]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          {showErrorAlert}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="tt-card shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.confirmDeletion}</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">{t.permanentlyDeleteEntry}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
