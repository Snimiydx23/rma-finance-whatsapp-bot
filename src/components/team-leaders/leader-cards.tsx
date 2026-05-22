'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Pencil, Trash2, Users, Phone } from 'lucide-react';
import { TeamLeader } from '@/lib/api';
import { LeaderForm } from './leader-form';
import { motion } from 'framer-motion';

interface LeaderCardsProps {
  leaders: TeamLeader[];
  loading?: boolean;
  onRefresh: () => void;
}

export function LeaderCards({ leaders, loading, onRefresh }: LeaderCardsProps) {
  const [editLeader, setEditLeader] = useState<TeamLeader | null>(null);
  const [deleteLeader, setDeleteLeader] = useState<TeamLeader | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          Team Leaders ({leaders.length})
        </h3>
        <Button
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Add Leader
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-2 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No team leaders yet. Add your first team leader!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaders.map((leader, idx) => (
            <motion.div
              key={leader.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">{leader.name}</h4>
                      {leader.mobileNumber && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {leader.mobileNumber}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setEditLeader(leader)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteLeader(leader)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Projects in Hand</span>
                      <Badge variant="secondary" className="text-xs">
                        {leader._count?.projects ?? leader.projects?.length ?? leader.totalProjectsInHand}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Work Completion</span>
                      <span className="font-medium">{leader.workCompletionPct.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={leader.workCompletionPct}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Leader Form */}
      <LeaderForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          onRefresh();
        }}
      />

      {/* Edit Leader Form */}
      <LeaderForm
        open={!!editLeader}
        leader={editLeader}
        onClose={() => setEditLeader(null)}
        onSuccess={() => {
          setEditLeader(null);
          onRefresh();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLeader} onOpenChange={() => setDeleteLeader(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Leader</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteLeader?.name}</strong>?
              This will unlink all their projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  const { teamLeadersApi } = await import('@/lib/api');
                  await teamLeadersApi.delete(deleteLeader!.id);
                  onRefresh();
                } catch {
                  // handled by toast
                }
                setDeleteLeader(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
