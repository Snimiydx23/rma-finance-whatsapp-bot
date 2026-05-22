'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Project, Client, TeamLeader, projectsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProjectFormProps {
  open: boolean;
  project?: Project | null;
  clients: Client[];
  teamLeaders: TeamLeader[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectForm({ open, project, clients, teamLeaders, onClose, onSuccess }: ProjectFormProps) {
  const isEdit = !!project;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    clientId: project?.clientId || '',
    projectName: project?.projectName || '',
    proposalType: project?.proposalType || '',
    teamLeaderId: project?.teamLeaderId || '',
    teamEngaged: project?.teamEngaged || '',
    totalLoanAmount: project?.totalLoanAmount?.toString() || '0',
    ccAmt: project?.ccAmt?.toString() || '0',
    termLoanAmt: project?.termLoanAmt?.toString() || '0',
    bgAmt: project?.bgAmt?.toString() || '0',
    lcAmt: project?.lcAmt?.toString() || '0',
    odAmt: project?.odAmt?.toString() || '0',
    lapAmt: project?.lapAmt?.toString() || '0',
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      return;
    }
    setForm({
      clientId: project?.clientId || '',
      projectName: project?.projectName || '',
      proposalType: project?.proposalType || '',
      teamLeaderId: project?.teamLeaderId || '',
      teamEngaged: project?.teamEngaged || '',
      totalLoanAmount: project?.totalLoanAmount?.toString() || '0',
      ccAmt: project?.ccAmt?.toString() || '0',
      termLoanAmt: project?.termLoanAmt?.toString() || '0',
      bgAmt: project?.bgAmt?.toString() || '0',
      lcAmt: project?.lcAmt?.toString() || '0',
      odAmt: project?.odAmt?.toString() || '0',
      lapAmt: project?.lapAmt?.toString() || '0',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.projectName) {
      toast.error('Client and Project Name are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        totalLoanAmount: parseFloat(form.totalLoanAmount) || 0,
        ccAmt: parseFloat(form.ccAmt) || 0,
        termLoanAmt: parseFloat(form.termLoanAmt) || 0,
        bgAmt: parseFloat(form.bgAmt) || 0,
        lcAmt: parseFloat(form.lcAmt) || 0,
        odAmt: parseFloat(form.odAmt) || 0,
        lapAmt: parseFloat(form.lapAmt) || 0,
        teamLeaderId: form.teamLeaderId || undefined,
      };

      if (isEdit) {
        await projectsApi.update(project!.id, payload);
        toast.success('Project updated successfully');
      } else {
        await projectsApi.create(payload);
        toast.success('Project created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'Add New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={form.clientId} onValueChange={(v) => updateField('clientId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team Leader</Label>
              <Select value={form.teamLeaderId} onValueChange={(v) => updateField('teamLeaderId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leader" />
                </SelectTrigger>
                <SelectContent>
                  {teamLeaders.map((tl) => (
                    <SelectItem key={tl.id} value={tl.id}>
                      {tl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              value={form.projectName}
              onChange={(e) => updateField('projectName', e.target.value)}
              placeholder="e.g. CC Enhancement"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="proposalType">Proposal Type</Label>
              <Input
                id="proposalType"
                value={form.proposalType}
                onChange={(e) => updateField('proposalType', e.target.value)}
                placeholder="e.g. Fresh, Enhance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamEngaged">Team Engaged</Label>
              <Input
                id="teamEngaged"
                value={form.teamEngaged}
                onChange={(e) => updateField('teamEngaged', e.target.value)}
                placeholder="e.g. I - Danish Sir"
              />
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-3">Financial Details (in Cr)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="totalLoanAmount">Total Loan Amount</Label>
                <Input
                  id="totalLoanAmount"
                  type="number"
                  step="0.01"
                  value={form.totalLoanAmount}
                  onChange={(e) => updateField('totalLoanAmount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ccAmt">CC Amount</Label>
                <Input
                  id="ccAmt"
                  type="number"
                  step="0.01"
                  value={form.ccAmt}
                  onChange={(e) => updateField('ccAmt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="termLoanAmt">Term Loan</Label>
                <Input
                  id="termLoanAmt"
                  type="number"
                  step="0.01"
                  value={form.termLoanAmt}
                  onChange={(e) => updateField('termLoanAmt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bgAmt">BG Amount</Label>
                <Input
                  id="bgAmt"
                  type="number"
                  step="0.01"
                  value={form.bgAmt}
                  onChange={(e) => updateField('bgAmt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lcAmt">LC Amount</Label>
                <Input
                  id="lcAmt"
                  type="number"
                  step="0.01"
                  value={form.lcAmt}
                  onChange={(e) => updateField('lcAmt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odAmt">OD Amount</Label>
                <Input
                  id="odAmt"
                  type="number"
                  step="0.01"
                  value={form.odAmt}
                  onChange={(e) => updateField('odAmt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lapAmt">LAP Amount</Label>
                <Input
                  id="lapAmt"
                  type="number"
                  step="0.01"
                  value={form.lapAmt}
                  onChange={(e) => updateField('lapAmt', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
