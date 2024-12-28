import { Activity } from '@prisma/client';
import { Parser } from '@json2csv/plainjs';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { Readable } from 'stream';

type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf' | 'html';

interface ActivityExportOptions {
  format: ExportFormat;
  dateRange?: {
    from: Date;
    to: Date;
  };
  types?: string[];
  userId?: string;
}

export async function exportActivities(
  activities: Activity[],
  options: ActivityExportOptions
): Promise<{ data: string | Buffer; filename: string; mimeType: string }> {
  // Filter activities based on options
  let filteredActivities = activities;

  if (options.dateRange) {
    filteredActivities = filteredActivities.filter(
      (activity) =>
        new Date(activity.createdAt) >= options.dateRange!.from &&
        new Date(activity.createdAt) <= options.dateRange!.to
    );
  }

  if (options.types?.length) {
    filteredActivities = filteredActivities.filter((activity) =>
      options.types!.includes(activity.type)
    );
  }

  if (options.userId) {
    filteredActivities = filteredActivities.filter(
      (activity) => activity.userId === options.userId
    );
  }

  // Format activities for export
  const formattedActivities = filteredActivities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    description: activity.metadata?.description || '',
    user: activity.metadata?.userName || activity.userId,
    createdAt: new Date(activity.createdAt).toISOString(),
    details: JSON.stringify(activity.metadata || {}),
  }));

  const timestamp = new Date().toISOString().split('T')[0];

  switch (options.format) {
    case 'csv':
      return exportToCsv(formattedActivities, timestamp);
    case 'excel':
      return exportToExcel(formattedActivities, timestamp);
    case 'json':
      return exportToJson(formattedActivities, timestamp);
    case 'pdf':
      return exportToPdf(formattedActivities, timestamp);
    case 'html':
      return exportToHtml(formattedActivities, timestamp);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

async function exportToCsv(
  activities: any[],
  timestamp: string
): Promise<{ data: string; filename: string; mimeType: string }> {
  const parser = new Parser({
    fields: ['id', 'type', 'description', 'user', 'createdAt', 'details'],
  });

  const csv = parser.parse(activities);
  return {
    data: csv,
    filename: `activity-log-${timestamp}.csv`,
    mimeType: 'text/csv',
  };
}

async function exportToExcel(
  activities: any[],
  timestamp: string
): Promise<{ data: Buffer; filename: string; mimeType: string }> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Activity Log');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'User', key: 'user', width: 20 },
    { header: 'Created At', key: 'createdAt', width: 20 },
    { header: 'Details', key: 'details', width: 40 },
  ];

  // Add rows
  worksheet.addRows(activities);

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Auto-filter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 6 },
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return {
    data: buffer,
    filename: `activity-log-${timestamp}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

async function exportToJson(
  activities: any[],
  timestamp: string
): Promise<{ data: string; filename: string; mimeType: string }> {
  return {
    data: JSON.stringify(activities, null, 2),
    filename: `activity-log-${timestamp}.json`,
    mimeType: 'application/json',
  };
}

async function exportToPdf(
  activities: any[],
  timestamp: string
): Promise<{ data: Buffer; filename: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument();

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve({
        data: buffer,
        filename: `activity-log-${timestamp}.pdf`,
        mimeType: 'application/pdf',
      });
    });
    doc.on('error', reject);

    // Add title
    doc.fontSize(20).text('Activity Log', { align: 'center' });
    doc.moveDown();

    // Add timestamp
    doc.fontSize(12).text(`Generated on: ${format(new Date(), 'PPP')}`, { align: 'right' });
    doc.moveDown();

    // Add table headers
    const headers = ['Type', 'Description', 'User', 'Created At'];
    const startX = 50;
    let startY = doc.y;
    const rowHeight = 30;
    const colWidth = (doc.page.width - 100) / headers.length;

    // Draw headers
    headers.forEach((header, i) => {
      doc.fontSize(10)
         .rect(startX + (i * colWidth), startY, colWidth, rowHeight)
         .stroke()
         .text(header, startX + (i * colWidth) + 5, startY + 10);
    });

    // Draw rows
    startY += rowHeight;
    activities.forEach((activity) => {
      if (startY > doc.page.height - 100) {
        doc.addPage();
        startY = 50;
      }

      [
        activity.type,
        activity.description,
        activity.user,
        format(new Date(activity.createdAt), 'PPp'),
      ].forEach((text, i) => {
        doc.fontSize(8)
           .rect(startX + (i * colWidth), startY, colWidth, rowHeight)
           .stroke()
           .text(text, startX + (i * colWidth) + 5, startY + 5, {
             width: colWidth - 10,
             height: rowHeight - 10,
           });
      });

      startY += rowHeight;
    });

    doc.end();
  });
}

async function exportToHtml(
  activities: any[],
  timestamp: string
): Promise<{ data: string; filename: string; mimeType: string }> {
  const styles = `
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; }
      h1 { color: #333; text-align: center; }
      .timestamp { text-align: right; color: #666; margin-bottom: 2rem; }
      table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
      th, td { padding: 0.75rem; border: 1px solid #ddd; }
      th { background: #f5f5f5; }
      tr:nth-child(even) { background: #fafafa; }
      tr:hover { background: #f0f0f0; }
    </style>
  `;

  const rows = activities.map((activity) => `
    <tr>
      <td>${activity.type}</td>
      <td>${activity.description}</td>
      <td>${activity.user}</td>
      <td>${format(new Date(activity.createdAt), 'PPp')}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Activity Log</title>
        ${styles}
      </head>
      <body>
        <h1>Activity Log</h1>
        <div class="timestamp">Generated on: ${format(new Date(), 'PPP')}</div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>User</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  return {
    data: html,
    filename: `activity-log-${timestamp}.html`,
    mimeType: 'text/html',
  };
}
