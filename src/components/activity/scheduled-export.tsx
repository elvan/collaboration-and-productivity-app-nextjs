import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, Plus, Trash } from 'lucide-react';
import type { ScheduledExport } from '@/lib/activity/export-scheduler';

interface ScheduledExportProps {
  exports: ScheduledExport[];
  onSchedule: (schedule: Omit<ScheduledExport, 'id' | 'status' | 'lastRun' | 'nextRun'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<ScheduledExport>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  activityTypes: string[];
}

export function ScheduledExports({
  exports,
  onSchedule,
  onUpdate,
  onDelete,
  activityTypes,
}: ScheduledExportProps) {
  const [showNew, setShowNew] = useState(false);
  const [newExport, setNewExport] = useState({
    format: 'csv' as const,
    frequency: 'daily' as const,
    emailTo: [''],
    filters: {
      dateRange: {
        from: undefined as Date | undefined,
        to: undefined as Date | undefined,
      },
      types: [] as string[],
    },
  });
  const { toast } = useToast();

  const handleAddEmail = () => {
    setNewExport((prev) => ({
      ...prev,
      emailTo: [...prev.emailTo, ''],
    }));
  };

  const handleRemoveEmail = (index: number) => {
    setNewExport((prev) => ({
      ...prev,
      emailTo: prev.emailTo.filter((_, i) => i !== index),
    }));
  };

  const handleEmailChange = (index: number, value: string) => {
    setNewExport((prev) => ({
      ...prev,
      emailTo: prev.emailTo.map((email, i) => (i === index ? value : email)),
    }));
  };

  const handleSchedule = async () => {
    try {
      if (!newExport.emailTo[0]) {
        toast({
          title: 'Invalid email',
          description: 'Please provide at least one email address',
          variant: 'destructive',
        });
        return;
      }

      await onSchedule({
        ...newExport,
        emailTo: newExport.emailTo.filter(Boolean),
      });

      setShowNew(false);
      setNewExport({
        format: 'csv',
        frequency: 'daily',
        emailTo: [''],
        filters: {
          dateRange: {
            from: undefined,
            to: undefined,
          },
          types: [],
        },
      });

      toast({
        title: 'Export scheduled',
        description: 'Your export has been scheduled successfully',
      });
    } catch (error) {
      toast({
        title: 'Failed to schedule export',
        description: 'An error occurred while scheduling the export',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scheduled Exports</h2>
          <p className="text-sm text-gray-500">
            Automatically export activity data on a schedule
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} disabled={showNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Schedule
        </Button>
      </div>

      {showNew && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={newExport.format}
                onValueChange={(value: any) =>
                  setNewExport((prev) => ({ ...prev, format: value }))
                }
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
                <option value="html">HTML</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={newExport.frequency}
                onValueChange={(value: any) =>
                  setNewExport((prev) => ({ ...prev, frequency: value }))
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email Recipients</Label>
              <div className="space-y-2">
                {newExport.emailTo.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder="Email address"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveEmail(index)}
                      disabled={index === 0 && newExport.emailTo.length === 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddEmail}
                  className="w-full"
                >
                  Add Another Email
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Activity Types</Label>
              <Select
                value={newExport.filters.types.join(',')}
                onValueChange={(value) =>
                  setNewExport((prev) => ({
                    ...prev,
                    filters: {
                      ...prev.filters,
                      types: value ? value.split(',') : [],
                    },
                  }))
                }
                multiple
              >
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button onClick={handleSchedule}>Schedule Export</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {exports.map((exportItem) => (
          <Card key={exportItem.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {exportItem.format.toUpperCase()} Export
                  </h3>
                  <Badge variant={exportItem.status === 'active' ? 'default' : 'secondary'}>
                    {exportItem.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {exportItem.frequency} export to {exportItem.emailTo.join(', ')}
                </p>
                {exportItem.lastRun && (
                  <p className="text-sm text-gray-500">
                    Last run: {format(new Date(exportItem.lastRun), 'PPp')}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Next run: {format(new Date(exportItem.nextRun), 'PPp')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={exportItem.status === 'active'}
                  onCheckedChange={(checked) =>
                    onUpdate(exportItem.id, {
                      status: checked ? 'active' : 'paused',
                    })
                  }
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(exportItem.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
