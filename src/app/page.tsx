'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import {
  MessageSquare, Sun, Moon, LayoutDashboard, Building2, FolderKanban,
  Users, Smartphone, MessageCircle, Settings, RefreshCw, Loader2,
  CloudDownload, Bot, CheckCircle2, AlertCircle, Clock, Database,
  Briefcase, IndianRupee, BarChart3, Building,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Client, Project, TeamLeader, WhatsAppUser, ChatMessage,
  DashboardStats, SyncLog,
  clientsApi, projectsApi, teamLeadersApi, whatsappUsersApi,
  chatMessagesApi, dashboardApi, seedApi, googleSyncAPI,
} from '@/lib/api';

// Dynamically loaded heavy components
const StatsCards = dynamic(() => import('@/components/dashboard/stats-cards').then(m => ({ default: m.StatsCards })), { ssr: false });
const RecentChats = dynamic(() => import('@/components/dashboard/recent-chats').then(m => ({ default: m.RecentChats })), { ssr: false });
const ProjectChart = dynamic(() => import('@/components/dashboard/project-chart').then(m => ({ default: m.ProjectChart })), { ssr: false });
const ClientTable = dynamic(() => import('@/components/clients/client-table').then(m => ({ default: m.ClientTable })), { ssr: false });
const ProjectTable = dynamic(() => import('@/components/projects/project-table').then(m => ({ default: m.ProjectTable })), { ssr: false });
const LeaderCards = dynamic(() => import('@/components/team-leaders/leader-cards').then(m => ({ default: m.LeaderCards })), { ssr: false });
const UserTable = dynamic(() => import('@/components/whatsapp/user-table').then(m => ({ default: m.UserTable })), { ssr: false });
const ChatLog = dynamic(() => import('@/components/chat/chat-log').then(m => ({ default: m.ChatLog })), { ssr: false });
const MaytapiConfigForm = dynamic(() => import('@/components/settings/maytapi-config').then(m => ({ default: m.MaytapiConfigForm })), { ssr: false });
const VercelDeployGuide = dynamic(() => import('@/components/settings/vercel-deploy-guide').then(m => ({ default: m.VercelDeployGuide })), { ssr: false });

const SmartphoneIcon = Smartphone;

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [whatsappUsers, setWhatsappUsers] = useState<WhatsAppUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  const [loading, setLoading] = useState({
    clients: true, projects: true, teamLeaders: true,
    whatsappUsers: true, chatMessages: true, dashboard: true,
  });

  const [seeding, setSeeding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchClients = useCallback(async () => {
    try { const data = await clientsApi.list(); setClients(data); }
    catch { /* API not ready */ }
    finally { setLoading(prev => ({ ...prev, clients: false })); }
  }, []);

  const fetchProjects = useCallback(async () => {
    try { const data = await projectsApi.list(); setProjects(data); }
    catch { /* API not ready */ }
    finally { setLoading(prev => ({ ...prev, projects: false })); }
  }, []);

  const fetchTeamLeaders = useCallback(async () => {
    try { const data = await teamLeadersApi.list(); setTeamLeaders(data); }
    catch { /* API not ready */ }
    finally { setLoading(prev => ({ ...prev, teamLeaders: false })); }
  }, []);

  const fetchWhatsappUsers = useCallback(async () => {
    try { const data = await whatsappUsersApi.list(); setWhatsappUsers(data); }
    catch { /* API not ready */ }
    finally { setLoading(prev => ({ ...prev, whatsappUsers: false })); }
  }, []);

  const fetchChatMessages = useCallback(async () => {
    try { const data = await chatMessagesApi.list(); setChatMessages(data); }
    catch { /* API not ready */ }
    finally { setLoading(prev => ({ ...prev, chatMessages: false })); }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try { const data = await dashboardApi.getStats(); setDashboardStats(data); }
    catch { /* API not ready */ }
    finally { setLoading(prev => ({ ...prev, dashboard: false })); }
  }, []);

  const fetchSyncLogs = useCallback(async () => {
    try { const data = await googleSyncAPI.history(); setSyncLogs(Array.isArray(data) ? data : []); }
    catch { /* API not ready */ }
  }, []);

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchClients(), fetchProjects(), fetchTeamLeaders(),
      fetchWhatsappUsers(), fetchChatMessages(), fetchDashboard(), fetchSyncLogs(),
    ]);
  }, [fetchClients, fetchProjects, fetchTeamLeaders, fetchWhatsappUsers, fetchChatMessages, fetchDashboard, fetchSyncLogs]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Data refreshed');
  }, [fetchAllData]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      const result = await seedApi.seed();
      toast.success(`Data synced! ${result.summary?.clients || 0} clients, ${result.summary?.projects || 0} projects`);
      await fetchAllData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to seed data');
    } finally { setSeeding(false); }
  }, [fetchAllData]);

  const handleGoogleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await googleSyncAPI.sync(['raw_data', 'raw_data2', 'new_dash']);
      if (result.success) {
        const total = result.summary?.totalSynced || 0;
        const errors = result.summary?.errors || [];
        if (errors.length > 0) toast.warning(`Synced ${total} records with ${errors.length} errors`);
        else toast.success(`Sync complete! ${total} records updated`);
        await fetchAllData();
      } else { toast.error('Sync failed'); }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to sync Google Sheets');
    } finally { setSyncing(false); }
  }, [fetchAllData]);

  const statsCards = dashboardStats
    ? [
        { title: 'Total Clients', value: dashboardStats.overview.totalClients, icon: Users, change: `${clients.length} active`, changeType: 'neutral' as const },
        { title: 'Total Projects', value: dashboardStats.overview.totalProjects, icon: Briefcase, change: `${dashboardStats.overview.inProgressProjects} in progress`, changeType: 'neutral' as const },
        { title: 'Total Loan Amount', value: `₹${dashboardStats.financials.totalLoanAmount.toFixed(1)} Cr`, icon: IndianRupee, change: 'Across all projects', changeType: 'neutral' as const },
        { title: 'Avg Completion', value: `${dashboardStats.overview.avgCompletion}%`, icon: BarChart3, change: dashboardStats.overview.avgCompletion >= 50 ? 'On track' : 'Needs attention', changeType: dashboardStats.overview.avgCompletion >= 50 ? ('positive' as const) : ('negative' as const) },
        { title: 'WhatsApp Users', value: dashboardStats.overview.totalWhatsAppUsers, icon: SmartphoneIcon, change: `${whatsappUsers.filter(u => u.isRegistered).length} registered`, changeType: 'neutral' as const },
        { title: 'Banks Linked', value: dashboardStats.overview.totalBanks || 0, icon: Building, change: `₹${(dashboardStats.bankStats?.totalBankLoanAmount || 0).toFixed(1)} Cr total`, changeType: 'neutral' as const },
      ]
    : [
        { title: 'Total Clients', value: clients.length, icon: Users, change: undefined, changeType: 'neutral' as const },
        { title: 'Total Projects', value: projects.length, icon: Briefcase, change: undefined, changeType: 'neutral' as const },
        { title: 'Total Loan Amount', value: `₹${projects.reduce((s, p) => s + p.totalLoanAmount, 0).toFixed(1)} Cr`, icon: IndianRupee, change: undefined, changeType: 'neutral' as const },
        { title: 'Avg Completion', value: `${projects.length > 0 ? (projects.reduce((s, p) => s + p.completionPct, 0) / projects.length).toFixed(0) : 0}%`, icon: BarChart3, change: undefined, changeType: 'neutral' as const },
        { title: 'WhatsApp Users', value: whatsappUsers.length, icon: SmartphoneIcon, change: undefined, changeType: 'neutral' as const },
        { title: 'Banks Linked', value: 0, icon: Building, change: undefined, changeType: 'neutral' as const },
      ];

  const chartData = dashboardStats?.projectsByTeamLeader ||
    teamLeaders.map(tl => ({
      name: tl.name,
      projects: tl._count?.projects ?? tl.projects?.length ?? tl.totalProjectsInHand,
      avgCompletion: tl.workCompletionPct,
    }));

  const recentMessages = dashboardStats?.recentMessages || chatMessages.slice(0, 20);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">RMA Finance WhatsApp Bot</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Finance Project Management & WhatsApp Chatbot
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleGoogleSync} disabled={syncing}>
                {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudDownload className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Sync Sheets</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleSeed} disabled={seeding}>
                {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Reset & Sync</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              {mounted && (
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 mb-4">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <LayoutDashboard className="h-3.5 w-3.5" /><span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Building2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <FolderKanban className="h-3.5 w-3.5" /><span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="team-leaders" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /><span className="hidden sm:inline">Team Leaders</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Smartphone className="h-3.5 w-3.5" /><span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <MessageCircle className="h-3.5 w-3.5" /><span className="hidden sm:inline">Chat Logs</span>
            </TabsTrigger>
            <TabsTrigger value="bot-simulator" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Bot className="h-3.5 w-3.5" /><span className="hidden sm:inline">Bot Simulator</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Settings className="h-3.5 w-3.5" /><span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded" />}>
              <StatsCards stats={statsCards} loading={loading.dashboard} />
            </Suspense>

            {syncLogs.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CloudDownload className="h-4 w-4 text-emerald-600" />Google Sheets Sync Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {syncLogs.slice(0, 3).map(log => (
                      <Badge key={log.id} variant={log.status === 'success' ? 'default' : 'outline'}
                        className={`text-xs ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {log.status === 'success' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                        {log.sheetName} - {log.recordsSynced} records
                      </Badge>
                    ))}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />Last: {new Date(syncLogs[0].syncAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Suspense fallback={<Card className="h-64 animate-pulse" />}>
                <ProjectChart data={chartData} loading={loading.dashboard} />
              </Suspense>
              <Suspense fallback={<Card className="h-64 animate-pulse" />}>
                <RecentChats messages={recentMessages} loading={loading.chatMessages} />
              </Suspense>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Completed', count: projects.filter(p => p.completionPct >= 100).length, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
                { label: 'In Progress', count: projects.filter(p => p.completionPct > 0 && p.completionPct < 100).length, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                { label: 'Not Started', count: projects.filter(p => p.completionPct === 0).length, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400' },
                { label: 'Total Loan', count: `₹${projects.reduce((s, p) => s + p.totalLoanAmount, 0).toFixed(1)} Cr`, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
              ].map(item => (
                <Card key={item.label} className="border-border/50 p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{item.count}</p>
                    <Badge className={`mt-1 text-xs ${item.color}`}>{item.label}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded" />}>
              <ClientTable clients={clients} loading={loading.clients} onRefresh={fetchClients} />
            </Suspense>
          </TabsContent>

          <TabsContent value="projects">
            <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded" />}>
              <ProjectTable projects={projects} clients={clients} teamLeaders={teamLeaders} loading={loading.projects} onRefresh={fetchProjects} />
            </Suspense>
          </TabsContent>

          <TabsContent value="team-leaders">
            <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded" />}>
              <LeaderCards leaders={teamLeaders} loading={loading.teamLeaders} onRefresh={fetchTeamLeaders} />
            </Suspense>
          </TabsContent>

          <TabsContent value="whatsapp">
            <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded" />}>
              <UserTable users={whatsappUsers} clients={clients} teamLeaders={teamLeaders} loading={loading.whatsappUsers} onRefresh={fetchWhatsappUsers} />
            </Suspense>
          </TabsContent>

          <TabsContent value="chat">
            <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded" />}>
              <ChatLog messages={chatMessages} users={whatsappUsers} loading={loading.chatMessages} onRefresh={fetchChatMessages} />
            </Suspense>
          </TabsContent>

          <TabsContent value="bot-simulator">
            <WhatsAppBotSimulator />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-4">
              <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded" />}>
                <VercelDeployGuide />
              </Suspense>
              <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded" />}>
                <MaytapiConfigForm />
              </Suspense>
              <GoogleSheetsSyncCard syncing={syncing} onSync={handleGoogleSync} syncLogs={syncLogs} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-card/80 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Powered by <span className="font-semibold text-emerald-600">RMA Finance</span> × <span className="font-semibold">Maytapi</span>
            </p>
            <Badge variant="outline" className="text-[10px]">WhatsApp Bot v2.0</Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── WhatsApp Bot Simulator Component ───
function WhatsAppBotSimulator() {
  const [messages, setMessages] = useState<Array<{ text: string; sender: 'user' | 'bot'; timestamp: Date }>>([
    { text: '👋 Welcome to RMA Finance WhatsApp Bot!\n\nPlease register to get started:\nREGISTER <name> <role>\n\nExample: REGISTER Rahul client', sender: 'bot', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || processing) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, sender: 'user', timestamp: new Date() }]);
    setProcessing(true);
    try {
      const response = await fetch('/api/bot-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, phone: '919999999999' }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { text: data.response || 'Sorry, something went wrong.', sender: 'bot', timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { text: '❌ Failed to get response. Make sure the server is running.', sender: 'bot', timestamp: new Date() }]);
    } finally { setProcessing(false); }
  }, [input, processing]);

  return (
    <Card className="border-border/50 max-w-lg mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-4 w-4 text-emerald-600" />WhatsApp Bot Simulator
        </CardTitle>
        <p className="text-xs text-muted-foreground">Test your WhatsApp bot conversations here</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 overflow-y-auto p-4 space-y-3 bg-muted/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-card border rounded-bl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {processing && (
            <div className="flex justify-start">
              <div className="bg-card border rounded-lg rounded-bl-none p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="border-t p-3 flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message... (e.g., REGISTER Rahul client)"
            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={processing} />
          <Button onClick={sendMessage} disabled={processing || !input.trim()} size="sm" className="bg-emerald-600 hover:bg-emerald-700">Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Google Sheets Sync Card ───
function GoogleSheetsSyncCard({ syncing, onSync, syncLogs }: { syncing: boolean; onSync: () => void; syncLogs: SyncLog[] }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CloudDownload className="h-4 w-4 text-emerald-600" />Google Sheets Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">RAW DATA</p>
            <Badge variant="outline" className="text-xs">Client & Project Data</Badge>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">RAW DATA2</p>
            <Badge variant="outline" className="text-xs">Bank Details</Badge>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">NEW DASH</p>
            <Badge variant="outline" className="text-xs">Project Steps & Completion</Badge>
          </div>
        </div>
        <Button onClick={onSync} disabled={syncing} className="w-full bg-emerald-600 hover:bg-emerald-700">
          {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CloudDownload className="h-4 w-4 mr-2" />}
          Sync All Google Sheets
        </Button>
        {syncLogs.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground">Recent Sync History:</p>
            {syncLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between text-xs border-b pb-1">
                <span className="flex items-center gap-1">
                  {log.status === 'success' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertCircle className="h-3 w-3 text-amber-500" />}
                  {log.sheetName}
                </span>
                <span className="text-muted-foreground">{log.recordsSynced} records · {new Date(log.syncAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
