import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Building2, Briefcase, GitBranch, Clock, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDashboardStats, getRecentVersions } from '@/lib/db';
import type { DashboardStats, Version } from '@/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVersions, setRecentVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

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
          Start by creating your first resume or adding a target company. ResumeGit helps you manage versions tailored for specific roles.
        </p>
        <Link 
          to="/resumes" 
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Your First Resume
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
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

      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Recent Uploads
        </h3>
        <div className="space-y-3">
          {recentVersions.length === 0 ? (
            <div className="glass-card p-8 rounded-xl text-center text-muted-foreground text-sm">
              No recent versions found.
            </div>
          ) : (
            recentVersions.map((v) => (
              <div key={v.id} className="block glass-card p-4 rounded-xl transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0"></div>
                    <div>
                      <p className="font-semibold text-sm">v{v.versionNumber} - {v.title || 'Untitled'} ({v.fileName || 'Unknown File'})</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{v.summary || 'No summary provided.'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4 shrink-0">
                    {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/resumes" className="border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all rounded-xl p-4 flex items-center gap-3 cursor-pointer group">
            <div className="bg-muted group-hover:bg-primary/10 p-2 rounded-lg transition-colors">
              <Plus className="h-5 w-5 text-foreground group-hover:text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">New Resume</p>
              <p className="text-xs text-muted-foreground">Create a base resume</p>
            </div>
          </Link>
          <Link to="/companies" className="border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all rounded-xl p-4 flex items-center gap-3 cursor-pointer group">
            <div className="bg-muted group-hover:bg-primary/10 p-2 rounded-lg transition-colors">
              <Building2 className="h-5 w-5 text-foreground group-hover:text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Add Company</p>
              <p className="text-xs text-muted-foreground">Track a target company</p>
            </div>
          </Link>
          <Link to="/resumes" className="border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all rounded-xl p-4 flex items-center gap-3 cursor-pointer group">
            <div className="bg-muted group-hover:bg-primary/10 p-2 rounded-lg transition-colors">
              <Plus className="h-5 w-5 text-foreground group-hover:text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Upload Resume</p>
              <p className="text-xs text-muted-foreground">Add to the vault</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
