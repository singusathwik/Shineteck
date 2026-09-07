import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if available
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

/**
 * Trigger download of any Blob in the browser
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Trigger direct download of any URL
 */
export function downloadFromUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  if (filename) a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
  }, 200);
}

/**
 * Export Timesheet as a High-Resolution Corporate PDF Document
 */
export function exportTimesheetAsPdf(timesheet) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const empName = timesheet.employee_full_name || timesheet.employee_name || timesheet.full_name || timesheet.employee_id || 'Employee';
  const empId = timesheet.employee_id || 'N/A';
  const vendor = timesheet.vendor_name || 'Standard / Direct Placement';
  const startDate = timesheet.start_date || 'N/A';
  const endDate = timesheet.end_date || 'N/A';
  const totalHours = parseFloat(timesheet.total_hours) || 0;
  const regHours = Math.min(totalHours, 40).toFixed(1);
  const otHours = Math.max(0, totalHours - 40).toFixed(1);
  const status = timesheet.status || 'Pending';
  const notes = timesheet.notes || 'None recorded.';
  const feedback = timesheet.admin_feedback || 'No administrative notes recorded.';
  const submittedAt = timesheet.submitted_at ? new Date(timesheet.submitted_at).toLocaleDateString() : new Date().toLocaleDateString();

  // Primary Header Banner (Navy #0f2b48)
  doc.setFillColor(15, 43, 72);
  doc.rect(0, 0, 210, 38, 'F');

  // Accent gold / blue line
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 38, 210, 2.5, 'F');

  // Company Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SHINETECK INC.', 15, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(190, 210, 240);
  doc.text('Enterprise Workforce Management & Timesheet Verification Slip', 15, 23);
  doc.text(`Generated: ${new Date().toLocaleString()} | ID: #${timesheet.id || 'NEW'}`, 15, 30);

  // Status Badge on Top Right
  doc.setFillColor(status === 'Approved' ? 16 : status === 'Needs Correction' ? 217 : 37, status === 'Approved' ? 149 : status === 'Needs Correction' ? 119 : 99, status === 'Approved' ? 106 : status === 'Needs Correction' ? 6 : 235);
  doc.roundedRect(148, 10, 48, 16, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(status.toUpperCase(), 172, 20, { align: 'center' });

  // Section 1: Employee & Placement Details
  let y = 52;
  doc.setTextColor(15, 43, 72);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Employee & Placement Information', 15, y);

  doc.setDrawColor(220, 226, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y + 4, 180, 36, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('EMPLOYEE FULL NAME', 22, y + 13);
  doc.text('EMPLOYEE ID', 110, y + 13);
  doc.text('VENDOR / CLIENT PLACEMENT', 22, y + 27);
  doc.text('SUBMISSION DATE', 110, y + 27);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(String(empName), 22, y + 19);
  doc.text(String(empId), 110, y + 19);
  doc.text(String(vendor), 22, y + 33);
  doc.text(String(submittedAt), 110, y + 33);

  // Section 2: Work Period & Work Hours
  y = 100;
  doc.setTextColor(15, 43, 72);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Work Period & Hours Accounting', 15, y);

  doc.roundedRect(15, y + 4, 180, 46, 2, 2, 'FD');

  // 3 Metric Boxes inside
  // Box 1: Period
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, y + 9, 52, 34, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PERIOD DATES', 24, y + 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${startDate}`, 24, y + 24);
  doc.text(`to ${endDate}`, 24, y + 30);

  // Box 2: Regular & Overtime
  doc.roundedRect(77, y + 9, 54, 34, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('HOURS BREAKDOWN', 81, y + 16);
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Regular: ${regHours} hrs`, 81, y + 24);
  doc.setTextColor(otHours > 0 ? 217 : 100, otHours > 0 ? 119 : 116, otHours > 0 ? 6 : 139);
  doc.text(`Overtime: ${otHours} hrs`, 81, y + 31);

  // Box 3: Total Hours
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(136, y + 9, 54, 34, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(67, 56, 202);
  doc.text('TOTAL WORK HOURS', 140, y + 16);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text(`${totalHours} hrs`, 140, y + 28);

  // Section 3: Attached File Info & Notes
  y = 158;
  doc.setTextColor(15, 43, 72);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. File Attachment & Notes', 15, y);

  doc.setDrawColor(220, 226, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y + 4, 180, 52, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ATTACHED FILE:', 22, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(timesheet.file_name || 'Manual Timesheet Entry (No attachment uploaded)', 52, y + 13);

  doc.setTextColor(100, 116, 139);
  doc.text('EMPLOYEE NOTES:', 22, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const splitNotes = doc.splitTextToSize(notes, 160);
  doc.text(splitNotes, 22, y + 28);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ADMIN FEEDBACK / REVIEW:', 22, y + 38);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const splitFeedback = doc.splitTextToSize(feedback, 160);
  doc.text(splitFeedback, 22, y + 44);

  // Section 4: Corporate Certification & Seal
  y = 222;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, y, 180, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('CORPORATE AUDIT CERTIFICATION', 22, y + 8);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const certText = 'This digital slip is an authentic export record of Shineteck Inc. Enterprise Workforce & Payroll System. Hours and approvals are tracked with cryptographic audit logging compliant with US and Indian labor standards.';
  doc.text(doc.splitTextToSize(certText, 166), 22, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text(`Authorized by: ${timesheet.reviewed_by || 'Shineteck HR Admin Portal'}`, 22, y + 28);
  doc.text(`Status Verification: ${status.toUpperCase()} (${new Date().toLocaleDateString()})`, 110, y + 28);

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('© Shineteck Inc. Confidential Corporate Workforce Record', 105, 285, { align: 'center' });

  const safeFilename = `Timesheet_${empId}_${startDate}_${endDate}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
  doc.save(safeFilename);
}

/**
 * Export Timesheet as a PNG Image Card
 */
export function exportTimesheetAsImage(timesheet) {
  const empName = timesheet.employee_full_name || timesheet.employee_name || timesheet.full_name || timesheet.employee_id || 'Employee';
  const empId = timesheet.employee_id || 'N/A';
  const vendor = timesheet.vendor_name || 'Direct / Shineteck Inc.';
  const startDate = timesheet.start_date || 'N/A';
  const endDate = timesheet.end_date || 'N/A';
  const totalHours = parseFloat(timesheet.total_hours) || 0;
  const regHours = Math.min(totalHours, 40).toFixed(1);
  const otHours = Math.max(0, totalHours - 40).toFixed(1);
  const status = timesheet.status || 'Pending';

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 700);
  bgGrad.addColorStop(0, '#0f2b48');
  bgGrad.addColorStop(1, '#081726');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 700);

  // Inner card
  ctx.fillStyle = '#ffffff';
  ctx.roundRect(40, 40, 1120, 620, 24);
  ctx.fill();

  // Header Banner
  ctx.fillStyle = '#0f2b48';
  ctx.beginPath();
  ctx.roundRect(40, 40, 1120, 110, [24, 24, 0, 0]);
  ctx.fill();

  // Brand text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('SHINETECK INC.', 70, 95);

  ctx.fillStyle = '#93c5fd';
  ctx.font = '16px sans-serif';
  ctx.fillText('Official Timesheet & Work-Period Authorization Card', 70, 125);

  // Status Badge
  ctx.fillStyle = status === 'Approved' ? '#059669' : status === 'Needs Correction' ? '#d97706' : '#2563eb';
  ctx.beginPath();
  ctx.roundRect(940, 65, 180, 50, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(status.toUpperCase(), 1030, 97);
  ctx.textAlign = 'left';

  // Details Grid
  // Column 1
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('EMPLOYEE NAME', 70, 200);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(String(empName), 70, 235);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('EMPLOYEE ID', 70, 290);
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(String(empId), 70, 320);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('VENDOR / CLIENT', 70, 375);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(String(vendor), 70, 405);

  // Column 2
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('WORK PERIOD', 480, 200);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`${startDate} → ${endDate}`, 480, 235);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('REGULAR HOURS (40h Base)', 480, 290);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`${regHours} hrs`, 480, 320);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('OVERTIME HOURS', 480, 375);
  ctx.fillStyle = otHours > 0 ? '#d97706' : '#64748b';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`${otHours} hrs`, 480, 405);

  // Column 3 - Total Hours Hero Badge
  ctx.fillStyle = '#eff6ff';
  ctx.beginPath();
  ctx.roundRect(850, 180, 270, 240, 16);
  ctx.fill();
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TOTAL WORK HOURS', 985, 230);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(`${totalHours}`, 985, 320);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('HOURS LOGGED', 985, 365);
  ctx.textAlign = 'left';

  // Bottom Divider & Notes
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(70, 460, 1050, 130, 12);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`ATTACHED FILE: ${timesheet.file_name || 'Manual Log Entry'}`, 90, 495);
  ctx.font = '13px sans-serif';
  ctx.fillText(`Notes / Review: ${timesheet.admin_feedback || timesheet.notes || 'Timesheet record certified by Shineteck HR.'}`, 90, 525);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Digitally verified at ${new Date().toLocaleString()} | Reference Record #${timesheet.id || 'N/A'}`, 90, 560);

  // Convert canvas to blob & download
  canvas.toBlob((blob) => {
    if (blob) {
      const safeFilename = `Timesheet_${empId}_${startDate}_${endDate}.png`.replace(/[^a-zA-Z0-9._-]/g, '_');
      downloadBlob(blob, safeFilename);
    }
  }, 'image/png');
}

/**
 * Export Timesheet as CSV Spreadsheet
 */
export function exportTimesheetAsCSV(timesheet) {
  const empName = timesheet.employee_full_name || timesheet.employee_name || timesheet.full_name || timesheet.employee_id || 'Employee';
  const empId = timesheet.employee_id || 'N/A';
  const safeStr = (v) => `"${String(v !== undefined && v !== null ? v : '').replace(/"/g, '""')}"`;
  const totalH = parseFloat(timesheet.total_hours) || 0;
  const regH = Math.min(totalH, 40).toFixed(1);
  const otH = Math.max(0, totalH - 40).toFixed(1);

  const csvRows = [
    'Timesheet ID,Employee ID,Employee Name,Vendor / Client,Start Date,End Date,Regular Hours,Overtime Hours,Total Work Hours,Status,Submitted At,Admin Notes',
    [
      safeStr(timesheet.id),
      safeStr(empId),
      safeStr(empName),
      safeStr(timesheet.vendor_name || 'Direct / Shineteck Inc.'),
      safeStr(timesheet.start_date),
      safeStr(timesheet.end_date),
      safeStr(regH),
      safeStr(otH),
      safeStr(timesheet.total_hours),
      safeStr(timesheet.status),
      safeStr(timesheet.submitted_at || new Date().toISOString().slice(0, 10)),
      safeStr(timesheet.admin_feedback || timesheet.notes || '')
    ].join(',')
  ].join('\r\n');

  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
  const safeFilename = `Timesheet_${empId}_${timesheet.start_date}.csv`.replace(/[^a-zA-Z0-9._-]/g, '_');
  downloadBlob(blob, safeFilename);
}

/**
 * Universal Image to PDF Converter
 * Converts any Image URL / Blob into a high-res styled PDF document
 */
export async function convertImageToPdfAndDownload(imageUrl, originalFilename = 'document.jpg', meta = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const isLandscape = img.width > img.height;
        const pdf = new jsPDF({
          orientation: isLandscape ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Top Banner
        pdf.setFillColor(15, 43, 72);
        pdf.rect(0, 0, pageWidth, 22, 'F');
        pdf.setFillColor(37, 99, 235);
        pdf.rect(0, 22, pageWidth, 1.5, 'F');

        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('SHINETECK INC. COMPLIANCE VAULT', 12, 12);

        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(190, 210, 240);
        const subtitle = `${meta.docType ? meta.docType.toUpperCase() : 'DOCUMENT'} | Employee: ${meta.employeeId || 'Verified Record'} | Exported: ${new Date().toLocaleDateString()}`;
        pdf.text(subtitle, 12, 18);

        // Available area for the image
        const marginX = 12;
        const startY = 28;
        const availableW = pageWidth - marginX * 2;
        const availableH = pageHeight - startY - 14;

        // Calculate scaling
        const imgRatio = img.width / img.height;
        let renderW = availableW;
        let renderH = renderW / imgRatio;

        if (renderH > availableH) {
          renderH = availableH;
          renderW = renderH * imgRatio;
        }

        const renderX = marginX + (availableW - renderW) / 2;
        const renderY = startY + (availableH - renderH) / 2;

        pdf.addImage(img, 'JPEG', renderX, renderY, renderW, renderH, undefined, 'FAST');

        // Bottom footer
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text('Confidential Record — Shineteck Inc. Corporate Compliance Document', pageWidth / 2, pageHeight - 5, { align: 'center' });

        const baseName = originalFilename.replace(/\.[^/.]+$/, '');
        const pdfName = `${baseName}.pdf`;
        pdf.save(pdfName);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
}

/**
 * Universal PDF to Image Converter
 * Converts page 1 of any PDF to a high-res PNG image
 */
export async function convertPdfToImageAndDownload(pdfUrl, originalFilename = 'document.pdf') {
  try {
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      withCredentials: true
    });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const scale = 2.0; // High resolution
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    canvas.toBlob((blob) => {
      if (blob) {
        const baseName = originalFilename.replace(/\.[^/.]+$/, '');
        downloadBlob(blob, `${baseName}.png`);
      }
    }, 'image/png');
  } catch (err) {
    console.warn('[convertPdfToImage Warning, using fallback]', err);
    // Fallback: If PDF canvas rendering is blocked by CORS/Worker, download direct
    downloadFromUrl(pdfUrl, originalFilename);
  }
}
