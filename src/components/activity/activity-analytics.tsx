import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ActivityType } from '@/lib/activity-logger';

interface ActivityAnalytics {
  timeData: {
    date: string;
    count: number;
    type: ActivityType;
  }[];
  typeDistribution: {
    type: ActivityType;
    count: number;
    percentage: number;
  }[];
  userActivity: {
    userId: string;
    userName: string;
    activityCount: number;
    lastActive: string;
  }[];
  summary: {
    totalActivities: number;
    averagePerDay: number;
    mostActiveType: ActivityType;
    mostActiveUser: string;
  };
}

interface ActivityAnalyticsProps {
  analytics: ActivityAnalytics;
  onTimeRangeChange: (range: string) => void;
}

export function ActivityAnalytics({
  analytics,
  onTimeRangeChange,
}: ActivityAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('7d');

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    onTimeRangeChange(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activity Analytics</h2>
        <Select
          value={timeRange}
          onValueChange={handleTimeRangeChange}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Activities</h3>
          <p className="text-2xl font-bold">{analytics.summary.totalActivities}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Average Per Day</h3>
          <p className="text-2xl font-bold">
            {analytics.summary.averagePerDay.toFixed(1)}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Most Active Type</h3>
          <p className="text-2xl font-bold">
            {analytics.summary.mostActiveType.replace(/_/g, ' ')}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Most Active User</h3>
          <p className="text-2xl font-bold">{analytics.summary.mostActiveUser}</p>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          <TabsTrigger value="distribution">Type Distribution</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analytics.timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics.typeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              {analytics.userActivity.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-sm text-gray-500">
                      Last active: {new Date(user.lastActive).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{user.activityCount}</p>
                    <p className="text-sm text-gray-500">activities</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
