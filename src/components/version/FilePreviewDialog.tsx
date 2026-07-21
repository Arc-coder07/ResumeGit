import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import type { Version } from '@/types'

interface FilePreviewDialogProps {
  version: Version
  isOpen: boolean
  onClose: () => void
}

export function FilePreviewDialog({ version, isOpen, onClose }: FilePreviewDialogProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && version.fileData) {
      const blob = version.fileData instanceof ArrayBuffer ? new Blob([version.fileData]) : version.fileData
      const url = URL.createObjectURL(blob)
      setObjectUrl(url)
      
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [isOpen, version.fileData])

  const handleDownload = () => {
    if (!objectUrl) return
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = version.fileName || `resume-v${version.versionNumber}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const isPdf = version.fileType === 'application/pdf'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-lg flex items-center gap-2">
            v{version.versionNumber} - {version.title || 'Untitled'}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({version.fileName})
            </span>
          </DialogTitle>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 relative">
          {isPdf && objectUrl ? (
            <iframe 
              src={`${objectUrl}#toolbar=0`} 
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="bg-primary/10 p-6 rounded-full mb-6">
                <FileText className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Native Preview Available</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                This file type ({version.fileType || 'Unknown'}) cannot be previewed directly in the browser yet. In-browser preview for DOCX and other formats will be available in a future update.
              </p>
              <Button onClick={handleDownload} size="lg" className="gap-2">
                <Download className="w-5 h-5" />
                Download File to View
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
