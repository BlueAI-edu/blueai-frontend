import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scriptPath } from '@/hooks/useBatchNav';

export default function BatchScriptNav({ batchId, position, total, prev, next, busy = false, isDirty = false }) {
  const navigate = useNavigate();
  if (!batchId || total < 1) return null;

  const go = (script) => {
    if (isDirty && !window.confirm('You have unsaved changes on this script. Leave without saving them?')) return;
    navigate(scriptPath(script, batchId), { replace: true });
  };
  const pct = Math.round((position / total) * 100);
  return (
    <nav
      aria-label="Script navigation"
      className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Button
          variant="outline"
          disabled={!prev || busy}
          onClick={() => go(prev)}
          aria-label={prev ? `Previous script: ${prev.student_name}` : 'No previous script'}
          className="h-12 justify-start gap-2 border-slate-300 px-3 sm:min-w-[11rem]"
        >
          <ChevronLeft className="h-5 w-5 shrink-0" />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Previous</span>
            <span className="hidden max-w-[8rem] truncate text-sm font-semibold text-slate-900 sm:block">
              {prev ? prev.student_name : '—'}
            </span>
          </span>
        </Button>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900">
            Script {position} of {total}
          </span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200 sm:w-48" aria-hidden="true">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <Button
          disabled={!next || busy}
          onClick={() => go(next)}
          aria-label={next ? `Next script: ${next.student_name}` : 'No next script'}
          className="h-12 justify-end gap-2 bg-blue-600 px-3 text-white hover:bg-blue-700 sm:min-w-[11rem]"
        >
          <span className="flex flex-col items-end leading-tight">
            <span className="text-[11px] font-medium uppercase tracking-wide text-blue-100">Next</span>
            <span className="hidden max-w-[8rem] truncate text-sm font-semibold sm:block">
              {next ? next.student_name : '—'}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0" />
        </Button>
      </div>
    </nav>
  );
}