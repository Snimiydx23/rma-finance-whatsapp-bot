'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Client } from '@/lib/api';
import { ClientForm } from './client-form';
import { motion } from 'framer-motion';

interface ClientTableProps {
  clients: Client[];
  loading?: boolean;
  onRefresh: () => void;
}

export function ClientTable({ clients, loading, onRefresh }: ClientTableProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const filtered = clients.filter(
    (c) =>
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.clientCode.toLowerCase().includes(search.toLowerCase()) ||
      (c.mobileNumber || '').includes(search) ||
      (c.concernedPerson || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            Clients ({clients.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 w-48"
              />
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Code</TableHead>
                <TableHead className="text-xs">Client Name</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Mobile</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Email</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Concerned Person</TableHead>
                <TableHead className="text-xs text-center">Projects</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {search ? 'No clients match your search' : 'No clients yet. Add your first client!'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client, idx) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {client.clientCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{client.clientName}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{client.mobileNumber || '-'}</TableCell>
                    <TableCell className="text-sm hidden lg:table-cell">{client.email || '-'}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{client.concernedPerson || '-'}</TableCell>

                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {client._count?.projects ?? client.projects?.length ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setEditClient(client)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteClient(client)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add Client Dialog */}
      <ClientForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          onRefresh();
        }}
      />

      {/* Edit Client Dialog */}
      <ClientForm
        open={!!editClient}
        client={editClient}
        onClose={() => setEditClient(null)}
        onSuccess={() => {
          setEditClient(null);
          onRefresh();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteClient?.clientName}</strong>?
              This action cannot be undone and will also delete all associated projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  const { clientsApi } = await import('@/lib/api');
                  await clientsApi.delete(deleteClient!.id);
                  onRefresh();
                } catch {
                  // Error handled by toast in calling code
                }
                setDeleteClient(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
