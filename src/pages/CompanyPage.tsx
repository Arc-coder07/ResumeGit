import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ExternalLink, 
  Briefcase, 
  Plus, 
  MapPin, 
  Building, 
  Globe, 
  Pencil 
} from 'lucide-react';

import type { Company, Role } from '@/types';
import { getCompany, updateCompany, addRole, findOrCreateCompanyProfile } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { useCompanyTree } from '@/hooks/useData';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { VersionTimeline } from '@/components/version/VersionTimeline';

export default function CompanyPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { tree, loading: treeLoading } = useCompanyTree(companyId || '');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Company>>({});
  
  const [newRoleDialogOpen, setNewRoleDialogOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState<{title: string, resumeId: string, jobUrl?: string}>({
    title: '',
    resumeId: '',
    jobUrl: ''
  });

  useEffect(() => {
    async function loadCompany() {
      if (!companyId) return;
      try {
        setLoading(true);
        const data = await getCompany(companyId);
        if (data) {
          setCompany(data);
          setEditForm(data);
        } else {
          toast.error("Company not found");
          navigate('/companies');
        }
      } catch (error) {
        toast.error("Failed to load company");
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, [companyId, navigate]);

  const handleUpdateCompany = async () => {
    if (!companyId || !company || !editForm.name) return;
    try {
      await updateCompany(companyId, {
        ...company,
        ...editForm,
      });
      toast.success("Company updated");
      setEditDialogOpen(false);
      triggerRefresh();
    } catch (error) {
      toast.error("Failed to update company");
    }
  };

  const handleAddRole = async () => {
    if (!companyId || !newRoleForm.title || !newRoleForm.resumeId) return;
    try {
      const profile = await findOrCreateCompanyProfile(newRoleForm.resumeId, companyId);
      const newRole: Role = {
        id: crypto.randomUUID(),
        companyProfileId: profile.id,
        title: newRoleForm.title,
        jobUrl: newRoleForm.jobUrl || '',
        status: 'draft',
        notes: '',
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await addRole(newRole);
      toast.success("Role added");
      setNewRoleDialogOpen(false);
      setNewRoleForm({ title: '', resumeId: '', jobUrl: '' });
      triggerRefresh();
    } catch (error) {
      toast.error("Failed to add role");
    }
  };

  if (loading || treeLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Separator />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link to="/companies">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-sm"
              style={{ backgroundColor: company.color || '#3b82f6' }}
            >
              {company.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="space-y-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {company.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                {company.industry && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {company.industry}
                  </Badge>
                )}
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {company.location}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2">
                {company.website && (
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {company.careerPage && (
                  <a 
                    href={company.careerPage} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Career Page
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
                  <Input 
                    value={editForm.name || ''} 
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Industry</label>
                    <Input 
                      value={editForm.industry || ''} 
                      onChange={e => setEditForm(prev => ({ ...prev, industry: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Location</label>
                    <Input 
                      value={editForm.location || ''} 
                      onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Website</label>
                    <Input 
                      value={editForm.website || ''} 
                      onChange={e => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Career Page</label>
                    <Input 
                      value={editForm.careerPage || ''} 
                      onChange={e => setEditForm(prev => ({ ...prev, careerPage: e.target.value }))}
                      placeholder="https://"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Color</label>
                  <div className="flex gap-2">
                    <Input 
                      type="color"
                      value={editForm.color || '#3b82f6'} 
                      onChange={e => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 p-1 h-9"
                    />
                    <Input 
                      value={editForm.color || '#3b82f6'} 
                      onChange={e => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Notes</label>
                  <Textarea 
                    value={editForm.notes || ''} 
                    onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateCompany}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {company.notes && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap">
            {company.notes}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <h2 className="text-xl font-bold mb-6">Resume Profiles</h2>
        
        {!tree || tree.length === 0 ? (
          <div className="text-center py-12 border rounded-lg border-dashed">
            <h3 className="text-lg font-semibold mb-2">No resumes linked</h3>
            <p className="text-muted-foreground mb-4">
              You haven't linked any resume profiles to this company yet.
            </p>
            <Button asChild>
              <Link to="/resumes">Go to Resumes</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {tree.map((profileItem: any) => (
              <div key={profileItem.resume.id} className="border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <Link 
                    to={`/resumes/${profileItem.resume.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: profileItem.resume.color || '#10b981' }}
                    />
                    <h3 className="text-lg font-bold group-hover:underline">
                      {profileItem.resume.name}
                    </h3>
                  </Link>
                  
                  <Dialog open={newRoleDialogOpen} onOpenChange={setNewRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setNewRoleForm(prev => ({ ...prev, resumeId: profileItem.resume.id }))}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Role for {profileItem.resume.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role Title</label>
                          <Input 
                            value={newRoleForm.title} 
                            onChange={e => setNewRoleForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g. Software Engineer"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Job URL (Optional)</label>
                          <Input 
                            value={newRoleForm.jobUrl || ''} 
                            onChange={e => setNewRoleForm(prev => ({ ...prev, jobUrl: e.target.value }))}
                            placeholder="https://"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewRoleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddRole}>Create Role</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {profileItem.roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No roles created for this profile yet.</p>
                ) : (
                  <div className="space-y-8">
                    {profileItem.roles.map((roleItem: any) => (
                      <div key={roleItem.role.id} className="ml-6 relative">
                        <div className="absolute -left-6 top-0 bottom-0 w-px bg-border" />
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="absolute -left-[27px] w-3 h-3 rounded-full bg-background border-2 border-primary" />
                            <Briefcase className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-lg">{roleItem.role.title}</h4>
                            {roleItem.role.jobUrl && (
                              <a 
                                href={roleItem.role.jobUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors ml-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="pl-4">
                          <VersionTimeline 
                            roleId={roleItem.role.id}
                            versions={roleItem.versions}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
