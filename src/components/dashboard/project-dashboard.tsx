import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  upcomingDeadlines: {
    id: string;
    title: string;
    dueDate: string;
  }[];
  recentActivities: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: {
      name: string;
      avatar?: string;
    };
  }[];
}

interface ProjectDashboardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    stats: ProjectStats;
  };
}

export function ProjectDashboard({ project }: ProjectDashboardProps) {
  const completionRate = (project.stats.completedTasks / project.stats.totalTasks) * 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
          <p className="text-2xl font-bold">{project.stats.totalTasks}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="text-2xl font-bold">{project.stats.completedTasks}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="text-2xl font-bold">{project.stats.inProgressTasks}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
          <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
          <Progress value={completionRate} className="mt-2" />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-4">
              {project.stats.upcomingDeadlines.map((task) => (
                <div key={task.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500">Due: {task.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-4">
              {project.stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  {activity.user.avatar ? (
                    <img
                      src={activity.user.avatar}
                      alt={activity.user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {activity.user.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{activity.user.name}</span>{' '}
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
