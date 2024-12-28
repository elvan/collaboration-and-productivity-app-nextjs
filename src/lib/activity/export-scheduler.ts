import { prisma } from '@/lib/prisma';
import { exportActivities } from './activity-export';
import { sendEmail } from '@/lib/email';
import { format } from 'date-fns';

export interface ScheduledExport {
  id: string;
  userId: string;
  format: 'csv' | 'excel' | 'json' | 'pdf' | 'html';
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRun?: Date;
  nextRun: Date;
  emailTo: string[];
  filters?: {
    dateRange?: {
      from: Date;
      to: Date;
    };
    types?: string[];
  };
  status: 'active' | 'paused';
}

export async function scheduleExport(
  userId: string,
  options: Omit<ScheduledExport, 'id' | 'status' | 'lastRun' | 'nextRun'>
): Promise<ScheduledExport> {
  const nextRun = calculateNextRun(options.frequency);

  const scheduledExport = await prisma.scheduledExport.create({
    data: {
      userId,
      format: options.format,
      frequency: options.frequency,
      emailTo: options.emailTo,
      filters: options.filters,
      nextRun,
      status: 'active',
    },
  });

  return scheduledExport;
}

export async function updateScheduledExport(
  id: string,
  userId: string,
  updates: Partial<ScheduledExport>
): Promise<ScheduledExport> {
  const scheduledExport = await prisma.scheduledExport.findFirst({
    where: { id, userId },
  });

  if (!scheduledExport) {
    throw new Error('Scheduled export not found');
  }

  const updatedExport = await prisma.scheduledExport.update({
    where: { id },
    data: {
      ...updates,
      nextRun:
        updates.frequency || updates.status === 'active'
          ? calculateNextRun(updates.frequency || scheduledExport.frequency)
          : scheduledExport.nextRun,
    },
  });

  return updatedExport;
}

export async function deleteScheduledExport(
  id: string,
  userId: string
): Promise<void> {
  await prisma.scheduledExport.deleteMany({
    where: { id, userId },
  });
}

export async function processScheduledExports(): Promise<void> {
  const now = new Date();
  const dueExports = await prisma.scheduledExport.findMany({
    where: {
      status: 'active',
      nextRun: {
        lte: now,
      },
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  for (const scheduledExport of dueExports) {
    try {
      // Get activities based on filters
      const activities = await prisma.activity.findMany({
        where: {
          ...(scheduledExport.filters?.dateRange
            ? {
                createdAt: {
                  gte: scheduledExport.filters.dateRange.from,
                  lte: scheduledExport.filters.dateRange.to,
                },
              }
            : {}),
          ...(scheduledExport.filters?.types?.length
            ? {
                type: {
                  in: scheduledExport.filters.types,
                },
              }
            : {}),
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Generate export file
      const { data, filename, mimeType } = await exportActivities(activities, {
        format: scheduledExport.format,
        ...(scheduledExport.filters || {}),
      });

      // Send email with attachment
      for (const email of scheduledExport.emailTo) {
        await sendEmail({
          to: email,
          subject: `Scheduled Activity Export - ${format(now, 'PPP')}`,
          text: `Your scheduled activity export is attached. This export was generated on ${format(
            now,
            'PPP'
          )}.`,
          attachments: [
            {
              filename,
              content: data,
              contentType: mimeType,
            },
          ],
        });
      }

      // Update next run time
      await prisma.scheduledExport.update({
        where: { id: scheduledExport.id },
        data: {
          lastRun: now,
          nextRun: calculateNextRun(scheduledExport.frequency),
        },
      });
    } catch (error) {
      console.error(
        `Failed to process scheduled export ${scheduledExport.id}:`,
        error
      );
      // You might want to notify the user or retry later
    }
  }
}

function calculateNextRun(frequency: ScheduledExport['frequency']): Date {
  const now = new Date();
  const nextRun = new Date(now);

  switch (frequency) {
    case 'daily':
      // Run at midnight the next day
      nextRun.setDate(now.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
      break;

    case 'weekly':
      // Run at midnight next Monday
      nextRun.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
      nextRun.setHours(0, 0, 0, 0);
      break;

    case 'monthly':
      // Run at midnight on the 1st of next month
      nextRun.setMonth(now.getMonth() + 1, 1);
      nextRun.setHours(0, 0, 0, 0);
      break;
  }

  return nextRun;
}
