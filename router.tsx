import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import App from './App';

// Lazy-load heavy views
const Dashboard = lazy(() => import('@/components/Dashboard'));
const POS = lazy(() => import('@/components/POS'));
const Finance = lazy(() => import('@/components/Finance'));
const Customers = lazy(() => import('@/components/Customers'));
const Inventory = lazy(() => import('@/components/Inventory'));
const StaffManagement = lazy(() => import('@/components/StaffManagement'));
const Settings = lazy(() => import('@/components/Settings'));
const Appointments = lazy(() => import('@/components/Appointments'));
const PublicLayout = lazy(() => import('@/components/PublicLayout'));
const BookingPage = lazy(() => import('@/components/BookingPage'));
const ResetPassword = lazy(() => import('@/components/ResetPassword'));
const StaffLogin = lazy(() => import('@/components/StaffLogin'));

const Loading = () => (
  <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-amber-500"></div>
  </div>
);

// Wrapper components to inject context data into props-based components
import { useData } from './contexts/DataContext';
import { useAuth } from './contexts/AuthContext';

function DashboardWithData() {
  const { sales, expenses, products, staff, settings } = useData();
  const { sessionLanguage } = useAuth();
  const navigate = useNavigate();
  return <Dashboard sales={sales} expenses={expenses} products={products} staff={staff} currency={settings.currency} language={sessionLanguage} onViewChange={(v) => navigate(`/${v.toLowerCase()}`)} />;
}

function POSWithData() {
  const { services, products, staff, customers, sales, settings, completeSale, updateCustomers } = useData();
  const { currentUser } = useAuth();
  return <POS services={services} products={products} staff={staff} customers={customers} sales={sales} settings={settings} currentUser={currentUser} onCompleteSale={completeSale} onAddCustomer={c => updateCustomers([...customers, c])} dbStatus="connected" />;
}

function FinanceWithData() {
  const { sales, expenses, staff, customers, advancePayments, settings, addExpense, deleteExpense, addAdvance, deleteAdvance, deleteSales } = useData();
  const { currentUser, sessionLanguage } = useAuth();
  return <Finance sales={sales} expenses={expenses} staffList={staff} customers={customers} advancePayments={advancePayments} currency={settings.currency} language={sessionLanguage} currentUser={currentUser} onAddExpense={addExpense} onDeleteExpense={deleteExpense} onAddAdvance={addAdvance} onDeleteAdvance={deleteAdvance} onDeleteSales={deleteSales} settings={settings} />;
}

function CustomersWithData() {
  const { customers, sales, updateCustomers, settings } = useData();
  const { sessionLanguage } = useAuth();
  return <Customers customers={customers} sales={sales} onUpdateCustomers={updateCustomers} currency={settings.currency} language={sessionLanguage} settings={settings} />;
}

function InventoryWithData() {
  const { services, products, suppliers, stockLogs, settings, updateServices, updateProducts, updateSuppliers, addStockLog } = useData();
  return <Inventory services={services} products={products} suppliers={suppliers} stockLogs={stockLogs} settings={settings} onUpdateServices={updateServices} onUpdateProducts={updateProducts} onUpdateSuppliers={updateSuppliers} onAddStockLog={addStockLog} />;
}

function StaffWithData() {
  const { staff, updateStaff } = useData();
  const { currentUser, sessionLanguage } = useAuth();
  return <StaffManagement staffList={staff} onUpdateStaff={updateStaff} currentUser={currentUser} language={sessionLanguage} />;
}

function SettingsWithData() {
  const { settings, updateSettings, fetchData, deleteSales, sales } = useData();
  const { currentUser, signOut } = useAuth();
  return <Settings 
    settings={settings} 
    onUpdateSettings={updateSettings} 
    currentUser={currentUser} 
    onLogout={signOut} 
    onPurgeSales={() => deleteSales(sales.map(s => s.id))} 
    onRefreshStatus={fetchData} 
    dbStatus="connected" 
  />;
}

function AppointmentsWithData() {
  const { appointments, staff, services, customers, updateAppointments, settings } = useData();
  const { sessionLanguage } = useAuth();
  return <Appointments appointments={appointments} staffList={staff} services={services} customers={customers} onUpdateAppointments={updateAppointments} language={sessionLanguage} settings={settings} />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={<Loading />}><DashboardWithData /></Suspense> },
      { path: 'pos', element: <Suspense fallback={<Loading />}><POSWithData /></Suspense> },
      { path: 'finance', element: <Suspense fallback={<Loading />}><FinanceWithData /></Suspense> },
      { path: 'customers', element: <Suspense fallback={<Loading />}><CustomersWithData /></Suspense> },
      { path: 'inventory', element: <Suspense fallback={<Loading />}><InventoryWithData /></Suspense> },
      { path: 'staff', element: <Suspense fallback={<Loading />}><StaffWithData /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<Loading />}><SettingsWithData /></Suspense> },
      { path: 'appointments', element: <Suspense fallback={<Loading />}><AppointmentsWithData /></Suspense> },
      { path: 'app/*', element: <Navigate to="/dashboard" replace /> } // Backwards compatibility for the /app prefix
    ]
  },
  {
    path: '/book/:slug',
    element: <Suspense fallback={<Loading />}><PublicLayout /></Suspense>,
    children: [
      { index: true, element: <BookingPage /> }
    ]
  },
  {
    path: '/reset-password',
    element: <Suspense fallback={<Loading />}><ResetPassword /></Suspense>
  },
  {
    path: '/staff-login/:slug',
    element: <Suspense fallback={<Loading />}><StaffLogin /></Suspense>
  }
]);
