'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MaytapiConfig, maytapiConfigApi } from '@/lib/api';
import { toast } from 'sonner';
import { Settings, Wifi, WifiOff, Loader2, Save, Zap } from 'lucide-react';

export function MaytapiConfigForm() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [config, setConfig] = useState({
    apiKey: '',
    productId: '',
    phoneId: '',
    webhookUrl: '',
    phoneNumber: '',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await maytapiConfigApi.get();
      setConfig({
        apiKey: data.apiKey || '',
        productId: data.productId || '',
        phoneId: data.phoneId || '',
        webhookUrl: data.webhookUrl || '',
        phoneNumber: data.phoneNumber || '',
      });
      setConnected(data.isActive);
    } catch {
      // No config yet
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.apiKey || !config.productId) {
      toast.error('API Key and Product ID are required');
      return;
    }

    setSaving(true);
    try {
      await maytapiConfigApi.save(config);
      toast.success('Configuration saved successfully');
      setConnected(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await maytapiConfigApi.testConnection();
      if (result.success) {
        setConnected(true);
        toast.success('Connection successful!');
      } else {
        setConnected(false);
        toast.error(result.message || 'Connection failed');
      }
    } catch (err: unknown) {
      setConnected(false);
      toast.error(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading configuration...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-emerald-600" />
            Maytapi WhatsApp Configuration
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={connected ? 'default' : 'outline'}
              className={`text-xs ${
                connected
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {connected ? (
                <><Wifi className="h-3 w-3 mr-1" /> Connected</>
              ) : (
                <><WifiOff className="h-3 w-3 mr-1" /> Disconnected</>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => updateField('apiKey', e.target.value)}
              placeholder="Your Maytapi API key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productId">Product ID *</Label>
            <Input
              id="productId"
              value={config.productId}
              onChange={(e) => updateField('productId', e.target.value)}
              placeholder="Maytapi Product ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneId">Phone ID</Label>
            <Input
              id="phoneId"
              value={config.phoneId}
              onChange={(e) => updateField('phoneId', e.target.value)}
              placeholder="Phone ID (after scanning QR)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">RMA Finance Phone Number</Label>
            <Input
              id="phoneNumber"
              value={config.phoneNumber}
              onChange={(e) => updateField('phoneNumber', e.target.value)}
              placeholder="+91..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhookUrl">Webhook URL</Label>
          <Input
            id="webhookUrl"
            value={config.webhookUrl}
            onChange={(e) => updateField('webhookUrl', e.target.value)}
            placeholder="https://your-domain.com/api/webhook"
          />
          <p className="text-xs text-muted-foreground">
            This URL will receive incoming WhatsApp messages from Maytapi
          </p>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || !config.apiKey || !config.productId}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-1" />
            )}
            Test Connection
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !config.apiKey || !config.productId}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
