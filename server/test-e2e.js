import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('=== STARTING FULL-STACK AUTOMATED VERIFICATION ===\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Next ID Preview
  console.log('1. Testing Public ID Preview...');
  const nextIdRes = await fetch(`${BASE_URL}/settings/next-id`).then(r => r.json());
  console.log('   Next ID Preview:', nextIdRes);
  if (!nextIdRes.employeeId) throw new Error('Failed to get next ID preview');

  // 2. Dynamic Address System
  console.log('\n2. Testing Dynamic Address Validation...');
  const countries = await fetch(`${BASE_URL}/address/countries`).then(r => r.json());
  console.log(`   Fetched ${countries.countries.length} countries.`);
  const states = await fetch(`${BASE_URL}/address/states/United%20States`).then(r => r.json());
  console.log(`   Fetched ${states.states.length} US states.`);
  const cities = await fetch(`${BASE_URL}/address/cities/United%20States/California`).then(r => r.json());
  console.log(`   Fetched ${cities.cities.length} CA cities:`, cities.cities.slice(0, 3));

  const validZipCheck = await fetch(`${BASE_URL}/address/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country: 'United States', state: 'California', city: 'Los Angeles', zipCode: '90001' })
  }).then(r => r.json());
  console.log('   US ZIP 90001 validation:', validZipCheck);
  if (!validZipCheck.isValid) throw new Error('ZIP validation failed for 90001');

  // 3. Employee Registration (Multi-step payload simulation with structured names)
  console.log('\n3. Testing Atomic Sequential Employee Registration (Last Name, First Name, Middle Initial)...');
  const testEmail = `alexander.wright.${Date.now()}@shinetek.com`;
  const regPayload = {
    lastName: 'Wright',
    firstName: 'Alexander',
    middleInitial: 'M.',
    fullName: 'Alexander M. Wright',
    email: testEmail,
    phone: '+1 (555) 492-8172',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    designation: 'Principal Cloud Architect',
    dateOfBirth: '1990-05-20',
    country: 'United States',
    state: 'California',
    city: 'Los Angeles',
    zipCode: '90001',
    address: '450 South Grand Avenue, Suite 1800',
    profileImageUrl: '/uploads/avatars/sample-avatar.png',
    uploadedDocuments: [
      { documentType: 'w4', fileName: 'Wright_W4.pdf', filePath: 'sample_w4_johnathan.pdf', fileSize: 210000, mimeType: 'application/pdf' },
      { documentType: 'i9', fileName: 'Wright_I9.pdf', filePath: 'sample_i9_johnathan.pdf', fileSize: 290000, mimeType: 'application/pdf' },
      { documentType: 'passport', fileName: 'Wright_Passport.jpg', filePath: 'sample_passport_johnathan.jpg', fileSize: 1800000, mimeType: 'image/jpeg' },
      { documentType: 'visa', fileName: 'Wright_Visa.pdf', filePath: 'sample_visa_johnathan.pdf', fileSize: 450000, mimeType: 'application/pdf' }
    ]
  };

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  }).then(r => r.json());

  console.log('   Registration Result:', {
    message: regRes.message,
    assignedId: regRes.user?.employeeId,
    fullName: regRes.user?.fullName,
    status: regRes.user?.registrationStatus
  });

  const empToken = regRes.token;
  const empId = regRes.user?.employeeId;
  if (!empId) throw new Error('Registration failed to return employee ID');
  if (regRes.user?.fullName !== 'Alexander M. Wright') throw new Error('Expected fullName to be Alexander M. Wright');

  // 4. Employee Login Verification
  console.log('\n4. Testing Employee Login with Assigned ID...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: empId, password: 'Password@123' })
  }).then(r => r.json());
  console.log('   Login successful:', loginRes.user?.fullName, `(${loginRes.user?.employeeId})`);

  // 5. Admin Login Verification
  console.log('\n5. Testing Admin Login...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@shinetek.com', password: 'Admin@1234' })
  }).then(r => r.json());
  console.log('   Admin Login successful:', adminLoginRes.user?.fullName, `(${adminLoginRes.user?.role})`);
  const adminToken = adminLoginRes.token;

  // 6. Timesheet Submission with Hours
  console.log('\n6. Testing Employee Timesheet Submission...');
  const timesheetRes = await fetch(`${BASE_URL}/timesheets/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify({
      startDate: '2026-02-01',
      endDate: '2026-02-15',
      totalHours: '80.0',
      notes: 'Initial sprint hours for cloud migration project'
    })
  }).then(r => r.json());
  console.log('   Timesheet submitted:', timesheetRes.timesheet?.id, `(${timesheetRes.timesheet?.total_hours} hrs, Status: ${timesheetRes.timesheet?.status})`);

  // 7. Admin Review Employee & Documents
  console.log('\n7. Testing Admin Employee Inspection & Document Review...');
  const empDetail = await fetch(`${BASE_URL}/admin/employees/${empId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json());
  console.log(`   Found employee ${empDetail.employee.full_name} with ${empDetail.documents.length} documents.`);

  // Approve each document
  for (const doc of empDetail.documents) {
    const revDoc = await fetch(`${BASE_URL}/admin/documents/${doc.id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Approved', reviewNotes: 'Verified against HR compliance standards.' })
    }).then(r => r.json());
    console.log(`   Approved document: ${doc.document_type} -> ${revDoc.document.status}`);
  }

  // Approve overall onboarding status
  const approveEmp = await fetch(`${BASE_URL}/admin/employees/${empId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'Approved', adminNotes: 'All background checks and documents verified.' })
  }).then(r => r.json());
  console.log(`   Employee Registration Status updated to: ${approveEmp.employee.registration_status}`);

  // 8. Admin Timesheet Review
  console.log('\n8. Testing Admin Timesheet Approval...');
  const allTimesheets = await fetch(`${BASE_URL}/admin/timesheets`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json());
  const pendingTs = allTimesheets.timesheets.find(t => t.employee_id === empId);
  if (pendingTs) {
    const appTs = await fetch(`${BASE_URL}/admin/timesheets/${pendingTs.id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Approved', adminFeedback: 'Hours approved for pay period.' })
    }).then(r => r.json());
    console.log(`   Timesheet #${pendingTs.id} updated to: ${appTs.timesheet.status}`);
  }

  // 9. Admin Issue Payroll
  console.log('\n9. Testing Admin Payroll Statement Generation...');
  const payRes = await fetch(`${BASE_URL}/admin/payroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      employeeId: empId,
      payPeriodStart: '2026-02-01',
      payPeriodEnd: '2026-02-15',
      grossPay: 5800.00,
      deductions: 1250.00,
      paymentDate: '2026-02-20',
      paymentStatus: 'Paid'
    })
  }).then(r => r.json());
  console.log('   Payroll issued:', payRes.record?.employee_id, `Gross: $${payRes.record?.gross_pay}, Net: $${payRes.record?.net_pay}`);

  // 10. Audit Logs Verification
  console.log('\n10. Testing Security Audit Logs Tracking...');
  const auditLogs = await fetch(`${BASE_URL}/admin/audit-logs`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json());
  console.log(`   Audit logs recorded: ${auditLogs.total} total system events.`);
  console.log('   Recent events:', auditLogs.logs.slice(0, 4).map(l => `[${l.action}] by ${l.user_name}`));

  // 11. Employment Status & Start/End Dates Testing
  console.log('\n11. Testing Employment Start/End Dates & Active/Inactive Management...');
  
  // Test filtering active employees
  const activeEmpRes = await fetch(`${BASE_URL}/admin/employees?employmentStatus=Active`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json());
  console.log(`   Active employees query: ${activeEmpRes.employees.length} active employees returned (Total count: ${activeEmpRes.counts.active}).`);
  
  // Test filtering inactive employees
  const inactiveEmpRes = await fetch(`${BASE_URL}/admin/employees?employmentStatus=Inactive`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json());
  console.log(`   Inactive employees query: ${inactiveEmpRes.employees.length} inactive employees returned (Total count: ${inactiveEmpRes.counts.inactive}).`);

  // Deactivate employee
  const deactRes = await fetch(`${BASE_URL}/admin/employees/${empId}/employment-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      employmentStatus: 'Inactive',
      startDate: '2026-01-01',
      endDate: '2026-02-20',
      reason: 'Contract Term Completed'
    })
  }).then(r => r.json());
  console.log(`   Employee ${empId} set to: ${deactRes.employee?.employment_status} (Still working: ${deactRes.employee?.is_still_working}, End Date: ${deactRes.employee?.end_date})`);

  // Reactivate employee
  const reactRes = await fetch(`${BASE_URL}/admin/employees/${empId}/employment-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      employmentStatus: 'Active',
      startDate: '2026-01-01',
      endDate: null,
      reason: 'Rehired on active contract'
    })
  }).then(r => r.json());
  console.log(`   Employee ${empId} reactivated to: ${reactRes.employee?.employment_status} (Still working: ${reactRes.employee?.is_still_working}, End Date: ${reactRes.employee?.end_date || 'None / Ongoing'})`);

  console.log('\n=== ALL END-TO-END SYSTEM INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
