import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { ActivityType } from '@/lib/activity-logger';

interface ActivityFilters {
  search: string;
  type: ActivityType | 'all';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  userId: string | null;
}

interface ActivityFiltersProps {
  onFiltersChange: (filters: ActivityFilters) => void;
  users: Array<{ id: string; name: string }>;
}

export function ActivityFilters({ onFiltersChange, users }: ActivityFiltersProps) {
  const [filters, setFilters] = useState<ActivityFilters>({
    search: '',
    type: 'all',
    dateRange: {
      from: null,
      to: null,
    },
    userId: null,
  });

  const handleFilterChange = (
    key: keyof ActivityFilters,
    value: any
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const activityTypes: Array<{ value: ActivityType | 'all'; label: string }> = [
    { value: 'all', label: 'All Activities' },
    { value: 'member_invited', label: 'Member Invited' },
    { value: 'member_joined', label: 'Member Joined' },
    { value: 'member_left', label: 'Member Left' },
    { value: 'role_updated', label: 'Role Updated' },
    { value: 'settings_updated', label: 'Settings Updated' },
    { value: 'workspace_created', label: 'Workspace Created' },
    { value: 'workspace_archived', label: 'Workspace Archived' },
    { value: 'team_created', label: 'Team Created' },
    { value: 'team_archived', label: 'Team Archived' },
  ];

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search activities..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Activity Type</Label>
            <Select
              value={filters.type}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              {activityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>User</Label>
            <Select
              value={filters.userId || ''}
              onValueChange={(value) =>
                handleFilterChange('userId', value || null)
              }
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {filters.dateRange.from ? (
                    format(filters.dateRange.from, 'PP')
                  ) : (
                    'Pick start date'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from || undefined}
                  onSelect={(date) =>
                    handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      from: date,
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {filters.dateRange.to ? (
                    format(filters.dateRange.to, 'PP')
                  ) : (
                    'Pick end date'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to || undefined}
                  onSelect={(date) =>
                    handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      to: date,
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            const defaultFilters: ActivityFilters = {
              search: '',
              type: 'all',
              dateRange: {
                from: null,
                to: null,
              },
              userId: null,
            };
            setFilters(defaultFilters);
            onFiltersChange(defaultFilters);
          }}
        >
          Reset Filters
        </Button>
      </div>
    </Card>
  );
}
