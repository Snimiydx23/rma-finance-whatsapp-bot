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
import { Client, clientsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ClientFormProps {
  open: boolean;
  client?: Client | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClientForm({ open, client, onClose, onSuccess }: ClientFormProps) {
  const isEdit = !!client;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    clientCode: client?.clientCode || '',
    clientName: client?.clientName || '',
    mobileNumber: client?.mobileNumber || '',
    email: client?.email || '',
    concernedPerson: client?.concernedPerson || '',
  });

  // Reset form when client changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      return;
    }
    setForm({
      clientCode: client?.clientCode || '',
      clientName: client?.clientName || '',
      mobileNumber: client?.mobileNumber || '',
      email: client?.email || '',
      concernedPerson: client?.concernedPerson || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientCode || !form.clientName) {
      toast.error('Client Code and Name are required');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await clientsApi.update(client!.id, form);
        toast.success('Client updated successfully');
      } else {
        await clientsApi.create(form);
        toast.success('Client created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientCode">Client Code *</Label>
            <Input
              id="clientCode"
              value={form.clientCode}
              onChange={(e) => updateField('clientCode', e.target.value)}
              placeholder="e.g. HOACPL-F25F-TL01"
              disabled={isEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              value={form.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              placeholder="e.g. Hindustan Oil and Carbon Pvt Ltd"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                value={form.mobileNumber}
                onChange={(e) => updateField('mobileNumber', e.target.value)}
                placeholder="+91..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="concernedPerson">Concerned Person</Label>
            <Input
              id="concernedPerson"
              value={form.concernedPerson}
              onChange={(e) => updateField('concernedPerson', e.target.value)}
              placeholder="Contact person name"
            />
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
