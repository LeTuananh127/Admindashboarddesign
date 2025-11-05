import React, { useState, useEffect } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { UsersManagement } from './components/UsersManagement';
import { ServicesManagement } from './components/ServicesManagement';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/LoginPage';
import { toast } from 'sonner';

type Page = 'dashboard' | 'users' | 'services';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  useEffect(() => {
    // Check if user is already logged in
    const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    setIsAuthenticated(loggedIn);
  }, []);

  const handleLogin = () => {
    localStorage.setItem('adminLoggedIn', 'true');
    setIsAuthenticated(true);
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
        return <Dashboard />;
      case 'users':
        return <UsersManagement />;
      case 'services':
        return <ServicesManagement />;
      default:
        return <Dashboard />;
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
