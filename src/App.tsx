import React, { useState } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { UsersManagement } from './components/UsersManagement';
import { ServicesManagement } from './components/ServicesManagement';
import { Dashboard } from './components/Dashboard';

type Page = 'dashboard' | 'users' | 'services';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

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

  return (
    <AdminLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </AdminLayout>
  );
}
