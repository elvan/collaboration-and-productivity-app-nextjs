import { Activity } from '@prisma/client';
import { Parser } from '@json2csv/plainjs';
import ExcelJS from 'exceljs';

type ExportFormat = 'csv' | 'excel' | 'json';

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
): Promise<{ data: string | Buffer; filename: string }> {
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
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

async function exportToCsv(
  activities: any[],
  timestamp: string
): Promise<{ data: string; filename: string }> {
  const parser = new Parser({
    fields: ['id', 'type', 'description', 'user', 'createdAt', 'details'],
  });

  const csv = parser.parse(activities);
  return {
    data: csv,
    filename: `activity-log-${timestamp}.csv`,
  };
}

async function exportToExcel(
  activities: any[],
  timestamp: string
): Promise<{ data: Buffer; filename: string }> {
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
  };
}

async function exportToJson(
  activities: any[],
  timestamp: string
): Promise<{ data: string; filename: string }> {
  return {
    data: JSON.stringify(activities, null, 2),
    filename: `activity-log-${timestamp}.json`,
  };
}
