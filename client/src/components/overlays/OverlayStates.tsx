import { motion } from "framer-motion";
import { AlertTriangle, Database, Loader2, RefreshCw, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OverlayLoadingSkeletonProps {
  width: number | string;
  height: number | string;
}

export function OverlayLoadingSkeleton({ width, height }: OverlayLoadingSkeletonProps) {
  const widthValue = typeof width === 'number' ? `${width}%` : width;
  const heightValue = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className="flex items-center justify-center bg-card"
      style={{ width: widthValue, height: heightValue }}
      role="status"
      aria-label="Loading overlay content"
      data-testid="overlay-loading"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-12 h-12 text-primary" data-testid="icon-loading-spinner" />
      </motion.div>
    </div>
  );
}

interface OverlayErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  width: number | string;
  height: number | string;
  source?: string;
  endpoint?: string;
  expectedData?: string;
  databaseInfo?: string;
}

export function OverlayErrorState({ 
  error, 
  onRetry, 
  width, 
  height, 
  source,
  endpoint,
  expectedData,
  databaseInfo,
}: OverlayErrorStateProps) {
  const widthValue = typeof width === 'number' ? `${width}%` : width;
  const heightValue = typeof height === 'number' ? `${height}px` : height;
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 bg-card p-6"
      style={{ width: widthValue, height: heightValue }}
      role="alert"
      aria-live="assertive"
      data-testid="overlay-error"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <AlertTriangle 
          className="w-16 h-16 text-destructive" 
          data-testid="icon-error-alert"
        />
      </motion.div>

      <div className="flex flex-col items-center gap-2 text-center max-w-md">
        {source && (
          <p className="text-sm text-muted-foreground" data-testid="text-error-source">
            {source}
          </p>
        )}
        <p className="text-lg font-semibold text-destructive" data-testid="text-error-message">
          {errorMessage}
        </p>
        {endpoint && (
          <p style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7, wordBreak: 'break-all' }}>
            Endpoint: {endpoint}
          </p>
        )}
        {expectedData && (
          <p style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}>
            Expected: {expectedData}
          </p>
        )}
        {databaseInfo && (
          <p style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}>
            Database: {databaseInfo}
          </p>
        )}
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="destructive"
          size="default"
          className="gap-2"
          data-testid="button-retry"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      )}
    </div>
  );
}

interface OverlayEmptyStateProps {
  message?: string;
  width: number | string;
  height: number | string;
}

export function OverlayEmptyState({ 
  message = "No data available", 
  width, 
  height 
}: OverlayEmptyStateProps) {
  const widthValue = typeof width === 'number' ? `${width}%` : width;
  const heightValue = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 bg-card"
      style={{ width: widthValue, height: heightValue }}
      data-testid="overlay-empty"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Database 
          className="w-16 h-16 text-muted-foreground" 
          data-testid="icon-empty-database"
        />
      </motion.div>

      <p className="text-base text-muted-foreground" data-testid="text-empty-message">
        {message}
      </p>
    </div>
  );
}

interface OverlayCachedDataBadgeProps {
  timestamp: number;
  source: 'cache';
}

export function OverlayCachedDataBadge({ timestamp }: OverlayCachedDataBadgeProps) {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <div className="absolute top-4 right-4 z-10" data-testid="badge-cached-data">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Badge 
          variant="outline" 
          className="bg-yellow-500/20 border-yellow-500/50 text-yellow-600 dark:text-yellow-400 gap-1.5"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="font-semibold">Cached</span>
          <span className="opacity-80">• {timeAgo}</span>
        </Badge>
      </motion.div>
    </div>
  );
}

interface OverlaySourceBadgeProps {
  source: 'thefishy' | 'fbref' | 'cache' | 'none' | 'database';
  timestamp?: number;
}

export function OverlaySourceBadge({ source, timestamp }: OverlaySourceBadgeProps) {
  if (source === 'none') return null;

  const sourceConfig = {
    thefishy: {
      label: 'The Fishy',
      color: 'bg-green-500/20 border-green-500/50 text-green-600 dark:text-green-400',
      dotColor: 'bg-green-500'
    },
    fbref: {
      label: 'FBRef',
      color: 'bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-400',
      dotColor: 'bg-blue-500'
    },
    cache: {
      label: 'Cache',
      color: 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400',
      dotColor: 'bg-amber-500'
    },
    database: {
      label: 'Database',
      color: 'bg-purple-500/20 border-purple-500/50 text-purple-600 dark:text-purple-400',
      dotColor: 'bg-purple-500'
    }
  };

  const config = sourceConfig[source] || sourceConfig['database'];
  const timeAgo = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) : null;

  return (
    <div className="absolute bottom-4 right-4 z-10" data-testid={`badge-source-${source}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Badge 
          variant="outline" 
          className={`${config.color} gap-1.5`}
        >
          <span className={`inline-block w-2 h-2 rounded-full ${config.dotColor}`} />
          <span className="font-semibold">{config.label}</span>
          {timeAgo && <span className="opacity-80">• {timeAgo}</span>}
        </Badge>
      </motion.div>
    </div>
  );
}