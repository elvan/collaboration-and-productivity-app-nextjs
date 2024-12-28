import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfHour, differenceInHours } from 'date-fns';

interface ActivityInsight {
  timeDistribution: {
    hour: number;
    count: number;
  }[];
  userCorrelations: {
    user1: string;
    user2: string;
    correlation: number;
    activities: number;
  }[];
  activityPatterns: {
    type: string;
    sequence: string[];
    frequency: number;
  }[];
  peakTimes: {
    day: string;
    hour: number;
    intensity: number;
  }[];
}

interface ActivityInsightsProps {
  insights: ActivityInsight;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ActivityInsights({ insights }: ActivityInsightsProps) {
  return (
    <Card className="p-6">
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Activity Patterns</TabsTrigger>
          <TabsTrigger value="correlations">User Correlations</TabsTrigger>
          <TabsTrigger value="peak-times">Peak Times</TabsTrigger>
          <TabsTrigger value="distribution">Time Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <h3 className="text-lg font-semibold">Common Activity Patterns</h3>
          <p className="text-sm text-gray-500">
            Frequently occurring sequences of activities
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.activityPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 shadow-lg rounded-lg border">
                          <p className="font-semibold">{data.type}</p>
                          <p className="text-sm">Frequency: {data.frequency}</p>
                          <p className="text-sm">Sequence:</p>
                          <ul className="text-sm list-disc pl-4">
                            {data.sequence.map((step: string, i: number) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="frequency" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-4">
          <h3 className="text-lg font-semibold">User Collaboration Patterns</h3>
          <p className="text-sm text-gray-500">
            Visualization of user activity correlations
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="activities"
                  name="Activities"
                  unit=" activities"
                />
                <YAxis
                  dataKey="correlation"
                  name="Correlation"
                  unit="%"
                />
                <ZAxis
                  dataKey="user1"
                  name="Users"
                  formatter={(value) => `${value} & ${value}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 shadow-lg rounded-lg border">
                          <p className="font-semibold">User Correlation</p>
                          <p className="text-sm">
                            {data.user1} & {data.user2}
                          </p>
                          <p className="text-sm">
                            Correlation: {data.correlation}%
                          </p>
                          <p className="text-sm">
                            Joint Activities: {data.activities}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={insights.userCorrelations}
                  fill="#8884d8"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="peak-times" className="space-y-4">
          <h3 className="text-lg font-semibold">Activity Peak Times</h3>
          <p className="text-sm text-gray-500">
            Heat map of activity intensity by day and hour
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insights.peakTimes}
                  dataKey="intensity"
                  nameKey="day"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    day,
                    hour,
                  }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#fff"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {`${day} ${hour}:00`}
                      </text>
                    );
                  }}
                >
                  {insights.peakTimes.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 shadow-lg rounded-lg border">
                          <p className="font-semibold">
                            {data.day} at {data.hour}:00
                          </p>
                          <p className="text-sm">
                            Activity Intensity: {data.intensity}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <h3 className="text-lg font-semibold">Activity Time Distribution</h3>
          <p className="text-sm text-gray-500">
            Distribution of activities across hours
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 shadow-lg rounded-lg border">
                          <p className="font-semibold">
                            {data.hour}:00 - {data.hour + 1}:00
                          </p>
                          <p className="text-sm">
                            Activities: {data.count}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#8884d8">
                  {insights.timeDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
