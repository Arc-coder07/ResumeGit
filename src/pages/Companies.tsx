import { useEffect, useState } from 'react';
import type React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, Trash2, ExternalLink } from 'lucide-react';
import { getCompanies, addCompany, deleteCompany } from '@/lib/db';
import type { Company } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [careerPage, setCareerPage] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCompany: Company = {
      id: crypto.randomUUID(),
      name,
      logo: '',
      website,
      careerPage,
      industry,
      location,
      notes,
      color,
      createdAt: new Date(),
    };

    try {
      await addCompany(newCompany);
      setIsDialogOpen(false);
      resetForm();
      fetchCompanies();
    } catch (error) {
      console.error('Failed to create company:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompany(id);
      fetchCompanies();
    } catch (error) {
      console.error('Failed to delete company:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setWebsite('');
    setCareerPage('');
    setIndustry('');
    setLocation('');
    setNotes('');
    setColor(COLORS[0]);
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center p-8"><span className="animate-pulse text-muted-foreground">Loading companies...</span></div>;
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Companies</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCompany} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Google" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Career Page</label>
                  <Input value={careerPage} onChange={(e) => setCareerPage(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., Technology" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Remote / NY" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about this company..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color Label</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">Save Company</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="bg-primary/10 p-6 rounded-full mb-2">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">No companies yet</h2>
          <p className="text-muted-foreground max-w-sm">Track target companies where you want to apply and manage specific resume versions for them.</p>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 mt-4">
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 [&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-4 [&>*]:duration-500 stagger-children">
          {companies.map((company) => (
            <Link key={company.id} to={`/companies/${company.id}`} className="glass-card p-5 rounded-xl flex flex-col group relative block cursor-pointer hover:bg-muted/30 transition-all">
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: company.color || COLORS[0] }}
                >
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg truncate pr-2">{company.name}</h3>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1" onClick={e => e.preventDefault()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {company.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this company and any associated roles. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(company.id); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {company.industry && <Badge variant="secondary" className="text-xs font-normal">{company.industry}</Badge>}
                    {company.location && <span className="text-xs text-muted-foreground truncate">{company.location}</span>}
                  </div>
                  
                  {company.website && (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline w-fit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>0 roles</span> {/* Placeholder for role count */}
                <span>Added {new Date(company.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
