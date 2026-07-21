import { useEffect, useState } from 'react';
import type React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getResumes, getResumeStats, addResume, deleteResume } from '@/lib/db';
import type { Resume } from '@/types';

type ResumeStats = { companyCount: number; roleCount: number; versionCount: number; latestVersionDate: Date | null };
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export default function Resumes() {
  const [resumes, setResumes] = useState<(Resume & { stats?: ResumeStats })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const data = await getResumes();
      const withStats = await Promise.all(
        data.map(async (resume) => {
          const stats = await getResumeStats(resume.id);
          return { ...resume, stats };
        })
      );
      setResumes(withStats);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleCreateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) return;

    const newResume: Resume = {
      id: crypto.randomUUID(),
      name,
      category,
      description,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await addResume(newResume);
      setIsDialogOpen(false);
      resetForm();
      fetchResumes();
    } catch (error) {
      console.error('Failed to create resume:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResume(id);
      fetchResumes();
    } catch (error) {
      console.error('Failed to delete resume:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setDescription('');
    setTags('');
    setColor(COLORS[0]);
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center p-8"><span className="animate-pulse text-muted-foreground">Loading resumes...</span></div>;
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resume Library</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Resume
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Resume</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateResume} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Senior Frontend Developer" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Stack">Full Stack</SelectItem>
                    <SelectItem value="Frontend">Frontend</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="AI/ML">AI/ML</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this base resume..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="React, Node.js, UI/UX" />
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
              <Button type="submit" className="w-full">Create Resume</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="bg-primary/10 p-6 rounded-full mb-2">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">No resumes yet</h2>
          <p className="text-muted-foreground max-w-sm">Create your first base resume to start tracking versions and tailoring for different roles.</p>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 mt-4">
            <Plus className="h-4 w-4" />
            Create Resume
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 [&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-4 [&>*]:duration-500 stagger-children">
          {resumes.map((resume) => (
            <Link key={resume.id} to={`/resumes/${resume.id}`} className="glass-card rounded-xl overflow-hidden hover:ring-1 hover:ring-primary/50 transition-all flex flex-col group relative block cursor-pointer">
              <div className="h-1 w-full" style={{ backgroundColor: resume.color || COLORS[0] }} />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1 pr-6">{resume.name}</h3>
                  
                  <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1" onClick={e => e.preventDefault()}>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {resume.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this resume and all its versions. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(resume.id); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="mb-3">
                  <Badge variant="secondary" className="text-xs">{resume.category}</Badge>
                </div>
                
                {resume.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {resume.description}
                  </p>
                )}
                
                {resume.tags && resume.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {resume.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] py-0 h-5">{tag}</Badge>
                    ))}
                    {resume.tags.length > 3 && (
                      <Badge variant="outline" className="text-[10px] py-0 h-5">+{resume.tags.length - 3}</Badge>
                    )}
                  </div>
                )}
                
                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{resume.stats?.versionCount || 0} versions · {resume.stats?.companyCount || 0} companies</span>
                  <span>Updated {formatDistanceToNow(new Date(resume.updatedAt))}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
