import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { soundManager, NotificationSound } from '@/lib/sounds';
import { Volume2, VolumeX, Play } from 'lucide-react';

export function SoundSettings() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(50);
  const [currentSound, setCurrentSound] = useState<NotificationSound>('default');

  useEffect(() => {
    // Load initial settings
    const enabled = localStorage.getItem('notificationSoundEnabled');
    const volume = localStorage.getItem('notificationSoundVolume');
    const sound = localStorage.getItem('notificationSound') as NotificationSound;

    if (enabled !== null) setEnabled(enabled === 'true');
    if (volume !== null) setVolume(parseFloat(volume) * 100);
    if (sound) setCurrentSound(sound);
  }, []);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    soundManager.setEnabled(checked);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    soundManager.setVolume(newVolume / 100);
  };

  const handleSoundChange = (value: NotificationSound) => {
    setCurrentSound(value);
    soundManager.setSound(value);
  };

  const playSound = () => {
    soundManager.play(currentSound);
  };

  const sounds: { value: NotificationSound; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'subtle', label: 'Subtle' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
    { value: 'none', label: 'None' },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Sound Settings</h2>
          <p className="text-sm text-gray-500">
            Customize notification sounds and volume
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Sounds</Label>
              <p className="text-sm text-gray-500">
                Play sounds for notifications
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={handleToggle} />
          </div>

          <div className="space-y-2">
            <Label>Notification Sound</Label>
            <div className="flex items-center gap-2">
              <Select
                value={currentSound}
                onValueChange={handleSoundChange}
                disabled={!enabled}
              >
                {sounds.map((sound) => (
                  <option key={sound.value} value={sound.value}>
                    {sound.label}
                  </option>
                ))}
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={playSound}
                disabled={!enabled || currentSound === 'none'}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Volume</Label>
            <div className="flex items-center gap-4">
              <VolumeX className="h-4 w-4" />
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                disabled={!enabled}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
