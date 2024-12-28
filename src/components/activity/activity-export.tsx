import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface ActivityExportProps {
  onExport: (options: {
    format: 'csv' | 'excel' | 'json' | 'pdf' | 'html';
    dateRange?: {
      from: Date;
      to: Date;
    };
    types?: string[];
  }) => Promise<void>;
  activityTypes: string[];
  isExporting?: boolean;
}

export function ActivityExport({
  onExport,
  activityTypes,
  isExporting = false,
}: ActivityExportProps) {
  const [format, setFormat] = useState<'csv' | 'excel' | 'json' | 'pdf' | 'html'>('csv');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      if (dateRange.from && !dateRange.to) {
        toast({
          title: 'Invalid date range',
          description: 'Please select both start and end dates',
          variant: 'destructive',
        });
        return;
      }

      await onExport({
        format,
        dateRange: dateRange.from && dateRange.to
          ? { from: dateRange.from, to: dateRange.to }
          : undefined,
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export activities. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Export Activities</h2>
          <p className="text-sm text-gray-500">
            Download your activity log in various formats
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <option value="csv">CSV (Comma Separated Values)</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="json">JSON (JavaScript Object Notation)</option>
              <option value="pdf">PDF Document</option>
              <option value="html">HTML Web Page</option>
            </Select>
            <p className="text-sm text-gray-500">
              {format === 'csv' && 'Best for importing into other applications'}
              {format === 'excel' && 'Best for detailed analysis and formatting'}
              {format === 'json' && 'Best for programmatic processing'}
              {format === 'pdf' && 'Best for sharing and printing'}
              {format === 'html' && 'Best for viewing in a web browser'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-[200px] justify-start text-left font-normal ${
                      !dateRange.from && 'text-muted-foreground'
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      format(dateRange.from, 'PPP')
                    ) : (
                      'Pick start date'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, from: date || undefined }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-[200px] justify-start text-left font-normal ${
                      !dateRange.to && 'text-muted-foreground'
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? (
                      format(dateRange.to, 'PPP')
                    ) : (
                      'Pick end date'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, to: date || undefined }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Activity Types</Label>
            <Select
              value={selectedTypes.join(',')}
              onValueChange={(value) => setSelectedTypes(value ? value.split(',') : [])}
              multiple
            >
              {activityTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
            <p className="text-sm text-gray-500">
              Leave empty to include all activity types
            </p>
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Activities'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
