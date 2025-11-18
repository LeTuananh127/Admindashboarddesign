import React, { useState, useEffect } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { UsersManagement } from './components/UsersManagement';
import { ServicesManagement } from './components/ServicesManagement';
import { Reports } from './components/Reports';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/LoginPage';
import { toast } from 'sonner';

type Page = 'dashboard' | 'users' | 'services' | 'reports';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check if user is already logged in - verify both flag and token
    const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    const hasToken = !!localStorage.getItem('access_token');
    const isAuthenticated = loggedIn && hasToken;
    setIsAuthenticated(isAuthenticated);
    
    console.log('[App] Initial auth check:', { loggedIn, hasToken, isAuthenticated });
  }, []);

  const handleLogin = () => {
    // Double-check token exists before setting authenticated
    const token = localStorage.getItem('access_token');
    if (token) {
      localStorage.setItem('adminLoggedIn', 'true');
      setIsAuthenticated(true);
      // Trigger data refresh for all components
      setDataRefreshTrigger(prev => prev + 1);
      console.log('[App] handleLogin called, token verified, isAuthenticated set to true');
    } else {
      console.error('[App] handleLogin called but no token found!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
    toast.success('Đã đăng xuất thành công');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={`dashboard-${dataRefreshTrigger}`} dataRefreshTrigger={dataRefreshTrigger} />;
      case 'users':
        return <UsersManagement key={`users-${dataRefreshTrigger}`} dataRefreshTrigger={dataRefreshTrigger} />;
      case 'services':
        return <ServicesManagement key={`services-${dataRefreshTrigger}`} dataRefreshTrigger={dataRefreshTrigger} />;
      case 'reports':
        return <Reports key={`reports-${dataRefreshTrigger}`} />;
      default:
        return <Dashboard key={`dashboard-${dataRefreshTrigger}`} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AdminLayout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AdminLayout>
  );
}
