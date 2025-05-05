import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AlertCircle, Save, Key, BellRing, Settings as SettingsIcon, RefreshCw } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    tradeAlerts: true,
    performanceReports: false,
    marketNews: true
  });
  const [riskSettings, setRiskSettings] = useState({
    maxPositionSize: "10",
    maxDailyLoss: "5",
    defaultStopLoss: "2"
  });
  const [preferenceSettings, setPreferenceSettings] = useState({
    defaultTimeframe: "1D",
    defaultIndicators: ["MovingAverage", "Volume"],
    defaultTheme: "light",
    autoRefresh: true
  });
  
  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  // Initialize state with current settings when data loads
  React.useEffect(() => {
    if (currentSettings) {
      setApiKey(currentSettings.apiKey || "");
      
      if (currentSettings.notifications) {
        setNotificationSettings({
          emailNotifications: currentSettings.notifications.emailNotifications ?? true,
          tradeAlerts: currentSettings.notifications.tradeAlerts ?? true,
          performanceReports: currentSettings.notifications.performanceReports ?? false,
          marketNews: currentSettings.notifications.marketNews ?? true
        });
      }
      
      if (currentSettings.risk) {
        setRiskSettings({
          maxPositionSize: currentSettings.risk.maxPositionSize?.toString() ?? "10",
          maxDailyLoss: currentSettings.risk.maxDailyLoss?.toString() ?? "5",
          defaultStopLoss: currentSettings.risk.defaultStopLoss?.toString() ?? "2"
        });
      }

      if (currentSettings.preferences) {
        setPreferenceSettings({
          defaultTimeframe: currentSettings.preferences.defaultTimeframe ?? "1D",
          defaultIndicators: currentSettings.preferences.defaultIndicators ?? ["MovingAverage", "Volume"],
          defaultTheme: currentSettings.preferences.defaultTheme ?? "light",
          autoRefresh: currentSettings.preferences.autoRefresh ?? true
        });
      }
    }
  }, [currentSettings]);

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
        variant: "default",
      });
      
      // Refresh settings data
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Verify API key mutation
  const verifyApiKey = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/verify-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify API key');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Verified",
        description: "Your AngelOne API key is valid and connected.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "API Key Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveSettings = () => {
    const settings = {
      apiKey,
      notifications: notificationSettings,
      risk: {
        maxPositionSize: parseFloat(riskSettings.maxPositionSize),
        maxDailyLoss: parseFloat(riskSettings.maxDailyLoss),
        defaultStopLoss: parseFloat(riskSettings.defaultStopLoss)
      },
      preferences: preferenceSettings
    };
    
    saveSettings.mutate(settings);
  };

  const handleApiKeyVerify = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key first",
        variant: "destructive",
      });
      return;
    }
    
    verifyApiKey.mutate();
  };

  return (
    <main className="pt-20 pb-10 px-4 lg:px-6 flex-grow">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Settings</h2>
        <p className="text-neutral-600 mt-1">Configure your trading preferences and API connections</p>
      </div>

      <Tabs defaultValue="api">
        <TabsList className="mb-6">
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-2" />
            API Connection
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellRing className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="risk">
            <AlertCircle className="h-4 w-4 mr-2" />
            Risk Management
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Trading Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>AngelOne API Connection</CardTitle>
              <CardDescription>
                Connect your AngelOne trading account to enable automated trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="api-key" 
                    type="password" 
                    placeholder="Enter your AngelOne API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleApiKeyVerify}
                    disabled={verifyApiKey.isPending}
                  >
                    {verifyApiKey.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    Verify
                  </Button>
                </div>
                <p className="text-sm text-neutral-500">
                  You can find your API key in the AngelOne web portal under Settings → API Keys
                </p>
              </div>

              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="flex items-center p-3 bg-neutral-50 rounded-md">
                  <div 
                    className={`h-3 w-3 rounded-full mr-2 ${
                      currentSettings?.connected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {currentSettings?.connected 
                      ? 'Connected to AngelOne' 
                      : 'Not connected to AngelOne'
                    }
                  </span>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleSaveSettings}
                disabled={saveSettings.isPending}
              >
                {saveSettings.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save API Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-neutral-500">Receive important updates via email</p>
                  </div>
                  <Switch 
                    id="email-notifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="trade-alerts">Trade Alerts</Label>
                    <p className="text-sm text-neutral-500">Get notified when trades are executed</p>
                  </div>
                  <Switch 
                    id="trade-alerts"
                    checked={notificationSettings.tradeAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, tradeAlerts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="performance-reports">Performance Reports</Label>
                    <p className="text-sm text-neutral-500">Receive weekly performance summaries</p>
                  </div>
                  <Switch 
                    id="performance-reports"
                    checked={notificationSettings.performanceReports}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, performanceReports: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="market-news">Market News</Label>
                    <p className="text-sm text-neutral-500">Get updates on market events relevant to your portfolio</p>
                  </div>
                  <Switch 
                    id="market-news"
                    checked={notificationSettings.marketNews}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, marketNews: checked }))
                    }
                  />
                </div>
              </div>

              <Button 
                className="w-full mt-6" 
                onClick={handleSaveSettings}
                disabled={saveSettings.isPending}
              >
                {saveSettings.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>
                Set limits and safety measures for your trading activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-position-size">Maximum Position Size (% of Portfolio)</Label>
                <Input 
                  id="max-position-size" 
                  type="number"
                  min="1"
                  max="100" 
                  value={riskSettings.maxPositionSize}
                  onChange={(e) => setRiskSettings(prev => ({ ...prev, maxPositionSize: e.target.value }))}
                />
                <p className="text-sm text-neutral-500">
                  Limit how much of your portfolio can be allocated to a single position
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-daily-loss">Maximum Daily Loss (%)</Label>
                <Input 
                  id="max-daily-loss" 
                  type="number"
                  min="0.5"
                  max="25" 
                  value={riskSettings.maxDailyLoss}
                  onChange={(e) => setRiskSettings(prev => ({ ...prev, maxDailyLoss: e.target.value }))}
                />
                <p className="text-sm text-neutral-500">
                  Trading will be paused if daily losses exceed this percentage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-stop-loss">Default Stop Loss (%)</Label>
                <Input 
                  id="default-stop-loss" 
                  type="number"
                  min="0.5"
                  max="15" 
                  value={riskSettings.defaultStopLoss}
                  onChange={(e) => setRiskSettings(prev => ({ ...prev, defaultStopLoss: e.target.value }))}
                />
                <p className="text-sm text-neutral-500">
                  Default stop loss percentage for all trades
                </p>
              </div>

              <Button 
                className="w-full mt-6" 
                onClick={handleSaveSettings}
                disabled={saveSettings.isPending}
              >
                {saveSettings.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Risk Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Trading Preferences</CardTitle>
              <CardDescription>
                Configure general trading preferences and defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-timeframe">Default Chart Timeframe</Label>
                <Select 
                  value={preferenceSettings.defaultTimeframe}
                  onValueChange={(value) => 
                    setPreferenceSettings(prev => ({ ...prev, defaultTimeframe: value }))
                  }
                >
                  <SelectTrigger id="default-timeframe">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1D">1 Day</SelectItem>
                    <SelectItem value="1W">1 Week</SelectItem>
                    <SelectItem value="1M">1 Month</SelectItem>
                    <SelectItem value="3M">3 Months</SelectItem>
                    <SelectItem value="1Y">1 Year</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-neutral-500">
                  Default timeframe to use when viewing stock charts
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-theme">Default Theme</Label>
                <Select 
                  value={preferenceSettings.defaultTheme}
                  onValueChange={(value) => 
                    setPreferenceSettings(prev => ({ ...prev, defaultTheme: value }))
                  }
                >
                  <SelectTrigger id="default-theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-neutral-500">
                  Choose the visual theme for the trading platform
                </p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-refresh">Auto-Refresh Charts</Label>
                  <p className="text-sm text-neutral-500">Automatically refresh chart data every minute</p>
                </div>
                <Switch 
                  id="auto-refresh" 
                  checked={preferenceSettings.autoRefresh}
                  onCheckedChange={(checked) => 
                    setPreferenceSettings(prev => ({ ...prev, autoRefresh: checked }))
                  } 
                />
              </div>

              <Button 
                className="w-full mt-6" 
                onClick={handleSaveSettings}
                disabled={saveSettings.isPending}
              >
                {saveSettings.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
