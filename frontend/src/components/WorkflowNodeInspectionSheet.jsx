import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Separator,
  Badge,
  Progress
} from './ui';
import {
  BarChart2,
  Clock,
  ArrowRight,
  TrendingDown,
  Users,
  Compass,
  AlertTriangle
} from 'lucide-react';
import { useWorkflow } from '../context/WorkflowContext';

export function WorkflowNodeInspectionSheet({ nodeDetails, isOpen, onClose }) {
  const { currentWorkflow, getStepLabel } = useWorkflow();

  if (!nodeDetails) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <div className="space-y-6 pt-2">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold">
                {nodeDetails.label || getStepLabel(nodeDetails.id)}
              </SheetTitle>
              <Badge variant="outline" className="capitalize text-[11px]">
                {nodeDetails.role?.replace('_', ' ') || 'Step'}
              </Badge>
            </div>
            <SheetDescription className="text-xs">
              Step ID: <code className="text-foreground font-mono">{nodeDetails.id}</code> &middot; Workflow: <strong className="text-foreground">{currentWorkflow?.name}</strong>
            </SheetDescription>
          </SheetHeader>

          {/* Traffic & Drop-off Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Total Visits</span>
              <span className="text-xl font-bold text-foreground">
                {nodeDetails.visits?.toLocaleString() || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Drop-off Rate</span>
              <span className={`text-xl font-bold ${nodeDetails.drop_off_pct > 20 ? 'text-destructive' : 'text-foreground'}`}>
                {nodeDetails.drop_off_pct || 0}%
              </span>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Avg Dwell Time</span>
              <span className="text-xl font-bold text-foreground">
                {nodeDetails.avg_time_spent || 0}s
              </span>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card shadow-xs">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Exits Logged</span>
              <span className="text-xl font-bold text-muted-foreground">
                {nodeDetails.exit_count || 0}
              </span>
            </div>
          </div>

          <Separator />

          {/* NetworkX Centrality Analytics */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-primary" />
              NetworkX Centrality Analytics
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">PageRank Importance</span>
                  <span className="font-semibold text-primary">{nodeDetails.pagerank || 0}</span>
                </div>
                <Progress value={Math.min(100, (nodeDetails.pagerank || 0) * 450)} color="primary" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Betweenness Centrality (Choke Point)</span>
                  <span className="font-semibold text-amber-500">{nodeDetails.betweenness_centrality || 0}</span>
                </div>
                <Progress value={Math.min(100, (nodeDetails.betweenness_centrality || 0) * 180)} color="amber" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Degree Centrality</span>
                  <span className="font-semibold text-teal-500">{nodeDetails.degree_centrality || 0}</span>
                </div>
                <Progress value={Math.min(100, (nodeDetails.degree_centrality || 0) * 120)} color="teal" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Closeness Centrality</span>
                  <span className="font-semibold text-foreground">{nodeDetails.closeness_centrality || 0}</span>
                </div>
                <Progress value={Math.min(100, (nodeDetails.closeness_centrality || 0) * 100)} color="primary" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Incoming Transitions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Incoming Transitions ({nodeDetails.incoming_paths?.length || 0})
            </h4>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {nodeDetails.incoming_paths && nodeDetails.incoming_paths.length > 0 ? (
                nodeDetails.incoming_paths.map((inc, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
                    <span className="text-foreground font-medium">From {inc.label}</span>
                    <Badge variant="secondary">{inc.count} users</Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No incoming transitions (Workflow Source)</p>
              )}
            </div>
          </div>

          {/* Outgoing Transitions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Outgoing Transitions ({nodeDetails.outgoing_paths?.length || 0})
            </h4>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {nodeDetails.outgoing_paths && nodeDetails.outgoing_paths.length > 0 ? (
                nodeDetails.outgoing_paths.map((out, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
                    <span className="text-foreground font-medium">To {out.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{out.rate}%</span>
                      <Badge variant="secondary">{out.count} users</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No outgoing transitions (Workflow Sink)</p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
