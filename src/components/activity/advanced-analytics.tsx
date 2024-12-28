import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Scatter,
} from 'recharts';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { useAnalyticsUpdates } from '@/lib/realtime/analytics-updates';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AdvancedAnalytics {
  trendAnalysis: {
    date: string;
    total: number;
    trend: number;
    prediction: number;
  }[];
  userEngagement: {
    hour: number;
    activeUsers: number;
    activities: number;
    engagement: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    growth: number;
    users: number;
  }[];
  performanceMetrics: {
    metric: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

interface AdvancedAnalyticsProps {
  initialData: AdvancedAnalytics;
}

export function AdvancedAnalytics({ initialData }: AdvancedAnalyticsProps) {
  const [data, setData] = useState(initialData);
  const [timeRange, setTimeRange] = useState('7d');

  // Subscribe to real-time updates
  useAnalyticsUpdates((update) => {
    switch (update.type) {
      case 'activity':
        updateActivityData(update.data);
        break;
      case 'user':
        updateUserData(update.data);
        break;
      case 'performance':
        updatePerformanceData(update.data);
        break;
    }
  });

  const updateActivityData = (newActivity: any) => {
    setData((prev) => {
      // Update trend analysis
      const updatedTrend = [...prev.trendAnalysis];
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayIndex = updatedTrend.findIndex((item) => item.date === today);
      
      if (todayIndex >= 0) {
        updatedTrend[todayIndex].total += 1;
        // Recalculate trend and prediction
        updatedTrend[todayIndex].trend = calculateTrend(updatedTrend, todayIndex);
        updatedTrend[todayIndex].prediction = calculatePrediction(updatedTrend, todayIndex);
      }

      // Update category breakdown
      const updatedCategories = [...prev.categoryBreakdown];
      const categoryIndex = updatedCategories.findIndex(
        (cat) => cat.category === newActivity.type
      );
      
      if (categoryIndex >= 0) {
        updatedCategories[categoryIndex].count += 1;
        updatedCategories[categoryIndex].users = new Set([
          ...Array.from(String(updatedCategories[categoryIndex].users)),
          newActivity.userId,
        ]).size;
      }

      return {
        ...prev,
        trendAnalysis: updatedTrend,
        categoryBreakdown: updatedCategories,
      };
    });
  };

  const updateUserData = (userData: any) => {
    setData((prev) => {
      // Update user engagement
      const updatedEngagement = [...prev.userEngagement];
      const hour = new Date().getHours();
      const hourIndex = updatedEngagement.findIndex((item) => item.hour === hour);
      
      if (hourIndex >= 0) {
        updatedEngagement[hourIndex].activeUsers = userData.activeUsers;
        updatedEngagement[hourIndex].engagement = calculateEngagement(
          userData.activeUsers,
          updatedEngagement[hourIndex].activities
        );
      }

      return {
        ...prev,
        userEngagement: updatedEngagement,
      };
    });
  };

  const updatePerformanceData = (performanceData: any) => {
    setData((prev) => ({
      ...prev,
      performanceMetrics: performanceData,
    }));
  };

  const calculateTrend = (data: any[], index: number): number => {
    if (index < 2) return 0;
    const recent = data[index].total;
    const previous = data[index - 1].total;
    return ((recent - previous) / previous) * 100;
  };

  const calculatePrediction = (data: any[], index: number): number => {
    if (index < 3) return data[index].total;
    const trend = calculateTrend(data, index);
    return data[index].total * (1 + trend / 100);
  };

  const calculateEngagement = (users: number, activities: number): number => {
    if (users === 0) return 0;
    return (activities / users) * 100;
  };

  // Custom tooltip styles
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border">
          <p className="font-semibold">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: {item.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="trends" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
            <TabsTrigger value="engagement">User Engagement</TabsTrigger>
            <TabsTrigger value="categories">Category Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          </TabsList>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </Select>
        </div>

        <TabsContent value="trends" className="space-y-4">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trendAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="total"
                  fill="#8884d8"
                  stroke="#8884d8"
                  name="Total Activities"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="trend"
                  stroke="#82ca9d"
                  name="Trend %"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="prediction"
                  stroke="#ffc658"
                  strokeDasharray="5 5"
                  name="Prediction"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.userEngagement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="activities"
                  fill="#8884d8"
                  name="Activities"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#82ca9d"
                  name="Active Users"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="engagement"
                  stroke="#ffc658"
                  name="Engagement %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="count"
                  fill="#8884d8"
                  name="Activity Count"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="growth"
                  stroke="#82ca9d"
                  name="Growth %"
                />
                <Scatter
                  yAxisId="left"
                  dataKey="users"
                  fill="#ffc658"
                  name="Unique Users"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.performanceMetrics.map((metric) => (
              <Card key={metric.metric} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{metric.metric}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <div className={`text-${metric.trend === 'up' ? 'green' : metric.trend === 'down' ? 'red' : 'gray'}-500`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
