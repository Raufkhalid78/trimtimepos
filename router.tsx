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
const EmployeeDashboard = lazy(() => import('@/components/EmployeeDashboard'));
const PublicLayout = lazy(() => import('@/components/PublicLayout'));
const BookingPage = lazy(() => import('@/components/BookingPage'));
const ResetPassword = lazy(() => import('@/components/ResetPassword'));
const StaffLogin = lazy(() => import('@/components/StaffLogin'));
const PrivacyPolicy = lazy(() => import('@/components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/components/TermsOfService'));
const ShippingPolicy = lazy(() => import('@/components/ShippingPolicy'));
const PaymentSuccess = lazy(() => import('@/components/PaymentSuccess'));
const NotFound = lazy(() => import('@/components/NotFound'));

import LoadingSpinner from '@/components/LoadingSpinner';

const Loading = () => (
  <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 min-h-[300px]">
    <LoadingSpinner size="lg" color="amber" />
  </div>
);

// Wrapper components to inject context data into props-based components
import { useData } from './contexts/DataContext';
import { useAuth } from './contexts/AuthContext';

function DashboardWithData() {
  const { sales, expenses, products, staff, appointments, settings } = useData();
  const { currentUser, sessionLanguage } = useAuth();
  const navigate = useNavigate();
  
  if (currentUser?.role === 'employee') {
    return (
      <Suspense fallback={<Loading />}>
        <EmployeeDashboard 
          sales={sales} 
          appointments={appointments} 
          currentUser={currentUser} 
          currency={settings.currency} 
          language={sessionLanguage} 
          onViewChange={(v) => navigate(`/${v.toLowerCase()}`)} 
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <Dashboard 
        sales={sales} 
        expenses={expenses} 
        products={products} 
        staff={staff} 
        appointments={appointments}
        currentUser={currentUser!}
        currency={settings.currency} 
        language={sessionLanguage} 
        onViewChange={(v) => navigate(`/${v.toLowerCase()}`)} 
      />
    </Suspense>
  );
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
  const { currentUser, sessionLanguage, subscription } = useAuth();
  return <StaffManagement staffList={staff} onUpdateStaff={updateStaff} currentUser={currentUser} language={sessionLanguage} subscription={subscription} />;
}

function SettingsWithData() {
  const { settings, updateSettings, fetchData, deleteSales, sales, testNotification } = useData();
  const { currentUser, signOut, currentTenant, subscription, cancelSubscription, deleteStore } = useAuth();
  return <Settings 
    settings={settings} 
    onUpdateSettings={updateSettings} 
    currentUser={currentUser} 
    currentTenant={currentTenant}
    subscription={subscription}
    onCancelSubscription={cancelSubscription}
    onDeleteStore={deleteStore}
    onLogout={signOut} 
    onPurgeSales={() => deleteSales(sales.map(s => s.id))} 
    onRefreshStatus={fetchData} 
    onTestNotification={testNotification}
    dbStatus="connected" 
  />;
}

function AppointmentsWithData() {
  const { appointments, staff, services, customers, updateAppointments, updateAppointmentStatus, settings, staffAvailability, fetchData } = useData();
  const { sessionLanguage } = useAuth();
  return <Appointments 
    appointments={appointments} 
    staffList={staff} 
    services={services} 
    customers={customers} 
    onUpdateAppointments={updateAppointments} 
    onUpdateStatus={updateAppointmentStatus}
    language={sessionLanguage} 
    settings={settings} 
    staffAvailability={staffAvailability}
    onRefresh={fetchData} 
  />;
}

function RoleGuard({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function LoginRedirect() {
  const { setSaasView, currentUser } = useAuth();
  React.useEffect(() => {
    if (!currentUser) {
      setSaasView('login');
    }
  }, [setSaasView, currentUser]);
  return <Navigate to="/" replace />;
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
      { path: 'inventory', element: <Suspense fallback={<Loading />}><RoleGuard allowedRoles={['admin']}><InventoryWithData /></RoleGuard></Suspense> },
      { path: 'staff', element: <Suspense fallback={<Loading />}><RoleGuard allowedRoles={['admin']}><StaffWithData /></RoleGuard></Suspense> },
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
  },
  {
    path: '/login',
    element: <LoginRedirect />
  },
  {
    path: '/privacy',
    element: <Suspense fallback={<Loading />}><PrivacyPolicy /></Suspense>
  },
  {
    path: '/terms',
    element: <Suspense fallback={<Loading />}><TermsOfService /></Suspense>
  },
  {
    path: '/shipping',
    element: <Suspense fallback={<Loading />}><ShippingPolicy /></Suspense>
  },
  {
    path: '/payment-success',
    element: <Suspense fallback={<Loading />}><PaymentSuccess /></Suspense>
  },
  {
    path: '*',
    element: <Suspense fallback={<Loading />}><NotFound /></Suspense>
  }
]);
