import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Building2,
  Briefcase,
  GitBranch,
  Clock,
  Plus,
  Upload,
  Eye,
  Download,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDashboardStats, getRecentVersions, addCompany, addResume, findOrCreateCompanyProfile, addRole, addVersion } from '@/lib/db';
import type { DashboardStats, Version, Company, Resume, Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { FilePreviewDialog } from '@/components/version/FilePreviewDialog';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export default function Dashboard() {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const refreshKey = useAppStore((s) => s.refreshKey);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVersions, setRecentVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  // Create company dialog
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyCareerPage, setCompanyCareerPage] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [companyNotes, setCompanyNotes] = useState('');
  const [companyColor, setCompanyColor] = useState(COLORS[0]);

  // Resume upload within company flow
  const [uploadStep, setUploadStep] = useState<'details' | 'resume'>('details');
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeLabel, setResumeLabel] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, versionsData] = await Promise.all([
          getDashboardStats(),
          getRecentVersions(5)
        ]);
        setStats(statsData);
        setRecentVersions(versionsData);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshKey]);

  const resetCompanyForm = () => {
    setCompanyName('');
    setCompanyWebsite('');
    setCompanyCareerPage('');
    setCompanyIndustry('');
    setCompanyLocation('');
    setCompanyNotes('');
    setCompanyColor(COLORS[0]);
    setUploadStep('details');
    setCreatedCompanyId(null);
    setResumeFile(null);
    setResumeLabel('');
    setRoleTitle('');
    setVersionNotes('');
  };

  const handleCreateCompany = async () => {
    if (!companyName.trim()) return;
    try {
      const newCompany: Company = {
        id: crypto.randomUUID(),
        name: companyName.trim(),
        logo: '',
        website: companyWebsite.trim(),
        careerPage: companyCareerPage.trim(),
        industry: companyIndustry.trim(),
        location: companyLocation.trim(),
        notes: companyNotes.trim(),
        color: companyColor,
        createdAt: new Date(),
      };
      await addCompany(newCompany);
      setCreatedCompanyId(newCompany.id);
      setUploadStep('resume');
      triggerRefresh();
      toast.success(`${newCompany.name} created! Now upload a resume.`);
    } catch {
      toast.error('Failed to create company');
    }
  };

  const handleUploadResume = async () => {
    if (!createdCompanyId || !resumeFile || !roleTitle.trim()) return;
    try {
      // Create a new resume bucket for this
      const resume: Resume = {
        id: crypto.randomUUID(),
        name: resumeLabel.trim() || `Resume for ${companyName}`,
        category: 'general',
        description: '',
        tags: [],
        color: companyColor,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await addResume(resume);

      // Link to company
      const profile = await findOrCreateCompanyProfile(resume.id, createdCompanyId);

      // Create a role
      const role: Role = {
        id: crypto.randomUUID(),
        companyProfileId: profile.id,
        title: roleTitle.trim(),
        jobUrl: '',
        status: 'draft',
        notes: '',
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await addRole(role);

      // Create v1
      const version: Version = {
        id: crypto.randomUUID(),
        roleId: role.id,
        versionNumber: 1,
        title: 'Initial version',
        summary: versionNotes.trim() || 'Uploaded from dashboard',
        fileData: resumeFile,
        fileName: resumeFile.name,
        fileType: resumeFile.type,
        fileSize: resumeFile.size,
        previousVersionId: null,
        isCurrent: true,
        createdAt: new Date(),
      };
      await addVersion(version);

      triggerRefresh();
      toast.success('Resume uploaded and linked!');
      setCreateCompanyOpen(false);
      resetCompanyForm();
    } catch {
      toast.error('Failed to upload resume');
    }
  };

  const handleSkipUpload = () => {
    setCreateCompanyOpen(false);
    resetCompanyForm();
    toast.info('Company created. You can add resumes later.');
  };

  const handlePreview = (version: Version) => {
    setPreviewVersion(version);
  };

  const handleDownload = (version: Version) => {
    try {
      const blob = version.fileData instanceof ArrayBuffer ? new Blob([version.fileData]) : version.fileData;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = version.fileName || `resume-v${version.versionNumber}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <span className="animate-pulse text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  const isAllZero = stats && stats.totalResumes === 0 && stats.totalCompanies === 0 && stats.totalRoles === 0 && stats.totalVersions === 0;

  if (isAllZero) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in space-y-6">
        <div className="bg-primary/10 p-6 rounded-full mb-4">
          <FileText className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Welcome to ResumeGit</h2>
        <p className="text-muted-foreground max-w-md">
          Start by creating a company profile and uploading your tailored resume. ResumeGit helps you track which resume was sent where.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setCreateCompanyOpen(true)}
            size="lg"
            className="gap-2"
          >
            <Building2 className="h-5 w-5" />
            Create Company Profile
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/resumes" className="gap-2">
              <FileText className="h-5 w-5" />
              Go to Resume Vault
            </Link>
          </Button>
        </div>

        {/* Create Company Dialog */}
        {renderCreateCompanyDialog()}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 [&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-4 [&>*]:duration-500 stagger-children">
        <div className="glass-card p-6 flex flex-col rounded-xl">
          <FileText className="h-6 w-6 text-muted-foreground mb-4" />
          <span className="text-3xl font-bold">{stats?.totalResumes || 0}</span>
          <span className="text-sm text-muted-foreground">Total Resumes</span>
        </div>
        <div className="glass-card p-6 flex flex-col rounded-xl">
          <Building2 className="h-6 w-6 text-muted-foreground mb-4" />
          <span className="text-3xl font-bold">{stats?.totalCompanies || 0}</span>
          <span className="text-sm text-muted-foreground">Total Companies</span>
        </div>
        <div className="glass-card p-6 flex flex-col rounded-xl">
          <Briefcase className="h-6 w-6 text-muted-foreground mb-4" />
          <span className="text-3xl font-bold">{stats?.totalRoles || 0}</span>
          <span className="text-sm text-muted-foreground">Total Roles</span>
        </div>
        <div className="glass-card p-6 flex flex-col rounded-xl">
          <GitBranch className="h-6 w-6 text-muted-foreground mb-4" />
          <span className="text-3xl font-bold">{stats?.totalVersions || 0}</span>
          <span className="text-sm text-muted-foreground">Total Versions</span>
        </div>
      </div>

      {/* Recent Uploads with Preview */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Recent Uploads
        </h3>
        <div className="space-y-3">
          {recentVersions.length === 0 ? (
            <div className="glass-card p-8 rounded-xl text-center text-muted-foreground text-sm">
              No recent uploads found. Create a company profile to get started.
            </div>
          ) : (
            recentVersions.map((v) => (
              <div key={v.id} className="glass-card p-4 rounded-xl transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        v{v.versionNumber} — {v.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {v.fileName || 'Unknown File'} · {v.summary || 'No summary'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {v.fileType === 'application/pdf' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handlePreview(v)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Preview
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDownload(v)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </Button>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setCreateCompanyOpen(true)}
            className="border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all rounded-xl p-4 flex items-center gap-3 cursor-pointer group text-left"
          >
            <div className="bg-muted group-hover:bg-primary/10 p-2 rounded-lg transition-colors">
              <Building2 className="h-5 w-5 text-foreground group-hover:text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">New Company Profile</p>
              <p className="text-xs text-muted-foreground">Add details & upload resume</p>
            </div>
          </button>
          <Link to="/resumes" className="border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all rounded-xl p-4 flex items-center gap-3 cursor-pointer group">
            <div className="bg-muted group-hover:bg-primary/10 p-2 rounded-lg transition-colors">
              <FileText className="h-5 w-5 text-foreground group-hover:text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Resume Vault</p>
              <p className="text-xs text-muted-foreground">Manage all resumes</p>
            </div>
          </Link>
          <Link to="/companies" className="border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all rounded-xl p-4 flex items-center gap-3 cursor-pointer group">
            <div className="bg-muted group-hover:bg-primary/10 p-2 rounded-lg transition-colors">
              <Briefcase className="h-5 w-5 text-foreground group-hover:text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">All Companies</p>
              <p className="text-xs text-muted-foreground">View company profiles</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Create Company Dialog */}
      {renderCreateCompanyDialog()}

      {/* PDF Preview Dialog */}
      {previewVersion && (
        <FilePreviewDialog
          version={previewVersion}
          isOpen={!!previewVersion}
          onClose={() => setPreviewVersion(null)}
        />
      )}
    </div>
  );

  // ─── Create Company Dialog (multi-step) ────────────────────────
  function renderCreateCompanyDialog() {
    return (
      <Dialog
        open={createCompanyOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateCompanyOpen(false);
            resetCompanyForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          {uploadStep === 'details' ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Create Company Profile
                </DialogTitle>
                <DialogDescription>
                  Add a company you're targeting. You'll be able to upload a resume next.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Company Name *</label>
                  <Input
                    placeholder="e.g. Google"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Industry</label>
                    <Input
                      placeholder="e.g. Technology"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Location</label>
                    <Input
                      placeholder="e.g. Mountain View, CA"
                      value={companyLocation}
                      onChange={(e) => setCompanyLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Website</label>
                    <Input
                      placeholder="https://..."
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Career Page</label>
                    <Input
                      placeholder="https://careers..."
                      value={companyCareerPage}
                      onChange={(e) => setCompanyCareerPage(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Notes</label>
                  <Textarea
                    placeholder="Anything to remember about this company..."
                    value={companyNotes}
                    onChange={(e) => setCompanyNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCompanyColor(c)}
                        className="w-7 h-7 rounded-full transition-all flex items-center justify-center"
                        style={{
                          backgroundColor: c,
                          outline: companyColor === c ? '2px solid currentColor' : 'none',
                          outlineOffset: '2px',
                        }}
                      >
                        {companyColor === c && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setCreateCompanyOpen(false); resetCompanyForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCompany} disabled={!companyName.trim()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create & Upload Resume
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Resume for {companyName}
                </DialogTitle>
                <DialogDescription>
                  Upload the tailored PDF or DOCX resume for this company.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Role / Position *</label>
                  <Input
                    placeholder="e.g. Software Engineer"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Resume Label</label>
                  <Input
                    placeholder={`e.g. ${companyName} SDE Resume`}
                    value={resumeLabel}
                    onChange={(e) => setResumeLabel(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Resume File *</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                      resumeFile
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border hover:border-primary/30 hover:bg-muted/50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                    {resumeFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{resumeFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(resumeFile.size / 1024).toFixed(1)} KB · {resumeFile.type || 'Unknown type'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 ml-2"
                          onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to select a <strong>PDF</strong> or <strong>DOCX</strong> file
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Notes</label>
                  <Textarea
                    placeholder="What's special about this version?"
                    value={versionNotes}
                    onChange={(e) => setVersionNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="ghost" onClick={handleSkipUpload} className="sm:mr-auto">
                  Skip for now
                </Button>
                <Button variant="outline" onClick={() => setUploadStep('details')}>
                  Back
                </Button>
                <Button onClick={handleUploadResume} disabled={!resumeFile || !roleTitle.trim()}>
                  <Upload className="w-4 h-4 mr-1" />
                  Upload & Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }
}
