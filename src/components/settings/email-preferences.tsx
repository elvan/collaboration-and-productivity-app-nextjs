import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface EmailPreference {
  type: string;
  enabled: boolean;
  description: string;
}

const defaultPreferences: EmailPreference[] = [
  {
    type: 'team_invitation',
    enabled: true,
    description: 'Receive emails when you are invited to join a team',
  },
  {
    type: 'team_updates',
    enabled: true,
    description: 'Receive emails about important team changes',
  },
  {
    type: 'member_activities',
    enabled: true,
    description: 'Receive emails about team member activities',
  },
  {
    type: 'daily_digest',
    enabled: false,
    description: 'Receive daily digest of team activities',
  },
  {
    type: 'weekly_summary',
    enabled: false,
    description: 'Receive weekly summary of team activities',
  },
];

export function EmailPreferences() {
  const [preferences, setPreferences] = useState<EmailPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/email-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Failed to fetch email preferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (type: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/user/email-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, enabled }),
      });

      if (response.ok) {
        setPreferences((prev) =>
          prev.map((pref) =>
            pref.type === type ? { ...pref, enabled } : pref
          )
        );
        toast({
          title: 'Preferences updated',
          description: 'Your email notification preferences have been saved.',
        });
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Failed to update email preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Email Notifications</h2>
          <p className="text-sm text-gray-500">
            Manage how you receive email notifications
          </p>
        </div>

        <div className="space-y-4">
          {preferences.map((preference) => (
            <div
              key={preference.type}
              className="flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <Label>{preference.type.replace(/_/g, ' ').toUpperCase()}</Label>
                <p className="text-sm text-gray-500">{preference.description}</p>
              </div>
              <Switch
                checked={preference.enabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange(preference.type, checked)
                }
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
