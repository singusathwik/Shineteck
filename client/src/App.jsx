import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Header } from './components/common/Header.jsx';
import { Sidebar } from './components/common/Sidebar.jsx';

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

  // Default view is login
  const [publicView, setPublicView] = useState('login');

  // Authenticated Tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wide">Loading Shineteck Inc. Portal...</p>
      </div>
    );
  }

  // If user is not authenticated, show Login (or Register / Forgot Password)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
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
              // Automatically triggers auth context update
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Main Corporate Header - full width */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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

        {/* Main Content Area - fills remaining width */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-100">
          <div className="page-content mx-auto p-5 sm:p-6 lg:p-8">
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
