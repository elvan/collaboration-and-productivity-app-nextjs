import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ProjectNavigationProps {
  project: {
    id: string;
    name: string;
    sections: {
      id: string;
      name: string;
      path: string;
      shortcut?: string;
    }[];
  };
}

export function ProjectNavigation({ project }: ProjectNavigationProps) {
  const router = useRouter();

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Handle global shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'p':
            event.preventDefault();
            router.push(`/projects/${project.id}`);
            break;
          case 't':
            event.preventDefault();
            router.push(`/projects/${project.id}/tasks`);
            break;
          case 'f':
            event.preventDefault();
            router.push(`/projects/${project.id}/files`);
            break;
          case 's':
            event.preventDefault();
            router.push(`/projects/${project.id}/settings`);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [project.id, router]);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Project Navigation</h2>
          <p className="text-sm text-gray-500">Use keyboard shortcuts to quickly navigate</p>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {project.sections.map((section) => (
              <div key={section.id}>
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => router.push(section.path)}
                >
                  <span>{section.name}</span>
                  {section.shortcut && (
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">⌘</span>
                      {section.shortcut}
                    </kbd>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="text-sm text-gray-500">
          <p className="font-semibold mb-2">Keyboard Shortcuts</p>
          <ul className="space-y-1">
            <li>⌘ + P - Project Overview</li>
            <li>⌘ + T - Tasks</li>
            <li>⌘ + F - Files</li>
            <li>⌘ + S - Settings</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
