'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Rocket, Database, Key, Globe, CheckCircle2, Copy, ExternalLink,
  ChevronDown, ChevronUp, Terminal, Shield, Zap, Settings,
} from 'lucide-react';
import { toast } from 'sonner';

export function VercelDeployGuide() {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const steps = [
    {
      icon: Database,
      title: 'Step 1: Setup PostgreSQL Database',
      description: 'Create a Neon/Vercel Postgres database',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Go to <a href="https://vercel.com/dashboard/stores" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Vercel Storage Dashboard</a> and create a new Postgres database, or use <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Neon.tech</a> for a free PostgreSQL database.
          </p>
          <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
            <p className="text-muted-foreground"># After creating, copy the connection string</p>
            <p className="text-muted-foreground"># Format: postgresql://user:pass@host/db?sslmode=require</p>
            <div className="flex items-center justify-between">
              <code className="text-emerald-600">DATABASE_URL=postgresql://...</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/rma_finance?sslmode=require')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Key,
      title: 'Step 2: Set Environment Variables',
      description: 'Configure all required env vars in Vercel',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">In your Vercel project settings → Environment Variables, add:</p>
          <div className="space-y-2">
            {[
              { key: 'DATABASE_URL', desc: 'PostgreSQL connection string from Step 1', required: true },
              { key: 'NEXT_PUBLIC_APP_URL', desc: 'Your Vercel app URL (https://your-app.vercel.app)', required: true },
              { key: 'VERCEL_URL', desc: 'Auto-set by Vercel (no action needed)', required: false },
            ].map((env) => (
              <div key={env.key} className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-emerald-600">{env.key}</code>
                    {env.required && <Badge variant="outline" className="text-[10px] h-4">Required</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{env.desc}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(env.key)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: Globe,
      title: 'Step 3: Deploy to Vercel',
      description: 'Push code and deploy',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Option A: Connect GitHub repo to Vercel</p>
          <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-2">
            <p className="text-muted-foreground"># 1. Push your code to GitHub</p>
            <div className="flex items-center justify-between">
              <code className="text-emerald-600">git init && git add . && git commit -m &quot;RMA Finance Bot&quot;</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('git init && git add . && git commit -m "RMA Finance Bot"')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <code className="text-emerald-600">git remote add origin https://github.com/YOUR_USER/rma-finance-bot.git</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('git remote add origin https://github.com/YOUR_USER/rma-finance-bot.git')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <code className="text-emerald-600">git push -u origin main</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('git push -u origin main')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Option B: Use Vercel CLI</p>
          <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between">
              <code className="text-emerald-600">npx vercel</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('npx vercel')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Terminal,
      title: 'Step 4: Run Database Migration',
      description: 'Push Prisma schema to your PostgreSQL database',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">After first deploy, run the migration:</p>
          <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between">
              <code className="text-emerald-600">npx prisma db push</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('npx prisma db push')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-muted-foreground"># Or use migrations for production:</p>
            <div className="flex items-center justify-between">
              <code className="text-emerald-600">npx prisma migrate deploy</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('npx prisma migrate deploy')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Then seed the database with Google Sheets data using the &quot;Reset &amp; Sync&quot; button on the Dashboard, or call:</p>
          <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <code className="text-emerald-600">curl -X POST https://your-app.vercel.app/api/seed</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('curl -X POST https://your-app.vercel.app/api/seed')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Settings,
      title: 'Step 5: Configure Maytapi Webhook',
      description: 'Point Maytapi to your Vercel app',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Go to <a href="https://maytapi.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Maytapi Dashboard</a> and set the webhook URL:
          </p>
          <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <code className="text-emerald-600">https://your-app.vercel.app/api/webhook/maytapi</code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard('https://your-app.vercel.app/api/webhook/maytapi')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Then in the Settings tab of this app, configure your Maytapi API Key and Product ID.</p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Important:</strong> No separate mini-service is needed on Vercel. The webhook is handled directly by the Next.js API route.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: CheckCircle2,
      title: 'Step 6: Verify Everything Works',
      description: 'Test your deployment',
      content: (
        <div className="space-y-3">
          <div className="space-y-2">
            {[
              { label: 'Dashboard loads with data', url: '/ (Dashboard tab)' },
              { label: 'Google Sheets sync works', url: 'Click "Sync Sheets" button' },
              { label: 'Bot Simulator responds', url: 'Bot Simulator tab' },
              { label: 'Maytapi webhook receives messages', url: 'Send a WhatsApp message' },
              { label: 'Bot auto-replies correctly', url: 'Check Chat Logs tab' },
            ].map((check) => (
              <div key={check.label} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{check.label}</span>
                <span className="text-xs text-muted-foreground">— {check.url}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="h-4 w-4 text-emerald-600" />Vercel Deployment Guide
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Step-by-step guide to deploy RMA Finance WhatsApp Bot on Vercel
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { icon: Database, label: 'PostgreSQL', value: 'Neon/Vercel', color: 'text-blue-500' },
            { icon: Zap, label: 'Runtime', value: 'Serverless', color: 'text-amber-500' },
            { icon: Shield, label: 'Webhook', value: 'Direct API', color: 'text-emerald-500' },
            { icon: Globe, label: 'Platform', value: 'Vercel', color: 'text-purple-500' },
          ].map((info) => (
            <div key={info.label} className="rounded-lg border p-2 text-center">
              <info.icon className={`h-4 w-4 mx-auto mb-1 ${info.color}`} />
              <p className="text-[10px] text-muted-foreground">{info.label}</p>
              <p className="text-xs font-semibold">{info.value}</p>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="rounded-lg border">
              <button
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedStep(expandedStep === index ? null : index)}
              >
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 shrink-0">
                  <step.icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                </div>
                {expandedStep === index ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {expandedStep === index && (
                <div className="px-3 pb-3 pt-0 border-t">
                  {step.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Important Notes */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Important Notes</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
            {[
              'SQLite → PostgreSQL: The database has been changed from SQLite to PostgreSQL for Vercel compatibility.',
              'No Mini-Service Needed: On Vercel, webhooks are handled directly by the Next.js API route at /api/webhook/maytapi.',
              'Google Sheets: The app syncs data from Google Sheets on demand. No API key needed — sheets must be publicly accessible.',
              'Cold Starts: First request after idle may take a few seconds (serverless cold start).',
            ].map((note, i) => (
              <p key={i} className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-1.5">
                <span className="font-bold">•</span>
                {note}
              </p>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-2 mt-3">
          <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <ExternalLink className="h-3 w-3" />Deploy on Vercel
            </Button>
          </a>
          <a href="https://neon.tech" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Database className="h-3 w-3" />Get Neon Postgres
            </Button>
          </a>
          <a href="https://maytapi.com" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <ExternalLink className="h-3 w-3" />Maytapi Dashboard
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
