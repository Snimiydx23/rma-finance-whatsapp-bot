'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectStep, ProjectBank } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepTrackerProps {
  steps: ProjectStep[];
  banks?: ProjectBank[];
  projectId: string;
  onStepUpdate?: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  done: { color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle2, label: 'Done' },
  in_process: { color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock, label: 'In Process' },
  pending: { color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/30', icon: Clock, label: 'Pending' },
  na: { color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: XCircle, label: 'N/A' },
};

// Step categories for grouping
const STEP_CATEGORIES = {
  checklist: { label: '📝 Checklist', range: [1, 6] },
  processing: { label: '⚙️ Processing', range: [7, 15] },
  disbursement: { label: '🏦 Disbursement', range: [16, 19] },
};

function categorizeStep(stepNumber: number): string {
  for (const [key, cat] of Object.entries(STEP_CATEGORIES)) {
    if (stepNumber >= cat.range[0] && stepNumber <= cat.range[1]) return key;
  }
  return 'processing';
}

export function StepTracker({ steps, banks, projectId, onStepUpdate }: StepTrackerProps) {
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const handleStatusChange = async (stepId: string, newStatus: string) => {
    if (stepId.startsWith('new-')) return;
    setUpdatingStep(stepId);
    try {
      const { stepsAPI } = await import('@/lib/api');
      await stepsAPI.update(stepId, { status: newStatus });
      toast.success('Step status updated');
      onStepUpdate?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update step');
    } finally {
      setUpdatingStep(null);
    }
  };

  const doneCount = steps.filter((s) => s.status === 'done').length;
  const totalSteps = steps.filter((s) => s.status !== 'na').length || steps.length;
  const pct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  // Group steps by category
  const groupedSteps: Record<string, ProjectStep[]> = { checklist: [], processing: [], disbursement: [] };
  steps.forEach(step => {
    const cat = categorizeStep(step.stepNumber);
    groupedSteps[cat].push(step);
  });

  return (
    <div className="border-t bg-muted/30">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between p-3 h-auto"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xs font-medium text-muted-foreground">
          Project Steps ({doneCount}/{totalSteps} complete - {pct}%)
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Progress Bar */}
            <div className="px-4 pb-2">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Step Categories */}
            {Object.entries(STEP_CATEGORIES).map(([key, cat]) => {
              const categorySteps = groupedSteps[key] || [];
              if (categorySteps.length === 0) return null;

              return (
                <div key={key} className="px-4 pb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{cat.label}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {categorySteps.map((step) => {
                      const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
                      const Icon = config.icon;
                      const isUpdating = updatingStep === step.id;

                      return (
                        <div
                          key={step.id}
                          className={`rounded-lg border p-2.5 ${config.bgColor} transition-colors`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className={`h-3.5 w-3.5 ${config.color} ${step.status === 'in_process' ? 'animate-spin' : ''}`} />
                            <span className="text-[10px] font-medium text-muted-foreground">
                              #{step.stepNumber}
                            </span>
                            {step.dateValue && (
                              <span className="text-[10px] text-muted-foreground ml-auto">{step.dateValue}</span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium truncate mb-1.5">
                            {step.stepName}
                          </p>
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                          ) : (
                            <Select
                              value={step.status}
                              onValueChange={(val) => handleStatusChange(step.id, val)}
                              disabled={step.id.startsWith('new-')}
                            >
                              <SelectTrigger className="h-6 text-[10px] w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  <Badge className="bg-gray-100 text-gray-700 text-[10px]">Pending</Badge>
                                </SelectItem>
                                <SelectItem value="in_process">
                                  <Badge className="bg-amber-100 text-amber-700 text-[10px]">In Process</Badge>
                                </SelectItem>
                                <SelectItem value="done">
                                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Done</Badge>
                                </SelectItem>
                                <SelectItem value="na">
                                  <Badge className="bg-red-100 text-red-700 text-[10px]">N/A</Badge>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Bank Details */}
            {banks && banks.length > 0 && (
              <div className="px-4 pb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" /> Bank Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {banks.map((bank) => (
                    <div key={bank.id} className="rounded-lg border p-2.5 bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-xs font-medium truncate">{bank.bankAndBranch || bank.bankName}</p>
                      {bank.branchName && !bank.bankAndBranch && (
                        <p className="text-[10px] text-muted-foreground">Branch: {bank.branchName}</p>
                      )}
                      <p className="text-xs font-semibold mt-1">₹{bank.loanAmount.toLocaleString('en-IN')} Cr</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
