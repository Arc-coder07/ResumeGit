import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import { toast } from 'sonner';

import {
  getVersion,
  getRole,
  getCompanyProfile,
  getCompany,
  getResume,
  updateVersionContent,
  getVersionsByRole,
  addVersion,
} from '@/lib/db';
import type { Version, Role, CompanyProfile, Company, Resume } from '@/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Printer,
  Check,
} from 'lucide-react';

export default function EditorPage() {
  const { versionId } = useParams<{ versionId: string }>();
  const navigate = useNavigate();

  const [version, setVersion] = useState<Version | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [_companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [newVersionSummary, setNewVersionSummary] = useState('');
  const [isSavingAsNew, setIsSavingAsNew] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your resume...' }),
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
  });

  useEffect(() => {
    async function loadData() {
      if (!versionId) return;
      try {
        setLoading(true);
        const v = await getVersion(versionId);
        if (!v) {
          toast.error('Version not found');
          navigate('/');
          return;
        }
        setVersion(v);

        if (v.content && editor && isInitialLoad.current) {
          editor.commands.setContent(v.content);
          isInitialLoad.current = false;
        }

        const r = await getRole(v.roleId);
        if (r) {
          setRole(r);
          const cp = await getCompanyProfile(r.companyProfileId);
          if (cp) {
            setCompanyProfile(cp);
            const [comp, res] = await Promise.all([
              getCompany(cp.companyId),
              getResume(cp.resumeId),
            ]);
            setCompany(comp || null);
            setResume(res || null);
          }
        }
      } catch (error) {
        console.error('Failed to load version data:', error);
        toast.error('Failed to load editor data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [versionId, navigate, editor]);

  useEffect(() => {
    if (!editor || !version) return;
    
    const handleUpdate = () => {
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateVersionContent(version.id, editor.getJSON() as any);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
          console.error('Failed to auto-save:', err);
          setSaveStatus('idle');
        }
      }, 1000);
    };
    
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editor, version]);

  const handleSaveAsNew = async () => {
    if (!version || !editor || !newVersionSummary) {
      toast.error('Summary is required');
      return;
    }
    
    setIsSavingAsNew(true);
    try {
      const content = editor.getJSON();
      const versions = await getVersionsByRole(version.roleId);
      const newVersionNumber = versions.length > 0 
        ? Math.max(...versions.map((v: Version) => v.versionNumber)) + 1 
        : 1;
      
      const newVersionData: Version = {
        id: crypto.randomUUID(),
        roleId: version.roleId,
        versionNumber: newVersionNumber,
        title: newVersionTitle || `Version ${newVersionNumber}`,
        summary: newVersionSummary,
        content: content as Record<string, unknown>,
        previousVersionId: version.id,
        isCurrent: true,
        createdAt: new Date(),
      };
      
      const newId = await addVersion(newVersionData);
      toast.success('New version created');
      setIsSaveModalOpen(false);
      setNewVersionTitle('');
      setNewVersionSummary('');
      navigate(`/editor/${newId}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create new version');
    } finally {
      setIsSavingAsNew(false);
    }
  };

  const setLink = () => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen p-6 gap-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="flex-1 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0 no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{resume?.name || 'Resume'}</span>
            <span className="mx-2">/</span>
            <span>{company?.name || 'Company'}</span>
            <span className="mx-2">/</span>
            <span>{role?.title || 'Role'}</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">
              {version?.title || `Version ${version?.versionNumber}`}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
            {saveStatus === 'saving' && <span>Saving...</span>}
            {saveStatus === 'saved' && (
              <span className="flex items-center text-green-600 dark:text-green-400">
                <Check className="h-4 w-4 mr-1" /> Saved
              </span>
            )}
          </div>
          <Button onClick={() => setIsSaveModalOpen(true)}>Save as New Version</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
          <div className="tiptap-editor border border-border rounded-lg flex flex-col h-full overflow-hidden bg-card shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2 no-print shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={cn(editor?.isActive('bold') && 'bg-accent text-accent-foreground')}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={cn(editor?.isActive('italic') && 'bg-accent text-accent-foreground')}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={cn(editor?.isActive('underline') && 'bg-accent text-accent-foreground')}
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(editor?.isActive('heading', { level: 1 }) && 'bg-accent text-accent-foreground')}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(editor?.isActive('heading', { level: 2 }) && 'bg-accent text-accent-foreground')}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                className={cn(editor?.isActive('heading', { level: 3 }) && 'bg-accent text-accent-foreground')}
              >
                <Heading3 className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={cn(editor?.isActive('bulletList') && 'bg-accent text-accent-foreground')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={cn(editor?.isActive('orderedList') && 'bg-accent text-accent-foreground')}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                className={cn(editor?.isActive({ textAlign: 'left' }) && 'bg-accent text-accent-foreground')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                className={cn(editor?.isActive({ textAlign: 'center' }) && 'bg-accent text-accent-foreground')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                className={cn(editor?.isActive({ textAlign: 'right' }) && 'bg-accent text-accent-foreground')}
              >
                <AlignRight className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={setLink}
                className={cn(editor?.isActive('link') && 'bg-accent text-accent-foreground')}
              >
                <Link2 className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().undo().run()}
                disabled={!editor?.can().chain().focus().undo().run()}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().redo().run()}
                disabled={!editor?.can().chain().focus().redo().run()}
              >
                <Redo2 className="h-4 w-4" />
              </Button>

              <div className="flex-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-muted-foreground"
                title="Toggle Preview"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.print()}
                className="text-muted-foreground"
                title="Print / Export PDF"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950">
              <EditorContent editor={editor} className="h-full" />
            </div>
          </div>
        </div>

        {/* Live Preview Pane */}
        {showPreview && (
          <div className="w-[400px] border-l bg-muted/10 p-6 overflow-auto hidden md:block no-print">
            <h3 className="font-medium text-sm text-muted-foreground mb-4 uppercase tracking-wider">
              Live Preview
            </h3>
            <div className="tiptap-editor bg-white dark:bg-zinc-950 border rounded-lg shadow-sm p-6 min-h-[500px]">
              <div 
                className="prose prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} 
              />
            </div>
          </div>
        )}
      </div>

      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as New Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title (Optional)</label>
              <Input
                placeholder="e.g., Tweaked for Senior React Role"
                value={newVersionTitle}
                onChange={(e) => setNewVersionTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Summary</label>
              <Textarea
                placeholder="Briefly describe what changed in this version..."
                value={newVersionSummary}
                onChange={(e) => setNewVersionSummary(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsNew} disabled={isSavingAsNew || !newVersionSummary}>
              {isSavingAsNew ? 'Saving...' : 'Save Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
