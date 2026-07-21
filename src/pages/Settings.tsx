import type React from 'react';
import { Moon, Sun, Download, Upload, Trash2, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { exportAllData, importAllData, clearAllData } from '@/lib/db';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Settings() {
  const { theme, setTheme } = useAppStore();

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumegit-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string;
        const data = JSON.parse(jsonString);
        await importAllData(data);
        toast.success('Data imported successfully');
        // Optional: reload window to reflect changes globally
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('Import failed:', error);
        toast.error('Failed to import data. Invalid format.');
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
      toast.success('All data cleared successfully');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Clear data failed:', error);
      toast.error('Failed to clear data');
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6 [&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-4 [&>*]:duration-500 stagger-children">
        
        {/* Appearance Section */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Customize the look and feel of the app.</p>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-sm">Theme</p>
              <p className="text-xs text-muted-foreground">Select between light and dark mode.</p>
            </div>
            <div className="flex bg-muted p-1 rounded-lg">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-semibold">Data Management</h2>
            <p className="text-sm text-muted-foreground">Export your data for backup or import from a previous backup.</p>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Export Data</p>
                <p className="text-xs text-muted-foreground">Download all your resumes, versions, and company data as a JSON file.</p>
              </div>
              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="font-medium text-sm">Import Data</p>
                <p className="text-xs text-muted-foreground">Restore your data from a JSON backup file. This will merge with existing data.</p>
              </div>
              <div>
                <input type="file" id="import-file" accept=".json" className="hidden" onChange={handleImport} />
                <Button variant="outline" className="gap-2" onClick={() => document.getElementById('import-file')?.click()}>
                  <Upload className="h-4 w-4" />
                  Import JSON
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="font-medium text-sm text-destructive">Clear All Data</p>
                <p className="text-xs text-muted-foreground">Permanently delete all resumes, companies, and versions from this device.</p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Clear Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your resumes, companies, versions, and settings from the local database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Yes, clear everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-semibold">About</h2>
            <p className="text-sm text-muted-foreground">App information and resources.</p>
          </div>
          
          <div className="py-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">ResumeGit</p>
                <p className="text-xs text-muted-foreground">Version control for tailored resumes</p>
              </div>
              <span className="text-xs font-mono bg-muted px-2 py-1 rounded">v1.0.0</span>
            </div>
            
            <div className="pt-2">
              <a 
                href="#" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                GitHub Repository
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
