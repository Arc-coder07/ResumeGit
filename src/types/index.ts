// ============================================================
// ResumeGit — Type Definitions
// ============================================================

export interface Resume {
  id: string
  name: string
  category: string
  description: string
  tags: string[]
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface Company {
  id: string
  name: string
  logo: string
  website: string
  careerPage: string
  industry: string
  location: string
  notes: string
  color: string
  createdAt: Date
}

/**
 * A CompanyProfile links a Resume to a Company.
 * It represents "this resume has been tailored for this company."
 */
export interface CompanyProfile {
  id: string
  resumeId: string
  companyId: string
  createdAt: Date
}

/**
 * A Role belongs to a CompanyProfile.
 * e.g. Google → Software Engineer, Google → SWE Intern
 */
export interface Role {
  id: string
  companyProfileId: string
  title: string
  jobUrl: string
  status: RoleStatus
  notes: string
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

export type RoleStatus =
  | 'draft'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'accepted'

/**
 * A Version belongs to a Role.
 * Each version contains the full resume content for that role at a point in time.
 */
export interface Version {
  id: string
  roleId: string
  versionNumber: number
  title: string
  summary: string
  /** TipTap JSON document content */
  content: Record<string, unknown>
  previousVersionId: string | null
  isCurrent: boolean
  createdAt: Date
}

// ============================================================
// View Models (joined data for UI rendering)
// ============================================================

/** Resume card in the library grid */
export interface ResumeWithStats extends Resume {
  companyCount: number
  roleCount: number
  versionCount: number
  latestVersionDate: Date | null
}

/** Tree node for Resume Detail page */
export interface ResumeTree {
  resume: Resume
  companies: CompanyNode[]
}

export interface CompanyNode {
  company: Company
  profile: CompanyProfile
  roles: RoleNode[]
}

export interface RoleNode {
  role: Role
  versions: Version[]
}

/** For the recent activity feed */
export interface ActivityItem {
  id: string
  type: 'version_created' | 'resume_created' | 'company_added' | 'role_added'
  title: string
  subtitle: string
  timestamp: Date
  entityId: string
  color?: string
}

/** Dashboard stats */
export interface DashboardStats {
  totalResumes: number
  totalCompanies: number
  totalRoles: number
  totalVersions: number
}

// ============================================================
// Form/Dialog types
// ============================================================

export interface CreateResumeInput {
  name: string
  category: string
  description: string
  tags: string[]
  color: string
}

export interface CreateCompanyInput {
  name: string
  website: string
  careerPage: string
  industry: string
  location: string
  notes: string
  color: string
}

export interface CreateRoleInput {
  companyProfileId: string
  title: string
  jobUrl: string
  notes: string
}

export interface CreateVersionInput {
  roleId: string
  title: string
  summary: string
  content: Record<string, unknown>
}
