import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface WorkspaceSettingsProps {
  workspace: {
    id: string;
    name: string;
    description?: string;
    settings?: {
      allowPublicProjects: boolean;
      defaultProjectView: string;
      enableFileSharing: boolean;
    };
  };
  onUpdate: (data: any) => void;
}

export function WorkspaceSettings({ workspace, onUpdate }: WorkspaceSettingsProps) {
  const [settings, setSettings] = useState(workspace.settings || {
    allowPublicProjects: false,
    defaultProjectView: 'list',
    enableFileSharing: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    onUpdate({ settings: updatedSettings });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Workspace Settings</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Workspace Name</Label>
            <Input 
              id="name"
              defaultValue={workspace.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              defaultValue={workspace.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Public Projects</Label>
              <p className="text-sm text-gray-500">Enable creating public projects in this workspace</p>
            </div>
            <Switch
              checked={settings.allowPublicProjects}
              onCheckedChange={(checked) => handleSettingChange('allowPublicProjects', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>File Sharing</Label>
              <p className="text-sm text-gray-500">Enable file sharing in workspace projects</p>
            </div>
            <Switch
              checked={settings.enableFileSharing}
              onCheckedChange={(checked) => handleSettingChange('enableFileSharing', checked)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
