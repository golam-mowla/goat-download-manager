import React from "react";
import { Terminal, Copy, Trash2 } from "lucide-react";

interface LogsTabProps {
  logs: string[];
  onClearLogs: () => void;
  onCopyLogs: () => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({
  logs,
  onClearLogs,
  onCopyLogs,
}) => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Terminal className="w-4 h-4 text-primary" />
          <span>Application Activity Logs</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCopyLogs}
            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border flex items-center gap-1.5 transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy All</span>
          </button>
          <button
            onClick={onClearLogs}
            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-destructive text-xs font-medium border border-border flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="bg-black/90 rounded-xl p-4 font-mono text-[12px] text-gray-300 h-[480px] overflow-y-auto space-y-1 border border-border shadow-inner">
        {logs.length === 0 ? (
          <p className="text-muted-foreground/60 italic">No logs generated yet.</p>
        ) : (
          logs.map((line, idx) => (
            <p key={idx} className="leading-relaxed whitespace-pre-wrap">
              {line}
            </p>
          ))
        )}
      </div>
    </div>
  );
};
