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
import { Search, Plus, Pencil, Trash2, FolderKanban, ChevronDown, ChevronRight } from 'lucide-react';
import { Project, Client, TeamLeader } from '@/lib/api';
import { ProjectForm } from './project-form';
import { StepTracker } from './step-tracker';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectTableProps {
  projects: Project[];
  clients: Client[];
  teamLeaders: TeamLeader[];
  loading?: boolean;
  onRefresh: () => void;
}

function getCompletionBadge(pct: number) {
  if (pct >= 100) return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Complete</Badge>;
  if (pct >= 50) return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">In Progress</Badge>;
  return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400">Early Stage</Badge>;
}

export function ProjectTable({ projects, clients, teamLeaders, loading, onRefresh }: ProjectTableProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = projects.filter(
    (p) =>
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      (p.client?.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.teamLeader?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.proposalType || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-emerald-600" />
            Projects ({projects.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
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
                <TableHead className="text-xs w-8"></TableHead>
                <TableHead className="text-xs">Client</TableHead>
                <TableHead className="text-xs">Project Name</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Proposal</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Team Leader</TableHead>
                <TableHead className="text-xs text-right hidden md:table-cell">Total Loan</TableHead>
                <TableHead className="text-xs text-center">Banks</TableHead>
                <TableHead className="text-xs text-center">Completion</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    {search ? 'No projects match your search' : 'No projects yet. Sync Google Sheets or add your first project!'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((project, idx) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    idx={idx}
                    expanded={expandedId === project.id}
                    onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
                    onEdit={setEditProject}
                    onDelete={setDeleteProject}
                    onRefresh={onRefresh}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add Project Dialog */}
      <ProjectForm
        open={showAddForm}
        clients={clients}
        teamLeaders={teamLeaders}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          onRefresh();
        }}
      />

      {/* Edit Project Dialog */}
      <ProjectForm
        open={!!editProject}
        project={editProject}
        clients={clients}
        teamLeaders={teamLeaders}
        onClose={() => setEditProject(null)}
        onSuccess={() => {
          setEditProject(null);
          onRefresh();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteProject?.projectName}</strong>?
              This will also delete all associated steps and bank details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  const { projectsApi } = await import('@/lib/api');
                  await projectsApi.delete(deleteProject!.id);
                  onRefresh();
                } catch {
                  // Error handled by toast
                }
                setDeleteProject(null);
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

function ProjectRow({
  project,
  idx,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onRefresh,
}: {
  project: Project;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: idx * 0.02 }}
        className="border-b transition-colors hover:bg-muted/50"
      >
        <TableCell>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onToggle}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="text-sm font-medium">
          {project.client?.clientName || '-'}
        </TableCell>
        <TableCell className="text-sm">{project.projectName}</TableCell>
        <TableCell className="text-sm hidden md:table-cell">
          <Badge variant="outline" className="text-xs">
            {project.proposalType || '-'}
          </Badge>
        </TableCell>
        <TableCell className="text-sm hidden lg:table-cell">
          {project.teamLeader?.name || '-'}
        </TableCell>
        <TableCell className="text-sm text-right hidden md:table-cell">
          ₹{project.totalLoanAmount.toFixed(2)} Cr
        </TableCell>
        <TableCell className="text-center">
          <Badge variant="outline" className="text-xs">
            {project.banks?.length || 0} banks
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-medium">{project.completionPct.toFixed(0)}%</span>
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${project.completionPct}%` }}
              />
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center">{getCompletionBadge(project.completionPct)}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(project)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(project)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </motion.tr>
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TableCell colSpan={10} className="p-0">
              <StepTracker
                steps={project.steps || []}
                banks={project.banks || []}
                projectId={project.id}
                onStepUpdate={onRefresh}
              />
            </TableCell>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
