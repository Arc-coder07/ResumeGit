import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  FileText,
  Building2,
  Briefcase,
  Plus,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Edit,
  ArrowLeft,
  Upload,
  Download,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { VersionTimeline } from '@/components/version/VersionTimeline'
import { useResume, useResumeTree, useCompanies } from '@/hooks/useData'
import { useAppStore } from '@/lib/store'
import * as db from '@/lib/db'
import type { Role, Version } from '@/types'
import { toast } from 'sonner'
import { FilePreviewDialog } from '@/components/version/FilePreviewDialog'

export default function ResumeDetail() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const { resume, loading: resumeLoading } = useResume(resumeId)
  const { tree, loading: treeLoading } = useResumeTree(resumeId)
  const { companies } = useCompanies()
  const triggerRefresh = useAppStore((s) => s.triggerRefresh)

  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())

  // Dialog states
  const [addCompanyOpen, setAddCompanyOpen] = useState(false)
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [addVersionOpen, setAddVersionOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')

  // Form states
  const [roleTitle, setRoleTitle] = useState('')
  const [roleJobUrl, setRoleJobUrl] = useState('')
  const [roleNotes, setRoleNotes] = useState('')
  const [versionTitle, setVersionTitle] = useState('')
  const [versionSummary, setVersionSummary] = useState('')
  const [selectedVersionFile, setSelectedVersionFile] = useState<File | null>(null)
  const [previewMasterOpen, setPreviewMasterOpen] = useState(false)

  const toggleCompany = (id: string) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleRole = (id: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const expandAll = () => {
    const companyIds = new Set(tree.map((c) => c.company.id))
    const roleIds = new Set(
      tree.flatMap((c) => c.roles.map((r) => r.role.id))
    )
    setExpandedCompanies(companyIds)
    setExpandedRoles(roleIds)
  }

  const handleAddCompany = async () => {
    if (!resumeId || !selectedCompanyId) return
    try {
      await db.findOrCreateCompanyProfile(resumeId, selectedCompanyId)
      triggerRefresh()
      setAddCompanyOpen(false)
      setSelectedCompanyId('')
      toast.success('Company linked')
    } catch {
      toast.error('Failed to link company')
    }
  }

  const handleAddRole = async () => {
    if (!selectedProfileId || !roleTitle.trim()) return
    try {
      const role: Role = {
        id: crypto.randomUUID(),
        companyProfileId: selectedProfileId,
        title: roleTitle.trim(),
        jobUrl: roleJobUrl.trim(),
        status: 'draft',
        notes: roleNotes.trim(),
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await db.addRole(role)
      triggerRefresh()
      setAddRoleOpen(false)
      setRoleTitle('')
      setRoleJobUrl('')
      setRoleNotes('')
      toast.success('Role added')
    } catch {
      toast.error('Failed to add role')
    }
  }

  const handleMasterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !resume) return
    try {
      await db.updateResume(resume.id, {
        masterFileData: file,
        masterFileName: file.name,
        masterFileType: file.type
      })
      triggerRefresh()
      toast.success('Master resume uploaded')
    } catch {
      toast.error('Failed to upload master resume')
    }
  }

  const handleMasterDownload = () => {
    if (!resume?.masterFileData) return
    try {
      const blob = resume.masterFileData instanceof ArrayBuffer ? new Blob([resume.masterFileData]) : resume.masterFileData
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resume.masterFileName || `${resume.name}-master`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download master resume')
    }
  }

  const handleAddVersion = async () => {
    if (!selectedRoleId || !versionSummary.trim() || !selectedVersionFile) return
    try {
      const existingVersions = await db.getVersionsByRole(selectedRoleId)
      const nextNum = existingVersions.length > 0
        ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1
        : 1

      const version: Version = {
        id: crypto.randomUUID(),
        roleId: selectedRoleId,
        versionNumber: nextNum,
        title: versionTitle.trim() || `Version ${nextNum}`,
        summary: versionSummary.trim(),
        fileData: selectedVersionFile,
        fileName: selectedVersionFile.name,
        fileType: selectedVersionFile.type,
        fileSize: selectedVersionFile.size,
        previousVersionId: existingVersions.find((v) => v.isCurrent)?.id ?? null,
        isCurrent: true,
        createdAt: new Date(),
      }

      await db.addVersion(version)
      triggerRefresh()
      setAddVersionOpen(false)
      setVersionTitle('')
      setVersionSummary('')
      setSelectedVersionFile(null)
      toast.success(`Created v${nextNum}`)
    } catch {
      toast.error('Failed to create version')
    }
  }

  if (resumeLoading || treeLoading) {
    return (
      <div className="animate-fade-in space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="animate-fade-in text-center py-20">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold">Resume not found</h2>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/resumes">Back to Library</Link>
        </Button>
      </div>
    )
  }

  const linkedCompanyIds = new Set(tree.map((c) => c.company.id))
  const availableCompanies = companies.filter((c) => !linkedCompanyIds.has(c.id))

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link to="/resumes">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Library
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: resume.color }}
            />
            <h1 className="text-2xl font-bold">{resume.name}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{resume.category}</Badge>
            {resume.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          {resume.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-lg">
              {resume.description}
            </p>
          )}

          {/* Master Resume Upload Area */}
          <div className="mt-4 p-4 border border-dashed rounded-lg bg-muted/30">
            <h3 className="text-sm font-semibold mb-2">Master Resume</h3>
            {resume.masterFileData ? (
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{resume.masterFileName}</p>
                  <p className="text-xs text-muted-foreground">Source document</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewMasterOpen(true)}>
                    <Eye className="w-4 h-4 mr-1" /> Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleMasterDownload}>
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                  <div className="relative">
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('master-upload')?.click()}>
                      Replace
                    </Button>
                    <input 
                      id="master-upload" 
                      type="file" 
                      className="hidden" 
                      onChange={handleMasterUpload} 
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Upload the original source resume for reference.</p>
                <div>
                  <Button variant="secondary" size="sm" onClick={() => document.getElementById('master-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-1" />
                    Upload Master
                  </Button>
                  <input 
                    id="master-upload" 
                    type="file" 
                    className="hidden" 
                    onChange={handleMasterUpload} 
                    accept=".pdf,.doc,.docx"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button
            size="sm"
            onClick={() => setAddCompanyOpen(true)}
            disabled={availableCompanies.length === 0 && companies.length > 0}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Company
          </Button>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Tree view */}
      {tree.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No companies linked yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Link a company to start tailoring this resume for specific roles.
          </p>
          {companies.length === 0 ? (
            <Button asChild>
              <Link to="/companies">
                <Plus className="w-4 h-4 mr-1" />
                Create a Company First
              </Link>
            </Button>
          ) : (
            <Button onClick={() => setAddCompanyOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Link Company
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {tree.map(({ company, profile, roles }) => {
            const isCompanyExpanded = expandedCompanies.has(company.id)
            const totalVersions = roles.reduce(
              (sum, r) => sum + r.versions.length,
              0
            )

            return (
              <div key={company.id} className="glass-card overflow-hidden">
                {/* Company header */}
                <button
                  onClick={() => toggleCompany(company.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left group"
                >
                  <span className="text-muted-foreground">
                    {isCompanyExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: company.color || '#6366f1' }}
                  >
                    {company.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{company.name}</span>
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {roles.length} role{roles.length !== 1 ? 's' : ''} ·{' '}
                      {totalVersions} version{totalVersions !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedProfileId(profile.id)
                      setAddRoleOpen(true)
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Role
                  </Button>
                </button>

                {/* Roles */}
                {isCompanyExpanded && (
                  <div className="border-t border-border">
                    {roles.length === 0 ? (
                      <div className="p-4 pl-16 text-sm text-muted-foreground">
                        <p>No roles yet.</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-primary"
                          onClick={() => {
                            setSelectedProfileId(profile.id)
                            setAddRoleOpen(true)
                          }}
                        >
                          Add a role
                        </Button>
                      </div>
                    ) : (
                      roles.map(({ role, versions }) => {
                        const isRoleExpanded = expandedRoles.has(role.id)
                        return (
                          <div
                            key={role.id}
                            className="border-t border-border/50 first:border-t-0"
                          >
                            <button
                              onClick={() => toggleRole(role.id)}
                              className="w-full flex items-center gap-3 p-3 pl-12 hover:bg-accent/30 transition-colors text-left group"
                            >
                              <span className="text-muted-foreground">
                                {isRoleExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </span>
                              <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm">
                                  {role.title}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {versions.length} version
                                  {versions.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {role.jobUrl && (
                                <a
                                  href={role.jobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Job Link
                                </a>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedRoleId(role.id)
                                  setAddVersionOpen(true)
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Version
                              </Button>
                            </button>

                            {isRoleExpanded && (
                              <div className="pl-20 pr-4 pb-4 pt-2 animate-fade-in">
                                {versions.length === 0 ? (
                                  <div className="text-sm text-muted-foreground">
                                    <p className="mb-2">No versions yet.</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRoleId(role.id)
                                        setAddVersionOpen(true)
                                      }}
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Create First Version
                                    </Button>
                                  </div>
                                ) : (
                                  <VersionTimeline
                                    versions={versions}
                                    roleId={role.id}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Company Dialog */}
      <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Company</DialogTitle>
            <DialogDescription>
              Choose a company to tailor this resume for.
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {availableCompanies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: c.color || '#6366f1' }}
                    >
                      {c.name[0]}
                    </div>
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCompanyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCompany} disabled={!selectedCompanyId}>
              Link Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={addRoleOpen} onOpenChange={setAddRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <DialogDescription>
              Add a new role to start tracking resume versions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role Title</label>
              <Input
                placeholder="e.g. Software Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Job URL (optional)</label>
              <Input
                placeholder="https://..."
                value={roleJobUrl}
                onChange={(e) => setRoleJobUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
              <Textarea
                placeholder="Any notes about this role..."
                value={roleNotes}
                onChange={(e) => setRoleNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRole} disabled={!roleTitle.trim()}>
              <Briefcase className="w-4 h-4 mr-1" />
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Version Dialog */}
      <Dialog open={addVersionOpen} onOpenChange={setAddVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload New Version
              </div>
            </DialogTitle>
            <DialogDescription>
              Upload a tailored PDF or DOCX file as a new version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">File *</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSelectedVersionFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title (optional)</label>
              <Input
                placeholder="e.g. Added Kubernetes experience"
                value={versionTitle}
                onChange={(e) => setVersionTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Summary *</label>
              <Textarea
                placeholder="What changed in this version?"
                value={versionSummary}
                onChange={(e) => setVersionSummary(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddVersionOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVersion} disabled={!versionSummary.trim() || !selectedVersionFile}>
              <Upload className="w-4 h-4 mr-1" />
              Upload Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Master Resume Preview */}
      {resume.masterFileData && previewMasterOpen && (
        <FilePreviewDialog
          isOpen={previewMasterOpen}
          onClose={() => setPreviewMasterOpen(false)}
          version={{
            id: 'master',
            roleId: '',
            versionNumber: 0,
            title: 'Master Resume',
            summary: 'Source document',
            fileData: resume.masterFileData,
            fileName: resume.masterFileName || `${resume.name}-master`,
            fileType: resume.masterFileType || 'application/pdf',
            fileSize: 0,
            previousVersionId: null,
            isCurrent: true,
            createdAt: resume.updatedAt,
          }}
        />
      )}
    </div>
  )
}
