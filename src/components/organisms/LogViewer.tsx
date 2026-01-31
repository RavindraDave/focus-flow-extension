/**
 * LogViewer Component
 * Debug UI for viewing application logs
 */

import { useState, useEffect } from 'react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { logger, LogLevel, type LogEntry } from '../../utils/logger';

const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

const LOG_LEVEL_VARIANTS: Record<LogLevel, 'info' | 'success' | 'warning' | 'error'> = {
  [LogLevel.DEBUG]: 'info',
  [LogLevel.INFO]: 'success',
  [LogLevel.WARN]: 'warning',
  [LogLevel.ERROR]: 'error',
};

export function LogViewer(): JSX.Element {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [componentFilter, setComponentFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load logs
  const loadLogs = (): void => {
    const allLogs = logger.getLogs();
    setLogs(allLogs);
  };

  // Auto-refresh logs
  useEffect(() => {
    loadLogs();

    if (autoRefresh) {
      const interval = setInterval(loadLogs, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) {
      return false;
    }
    if (componentFilter !== 'all' && log.component !== componentFilter) {
      return false;
    }
    return true;
  });

  // Get unique components
  const components = Array.from(new Set(logs.map(log => log.component)));

  // Clear logs
  const handleClear = (): void => {
    logger.clearLogs();
    loadLogs();
  };

  // Export logs
  const handleExport = (): void => {
    const data = logger.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-flow-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format timestamp
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">Debug Logs</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <Button size="sm" variant="secondary" onClick={loadLogs}>
            Refresh
          </Button>
          <Button size="sm" variant="secondary" onClick={handleExport}>
            Export
          </Button>
          <Button size="sm" variant="destructive" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700">Level:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogLevel | 'all')}
            className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm"
          >
            <option value="all">All</option>
            <option value={LogLevel.DEBUG}>Debug</option>
            <option value={LogLevel.INFO}>Info</option>
            <option value={LogLevel.WARN}>Warn</option>
            <option value={LogLevel.ERROR}>Error</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700">Component:</label>
          <select
            value={componentFilter}
            onChange={(e) => setComponentFilter(e.target.value)}
            className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm"
          >
            <option value="all">All</option>
            {components.map(component => (
              <option key={component} value={component}>
                {component}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-sm text-neutral-600">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </div>

      {/* Log List */}
      <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg h-[500px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-neutral-500 text-center py-8">
            No logs to display
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="flex gap-3 hover:bg-neutral-900/30 px-2 py-1 rounded"
              >
                {/* Timestamp */}
                <span className="text-neutral-500 flex-shrink-0">
                  {formatTime(log.timestamp)}
                </span>

                {/* Level */}
                <span
                  className={`flex-shrink-0 font-semibold ${
                    log.level === LogLevel.ERROR
                      ? 'text-red-400'
                      : log.level === LogLevel.WARN
                      ? 'text-yellow-400'
                      : log.level === LogLevel.INFO
                      ? 'text-blue-400'
                      : 'text-gray-400'
                  }`}
                >
                  {LOG_LEVEL_LABELS[log.level].padEnd(5)}
                </span>

                {/* Component */}
                <span className="text-cyan-400 flex-shrink-0">
                  [{log.component}]
                </span>

                {/* Message */}
                <span className="flex-1">{log.message}</span>

                {/* Data */}
                {log.data !== undefined && (
                  <span className="text-purple-400 text-xs">
                    {String(JSON.stringify(log.data))}
                  </span>
                )}

                {/* Error */}
                {log.error && (
                  <span className="text-red-400 text-xs">
                    {log.error.message}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Badge variant={LOG_LEVEL_VARIANTS[LogLevel.DEBUG]}>
            {logs.filter(l => l.level === LogLevel.DEBUG).length} Debug
          </Badge>
          <Badge variant={LOG_LEVEL_VARIANTS[LogLevel.INFO]}>
            {logs.filter(l => l.level === LogLevel.INFO).length} Info
          </Badge>
          <Badge variant={LOG_LEVEL_VARIANTS[LogLevel.WARN]}>
            {logs.filter(l => l.level === LogLevel.WARN).length} Warn
          </Badge>
          <Badge variant={LOG_LEVEL_VARIANTS[LogLevel.ERROR]}>
            {logs.filter(l => l.level === LogLevel.ERROR).length} Error
          </Badge>
        </div>
      </div>
    </div>
  );
}
