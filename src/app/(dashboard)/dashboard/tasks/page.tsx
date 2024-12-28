import { Metadata } from "next";
import { TaskList } from "@/components/tasks/task-list";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Manage and track your tasks",
};

export default async function TasksPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
      </div>
      <div className="h-full flex-1 flex-col space-y-8 md:flex">
        <TaskList />
      </div>
    </div>
  );
}
