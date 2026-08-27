import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Header } from './components/common/Header.jsx';
import { Sidebar } from './components/common/Sidebar.jsx';
import { CommandPalette } from './components/common/CommandPalette.jsx';

import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterWizard } from './pages/RegisterWizard.jsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard.jsx';
import { EmployeeProfile } from './pages/employee/EmployeeProfile.jsx';
import { EmployeeTimesheets } from './pages/employee/EmployeeTimesheets.jsx';
import { EmployeeDocuments } from './pages/employee/EmployeeDocuments.jsx';
import { EmployeePayroll } from './pages/employee/EmployeePayroll.jsx';
import { EmployeeNotifications } from './pages/employee/EmployeeNotifications.jsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminApprovals } from './pages/admin/AdminApprovals.jsx';
import { AdminEmployees } from './pages/admin/AdminEmployees.jsx';
import { AdminEmployeeDetail } from './pages/admin/AdminEmployeeDetail.jsx';
import { AdminTimesheets } from './pages/admin/AdminTimesheets.jsx';
import { AdminPayroll } from './pages/admin/AdminPayroll.jsx';
import { AdminSettings } from './pages/admin/AdminSettings.jsx';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs.jsx';
import { AdminVendorDetails } from './pages/admin/AdminVendorDetails.jsx';
import { AdminPayrollEntries } from './pages/admin/AdminPayrollEntries.jsx';

function MainApp() {
  const { user, loading, isAuthenticated, isAdmin, isEmployee } = useAuth();

  // Public views: 'login' | 'register' | 'forgot-password'
  const [publicView, setPublicView] = useState('login');

  // Authenticated Tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071524] flex flex-col items-center justify-center text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="w-12 h-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4 relative z-10"></div>
        <p className="text-xs font-bold tracking-widest uppercase text-slate-300 font-display relative z-10">
          Shineteck Inc. Portal
        </p>
      </div>
    );
  }

  // If user is not authenticated, show Login (or Register / Forgot Password)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
        {publicView === 'login' && (
          <LoginPage
            onNavigateRegister={() => setPublicView('register')}
            onNavigateForgotPassword={() => setPublicView('forgot-password')}
          />
        )}

        {publicView === 'register' && (
          <RegisterWizard
            onNavigateLogin={() => setPublicView('login')}
            onRegistrationComplete={() => {
              // Triggered upon successful registration
            }}
          />
        )}

        {publicView === 'forgot-password' && (
          <ForgotPasswordPage
            onNavigateLogin={() => setPublicView('login')}
          />
        )}
      </div>
    );
  }

  // If authenticated as Employee or Admin
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Main Corporate Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        activePortal={isAdmin ? 'admin' : 'employee'}
      />

      <div className="flex-1 flex w-full">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSelectedEmployeeId(null);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-100/70 custom-scrollbar">
          <div className="page-content mx-auto p-4 sm:p-6 lg:p-8">
            {/* Employee Views */}
            {isEmployee && (
              <>
                {activeTab === 'dashboard' && <EmployeeDashboard onNavigateTab={setActiveTab} />}
                {activeTab === 'profile' && <EmployeeProfile />}
                {activeTab === 'timesheet' && <EmployeeTimesheets />}
                {activeTab === 'documents' && <EmployeeDocuments />}
                {activeTab === 'payroll' && <EmployeePayroll />}
                {activeTab === 'notifications' && <EmployeeNotifications />}
              </>
            )}

            {/* Admin Views */}
            {isAdmin && (
              <>
                {activeTab === 'dashboard' && (
                  <AdminDashboard
                    onSelectEmployee={(empId) => {
                      setSelectedEmployeeId(empId);
                      setActiveTab('employees');
                    }}
                    onNavigateTab={setActiveTab}
                  />
                )}

                {activeTab === 'approvals' && (
                  selectedEmployeeId ? (
                    <AdminEmployeeDetail
                      employeeId={selectedEmployeeId}
                      onBack={() => setSelectedEmployeeId(null)}
                    />
                  ) : (
                    <AdminApprovals
                      onSelectEmployee={(empId) => {
                        setSelectedEmployeeId(empId);
                        setActiveTab('employees');
                      }}
                    />
                  )
                )}

                {activeTab === 'employees' && (
                  selectedEmployeeId ? (
                    <AdminEmployeeDetail
                      employeeId={selectedEmployeeId}
                      onBack={() => setSelectedEmployeeId(null)}
                    />
                  ) : (
                    <AdminEmployees
                      onSelectEmployee={(empId) => setSelectedEmployeeId(empId)}
                    />
                  )
                )}

                {activeTab === 'timesheets' && <AdminTimesheets />}
                {activeTab === 'payroll' && <AdminPayroll />}
                {activeTab === 'vendors' && <AdminVendorDetails />}
                {activeTab === 'payroll-entries' && <AdminPayrollEntries />}
                {activeTab === 'settings' && <AdminSettings />}
                {activeTab === 'audit' && <AdminAuditLogs />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setSelectedEmployeeId(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
