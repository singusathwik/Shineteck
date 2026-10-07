import { InvitationForm } from './components/common/InvitationForm.jsx';
import { CompanyProvider, CompanySelector, useCompany } from './context/CompanyContext.jsx';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Header } from './components/common/Header.jsx';
import { Sidebar } from './components/common/Sidebar.jsx';
import { CommandPalette } from './components/common/CommandPalette.jsx';

const AdminExpenses = lazy(() => import('./pages/admin/AdminExpenses.jsx').then(module => ({ default: module.AdminExpenses })));
const AdminCompanies = lazy(() => import('./pages/admin/AdminCompanies.jsx').then(module => ({ default: module.AdminCompanies })));
const InvitationPage = lazy(() => import('./pages/InvitationPage.jsx').then(module => ({ default: module.InvitationPage })));
const AdminCompanyAccess = lazy(() => import('./pages/admin/AdminCompanyAccess.jsx').then(module => ({ default: module.AdminCompanyAccess })));

const LoginPage = lazy(() => import('./pages/LoginPage.jsx').then(module => ({ default: module.LoginPage })));
const RegisterWizard = lazy(() => import('./pages/RegisterWizard.jsx').then(module => ({ default: module.RegisterWizard })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx').then(module => ({ default: module.ForgotPasswordPage })));

// Employee Pages
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard.jsx').then(module => ({ default: module.EmployeeDashboard })));
const EmployeeProfile = lazy(() => import('./pages/employee/EmployeeProfile.jsx').then(module => ({ default: module.EmployeeProfile })));
const EmployeeTimesheets = lazy(() => import('./pages/employee/EmployeeTimesheets.jsx').then(module => ({ default: module.EmployeeTimesheets })));
const EmployeeDocuments = lazy(() => import('./pages/employee/EmployeeDocuments.jsx').then(module => ({ default: module.EmployeeDocuments })));
const EmployeeNotifications = lazy(() => import('./pages/employee/EmployeeNotifications.jsx').then(module => ({ default: module.EmployeeNotifications })));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx').then(module => ({ default: module.AdminDashboard })));
const AdminApprovals = lazy(() => import('./pages/admin/AdminApprovals.jsx').then(module => ({ default: module.AdminApprovals })));
const AdminEmployees = lazy(() => import('./pages/admin/AdminEmployees.jsx').then(module => ({ default: module.AdminEmployees })));
const AdminEmployeeDetail = lazy(() => import('./pages/admin/AdminEmployeeDetail.jsx').then(module => ({ default: module.AdminEmployeeDetail })));
const AdminTimesheets = lazy(() => import('./pages/admin/AdminTimesheets.jsx').then(module => ({ default: module.AdminTimesheets })));
const AdminPayroll = lazy(() => import('./pages/admin/AdminPayroll.jsx').then(module => ({ default: module.AdminPayroll })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx').then(module => ({ default: module.AdminSettings })));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs.jsx').then(module => ({ default: module.AdminAuditLogs })));
const AdminVendorDetails = lazy(() => import('./pages/admin/AdminVendorDetails.jsx').then(module => ({ default: module.AdminVendorDetails })));
const AdminPayrollEntries = lazy(() => import('./pages/admin/AdminPayrollEntries.jsx').then(module => ({ default: module.AdminPayrollEntries })));

function MainApp() {
  const companyWorkspace = useCompany();
  const { isSuperAdmin } = companyWorkspace;
  const { user, loading, isAuthenticated, isAdmin, isEmployee } = useAuth();

  // Public views: 'login' | 'register' | 'forgot-password'
  const [inviteToken, setInviteToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('invite'));
  const [publicView, setPublicView] = useState('login');
  const returnToLogin = () => { history.replaceState(null, '', window.location.pathname); setInviteToken(null); setPublicView('login'); };

  // Authenticated Tabs
  const { activeTab, setActiveTab } = companyWorkspace;
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
    if (inviteToken) return <InvitationPage token={inviteToken} onNavigateLogin={returnToLogin} />;
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
            {!(isAdmin && ['company-management', 'company-access', 'invite-admin'].includes(activeTab)) && <CompanySelector />}
            {/* Employee Views */}
            {isEmployee && (
              <>
                {activeTab === 'dashboard' && <EmployeeDashboard onNavigateTab={setActiveTab} />}
                {activeTab === 'profile' && <EmployeeProfile />}
                {activeTab === 'timesheet' && <EmployeeTimesheets />}
                {activeTab === 'documents' && <EmployeeDocuments />}

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

                {activeTab === 'us-expenses' && <AdminExpenses key="US" region="US" />}
                {activeTab === 'india-expenses' && <AdminExpenses key="India" region="India" />}
                {activeTab === 'timesheets' && <AdminTimesheets />}
                {activeTab === 'payroll' && <AdminPayroll />}
                {activeTab === 'vendors' && <AdminVendorDetails />}
                {activeTab === 'payroll-entries' && <AdminPayrollEntries />}
                {activeTab === 'invite-employee' && <InvitationForm />}
                {isSuperAdmin && activeTab === 'invite-admin' && <InvitationForm role="admin" />}
                {isSuperAdmin && activeTab === 'company-management' && <AdminCompanies />}
                {isSuperAdmin && activeTab === 'company-access' && <AdminCompanyAccess />}
                {isSuperAdmin && activeTab === 'settings' && <AdminSettings />}
                {isSuperAdmin && activeTab === 'audit' && <AdminAuditLogs />}
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
      <Suspense fallback={<div role="status" className="p-8 text-slate-600">Loading portal…</div>}><CompanyProvider><MainApp /></CompanyProvider></Suspense>
    </AuthProvider>
  );
}
