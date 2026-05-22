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
import { TeamLeader, teamLeadersApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LeaderFormProps {
  open: boolean;
  leader?: TeamLeader | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function LeaderForm({ open, leader, onClose, onSuccess }: LeaderFormProps) {
  const isEdit = !!leader;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: leader?.name || '',
    mobileNumber: leader?.mobileNumber || '',
    totalProjectsInHand: leader?.totalProjectsInHand?.toString() || '0',
    workCompletionPct: leader?.workCompletionPct?.toString() || '0',
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      return;
    }
    setForm({
      name: leader?.name || '',
      mobileNumber: leader?.mobileNumber || '',
      totalProjectsInHand: leader?.totalProjectsInHand?.toString() || '0',
      workCompletionPct: leader?.workCompletionPct?.toString() || '0',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        totalProjectsInHand: parseInt(form.totalProjectsInHand) || 0,
        workCompletionPct: parseFloat(form.workCompletionPct) || 0,
      };

      if (isEdit) {
        await teamLeadersApi.update(leader!.id, payload);
        toast.success('Team leader updated successfully');
      } else {
        await teamLeadersApi.create(payload);
        toast.success('Team leader created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save team leader');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Team Leader' : 'Add New Team Leader'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Team leader name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              value={form.mobileNumber}
              onChange={(e) => updateField('mobileNumber', e.target.value)}
              placeholder="+91..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="totalProjectsInHand">Projects in Hand</Label>
              <Input
                id="totalProjectsInHand"
                type="number"
                value={form.totalProjectsInHand}
                onChange={(e) => updateField('totalProjectsInHand', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workCompletionPct">Work Completion %</Label>
              <Input
                id="workCompletionPct"
                type="number"
                step="0.1"
                value={form.workCompletionPct}
                onChange={(e) => updateField('workCompletionPct', e.target.value)}
              />
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
