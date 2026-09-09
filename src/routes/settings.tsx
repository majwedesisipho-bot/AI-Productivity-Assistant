import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { AiNotice } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Set your theme, notification preference and clear recent activity.",
      },
      { property: "og:title", content: "Settings" },
      {
        property: "og:description",
        content: "Theme, notifications and recent activity preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, updateSettings, clearActivity } = useAppStore();

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
          <CardDescription>Simple settings, stored in this browser only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={settings.displayName}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
              placeholder="Your name"
            />
            <p className="text-xs text-muted-foreground">Used to sign generated emails.</p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Dark theme</p>
              <p className="text-sm text-muted-foreground">Switch between light and dark.</p>
            </div>
            <Switch
              checked={settings.theme === "dark"}
              onCheckedChange={(v) => updateSettings({ theme: v ? "dark" : "light" })}
              aria-label="Dark theme"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Activity notifications</p>
              <p className="text-sm text-muted-foreground">
                Show recent activity in the notification menu.
              </p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(v) => updateSettings({ notifications: v })}
              aria-label="Notifications"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Recent activity</p>
              <p className="text-sm text-muted-foreground">
                Clears activity history and saved output previews.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                clearActivity();
                toast.success("Recent activity cleared");
              }}
            >
              Clear recent activity
            </Button>
          </div>
        </CardContent>
      </Card>

      <AiNotice />
    </div>
  );
}
