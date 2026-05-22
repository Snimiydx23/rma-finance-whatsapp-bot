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
import { Search, Plus, Pencil, Trash2, Smartphone } from 'lucide-react';
import { WhatsAppUser, Client, TeamLeader } from '@/lib/api';
import { UserForm } from './user-form';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface UserTableProps {
  users: WhatsAppUser[];
  clients: Client[];
  teamLeaders: TeamLeader[];
  loading?: boolean;
  onRefresh: () => void;
}

const ROLE_BADGES: Record<string, string> = {
  client: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  team_leader: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function UserTable({ users, clients, teamLeaders, loading, onRefresh }: UserTableProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editUser, setEditUser] = useState<WhatsAppUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<WhatsAppUser | null>(null);

  const filtered = users.filter(
    (u) =>
      u.phone.includes(search) ||
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            WhatsApp Users ({users.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
              Register
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs text-center">Role</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Registered At</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Linked To</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
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
                    {search ? 'No users match your search' : 'No WhatsApp users registered yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-sm">{user.phone}</TableCell>
                    <TableCell className="text-sm">{user.name || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-xs ${ROLE_BADGES[user.role] || ''}`}>
                        {user.role === 'team_leader' ? 'Team Leader' : user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {user.registeredAt ? format(new Date(user.registeredAt), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-sm hidden lg:table-cell">
                      {user.client?.clientName || user.teamLeader?.name || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.isRegistered ? 'default' : 'outline'} className="text-xs">
                        {user.isRegistered ? 'Active' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditUser(user)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteUser(user)}
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

      {/* Add User Dialog */}
      <UserForm
        open={showAddForm}
        clients={clients}
        teamLeaders={teamLeaders}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          onRefresh();
        }}
      />

      {/* Edit User Dialog */}
      <UserForm
        open={!!editUser}
        user={editUser}
        clients={clients}
        teamLeaders={teamLeaders}
        onClose={() => setEditUser(null)}
        onSuccess={() => {
          setEditUser(null);
          onRefresh();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete WhatsApp User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteUser?.name || deleteUser?.phone}</strong>?
              This will also delete their chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  const { whatsappUsersAPI } = await import('@/lib/api');
                  await whatsappUsersAPI.delete(deleteUser!.id);
                  onRefresh();
                } catch {
                  // handled by toast
                }
                setDeleteUser(null);
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
