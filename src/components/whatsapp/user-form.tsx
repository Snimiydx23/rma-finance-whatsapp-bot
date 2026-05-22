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
import { WhatsAppUser, Client, TeamLeader, whatsappUsersAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface UserFormProps {
  open: boolean;
  user?: WhatsAppUser | null;
  clients: Client[];
  teamLeaders: TeamLeader[];
  onClose: () => void;
  onSuccess: () => void;
}

export function UserForm({ open, user, clients, teamLeaders, onClose, onSuccess }: UserFormProps) {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    phone: user?.phone || '',
    name: user?.name || '',
    role: user?.role || 'client',
    clientId: user?.clientId || '',
    teamLeaderId: user?.teamLeaderId || '',
    isRegistered: user?.isRegistered ?? true,
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      return;
    }
    setForm({
      phone: user?.phone || '',
      name: user?.name || '',
      role: user?.role || 'client',
      clientId: user?.clientId || '',
      teamLeaderId: user?.teamLeaderId || '',
      isRegistered: user?.isRegistered ?? true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone) {
      toast.error('Phone number is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        clientId: form.role === 'client' ? form.clientId : undefined,
        teamLeaderId: form.role === 'team_leader' ? form.teamLeaderId : undefined,
        registeredAt: form.isRegistered ? new Date().toISOString() : undefined,
      };

      if (isEdit) {
        await whatsappUsersAPI.update(user!.id, payload);
        toast.success('WhatsApp user updated successfully');
      } else {
        await whatsappUsersAPI.create(payload);
        toast.success('WhatsApp user registered successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit WhatsApp User' : 'Register WhatsApp User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+91..."
                disabled={isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="User name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => updateField('role', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="team_leader">Team Leader</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.role === 'client' && (
            <div className="space-y-2">
              <Label>Link to Client</Label>
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
          )}

          {form.role === 'team_leader' && (
            <div className="space-y-2">
              <Label>Link to Team Leader</Label>
              <Select value={form.teamLeaderId} onValueChange={(v) => updateField('teamLeaderId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team leader" />
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
          )}

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
              {isEdit ? 'Update' : 'Register'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
