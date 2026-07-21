import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  GitCommit,
  Eye,
  RotateCcw,
  Copy,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Version } from '@/types'
import { restoreVersion, duplicateVersion } from '@/lib/db'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { FilePreviewDialog } from './FilePreviewDialog'

interface VersionTimelineProps {
  versions: Version[]
  roleId: string
  compact?: boolean
}

export function VersionTimeline({ versions, compact = false }: VersionTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<Version | null>(null)
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null)
  const triggerRefresh = useAppStore((s) => s.triggerRefresh)

  const sortedVersions = [...versions].sort(
    (a, b) => b.versionNumber - a.versionNumber
  )

  const handleRestore = async (version: Version) => {
    try {
      await restoreVersion(version.id)
      triggerRefresh()
      toast.success(`Restored to v${version.versionNumber}`)
      setRestoreTarget(null)
    } catch {
      toast.error('Failed to restore version')
    }
  }

  const handleDuplicate = async (version: Version) => {
    try {
      await duplicateVersion(version.id, version.roleId)
      triggerRefresh()
      toast.success(`Duplicated v${version.versionNumber}`)
    } catch {
      toast.error('Failed to duplicate version')
    }
  }

  const handleDownload = (version: Version) => {
    try {
      const blob = version.fileData instanceof ArrayBuffer ? new Blob([version.fileData]) : version.fileData
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = version.fileName || `resume-v${version.versionNumber}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download file')
    }
  }

  if (sortedVersions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No versions yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="relative">
        {sortedVersions.map((version, index) => {
          const isLast = index === sortedVersions.length - 1
          const isExpanded = expandedId === version.id

          return (
            <div key={version.id} className="relative flex gap-4 group">
              {/* Timeline line */}
              {!isLast && (
                <div
                  className="absolute left-[11px] top-[28px] w-[2px] bg-border"
                  style={{
                    bottom: compact ? '-8px' : '-4px',
                  }}
                />
              )}

              {/* Timeline dot */}
              <div
                className={`timeline-dot ${version.isCurrent ? 'current' : ''}`}
              >
                {version.isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>

              {/* Content */}
              <div
                className={`flex-1 pb-6 ${compact ? 'pb-4' : 'pb-6'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Version header */}
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : version.id)
                        }
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        {!compact &&
                          (isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          ))}
                        <span className="font-semibold text-sm">
                          v{version.versionNumber}
                        </span>
                      </button>

                      {version.isCurrent && (
                        <Badge
                          variant="default"
                          className="text-[10px] px-1.5 py-0 h-4 bg-success text-white border-0"
                        >
                          Current
                        </Badge>
                      )}

                      {version.title && (
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {version.title}
                        </span>
                      )}
                      
                      {version.fileName && (
                        <span className="text-xs text-muted-foreground/60 truncate max-w-[150px]">
                          ({version.fileName})
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    {version.summary && (
                      <p className="text-sm text-muted-foreground pl-0 mt-0.5 line-clamp-2">
                        {version.summary}
                      </p>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(version.createdAt), {
                        addSuffix: true,
                      })}
                    </p>

                    {/* Expanded details */}
                    {isExpanded && !compact && (
                      <div className="mt-3 flex gap-2 animate-fade-in">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setPreviewVersion(version)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleDownload(version)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>

                        {!version.isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setRestoreTarget(version)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleDuplicate(version)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Duplicate
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewVersion(version)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(version)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </DropdownMenuItem>
                      {!version.isCurrent && (
                        <DropdownMenuItem
                          onClick={() => setRestoreTarget(version)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore as Current
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(version)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Restore confirmation */}
      <AlertDialog
        open={!!restoreTarget}
        onOpenChange={() => setRestoreTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore{' '}
              <strong>v{restoreTarget?.versionNumber}</strong> as the current
              version? This won't delete any existing versions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreTarget && handleRestore(restoreTarget)}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* File Preview */}
      {previewVersion && (
        <FilePreviewDialog 
          version={previewVersion} 
          isOpen={!!previewVersion} 
          onClose={() => setPreviewVersion(null)} 
        />
      )}
    </>
  )
}
