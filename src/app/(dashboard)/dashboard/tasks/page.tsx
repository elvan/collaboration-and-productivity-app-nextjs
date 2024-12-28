import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TaskList } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Manage and track your tasks",
};

async function getProjectMembers(projectId: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return members.map((member) => ({
    id: member.user.id,
    name: member.user.name || "",
    image: member.user.image,
  }));
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get the user's current project (for now using first project they're a member of)
  const projectMembership = await prisma.projectMember.findFirst({
    where: { userId: session.user.id },
    include: { project: true },
  });

  if (!projectMembership) {
    // Handle case where user isn't part of any project
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-medium">No Project Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Join or create a project to start managing tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const projectMembers = await getProjectMembers(projectMembership.projectId);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Project: {projectMembership.project.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      </div>
      <div className="h-full flex-1 flex-col space-y-8 md:flex">
        <TaskList 
          projectId={projectMembership.projectId} 
          projectMembers={projectMembers} 
          onDelete={async () => {}} 
          onUpdate={async () => {}} 
          selectedTasks={[]} 
          onSelectTask={() => {}} 
          showHierarchy={false} 
        />
      </div>
    </div>
  );
}
