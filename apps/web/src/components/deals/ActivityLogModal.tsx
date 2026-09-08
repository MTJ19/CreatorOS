import React, { useEffect, useState } from 'react';
import { X, Activity } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { dealsApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

export function ActivityLogModal({ deal, onClose }: { deal: any; onClose: () => void }) {
  const { accessToken, user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadLogs() {
      if (!accessToken) return;
      try {
        const data = await dealsApi.getActivityLogs(accessToken, deal.id);
        setLogs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [accessToken, deal.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim() || !accessToken) return;
    setSubmitting(true);
    try {
      const newLog = await dealsApi.addActivityLog(accessToken, deal.id, action.trim(), 'MANUAL');
      setLogs([{ ...newLog, user: { name: user?.firstName || 'Creator' } }, ...logs]);
      setAction('');
      toast('Activity logged successfully', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to log activity', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md animate-slide-in-right flex-col border-l border-border/60 bg-background-overlay shadow-float-lg">
        <div className="flex items-center justify-between border-b border-border/40 p-5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Activity className="h-5 w-5 text-primary" />
            Activity Log
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-foreground-muted hover:bg-background-elevated hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <form onSubmit={handleSubmit} className="mb-6 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground">
              Add Manual Entry
            </label>
            <textarea
              className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
              placeholder="Record an offline discussion, decision, or update..."
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
            <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={!action.trim()}>
              Log Activity
            </Button>
          </form>

          {loading ? (
            <div className="text-center text-sm text-foreground-muted">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-sm text-foreground-muted">No activity recorded yet.</div>
          ) : (
            <div className="space-y-4 border-l-2 border-border/40 pl-4">
              {logs.map(log => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background-overlay" />
                  <p className="text-xs text-foreground-muted mb-1">
                    {new Date(log.createdAt).toLocaleString()} • {log.user?.name || 'System'}
                  </p>
                  <p className="text-sm text-white bg-background-elevated/40 p-3 rounded-lg border border-border/60">
                    {log.action}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
