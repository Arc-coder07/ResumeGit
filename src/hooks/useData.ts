import { useState, useEffect, useCallback } from 'react'
import type { Resume, Company, CompanyProfile, Role, Version, ResumeWithStats, DashboardStats } from '@/types'
import * as db from '@/lib/db'
import { useAppStore } from '@/lib/store'

// ============================================================
// useResumes
// ============================================================

export function useResumes() {
  const [resumes, setResumes] = useState<ResumeWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  const fetchResumes = useCallback(async () => {
    setLoading(true)
    try {
      const allResumes = await db.getResumes()
      const withStats = await Promise.all(
        allResumes.map(async (r) => {
          const stats = await db.getResumeStats(r.id)
          return { ...r, ...stats } as ResumeWithStats
        })
      )
      setResumes(withStats)
    } catch (err) {
      console.error('Failed to fetch resumes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResumes()
  }, [fetchResumes, refreshKey])

  return { resumes, loading, refetch: fetchResumes }
}

// ============================================================
// useResume (single)
// ============================================================

export function useResume(id: string | undefined) {
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    db.getResume(id).then((r) => {
      setResume(r ?? null)
      setLoading(false)
    })
  }, [id, refreshKey])

  return { resume, loading }
}

// ============================================================
// useCompanies
// ============================================================

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const all = await db.getCompanies()
      setCompanies(all)
    } catch (err) {
      console.error('Failed to fetch companies:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies, refreshKey])

  return { companies, loading, refetch: fetchCompanies }
}

// ============================================================
// useCompany (single)
// ============================================================

export function useCompany(id: string | undefined) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    db.getCompany(id).then((c) => {
      setCompany(c ?? null)
      setLoading(false)
    })
  }, [id, refreshKey])

  return { company, loading }
}

// ============================================================
// useCompanyProfiles
// ============================================================

export function useCompanyProfiles(resumeId: string | undefined) {
  const [profiles, setProfiles] = useState<CompanyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  useEffect(() => {
    if (!resumeId) return
    setLoading(true)
    db.getCompanyProfilesByResume(resumeId).then((p) => {
      setProfiles(p)
      setLoading(false)
    })
  }, [resumeId, refreshKey])

  return { profiles, loading }
}

// ============================================================
// useRoles
// ============================================================

export function useRoles(companyProfileId: string | undefined) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  useEffect(() => {
    if (!companyProfileId) return
    setLoading(true)
    db.getRolesByCompanyProfile(companyProfileId).then((r) => {
      setRoles(r)
      setLoading(false)
    })
  }, [companyProfileId, refreshKey])

  return { roles, loading }
}

// ============================================================
// useVersions
// ============================================================

export function useVersions(roleId: string | undefined) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  useEffect(() => {
    if (!roleId) return
    setLoading(true)
    db.getVersionsByRole(roleId).then((v) => {
      setVersions(v)
      setLoading(false)
    })
  }, [roleId, refreshKey])

  return { versions, loading }
}

// ============================================================
// useVersion (single)
// ============================================================

export function useVersion(id: string | undefined) {
  const [version, setVersion] = useState<Version | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    db.getVersion(id).then((v) => {
      setVersion(v ?? null)
      setLoading(false)
    })
  }, [id, refreshKey])

  return { version, loading }
}

// ============================================================
// useDashboardStats
// ============================================================

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalResumes: 0,
    totalCompanies: 0,
    totalRoles: 0,
    totalVersions: 0,
  })
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  useEffect(() => {
    db.getDashboardStats().then((s) => {
      setStats(s)
      setLoading(false)
    })
  }, [refreshKey])

  return { stats, loading }
}

// ============================================================
// useRecentVersions
// ============================================================

export function useRecentVersions(limit = 5) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  useEffect(() => {
    db.getRecentVersions(limit).then((v) => {
      setVersions(v)
      setLoading(false)
    })
  }, [limit, refreshKey])

  return { versions, loading }
}

// ============================================================
// useResumeTree — full hierarchy for a resume
// ============================================================

export function useResumeTree(resumeId: string | undefined) {
  const [tree, setTree] = useState<{
    company: Company
    profile: CompanyProfile
    roles: { role: Role; versions: Version[] }[]
  }[]>([])
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  useEffect(() => {
    if (!resumeId) return
    setLoading(true)

    ;(async () => {
      const profiles = await db.getCompanyProfilesByResume(resumeId)
      const result = await Promise.all(
        profiles.map(async (profile) => {
          const company = await db.getCompany(profile.companyId)
          if (!company) return null

          const roles = await db.getRolesByCompanyProfile(profile.id)
          const rolesWithVersions = await Promise.all(
            roles.map(async (role) => {
              const versions = await db.getVersionsByRole(role.id)
              return { role, versions }
            })
          )

          return { company, profile, roles: rolesWithVersions }
        })
      )

      setTree(result.filter((r): r is NonNullable<typeof r> => r !== null))
      setLoading(false)
    })()
  }, [resumeId, refreshKey])

  return { tree, loading }
}

// ============================================================
// useCompanyTree — full hierarchy for a company across resumes
// ============================================================

export function useCompanyTree(companyId: string | undefined) {
  const [tree, setTree] = useState<{
    resume: Resume
    profile: CompanyProfile
    roles: { role: Role; versions: Version[] }[]
  }[]>([])
  const [loading, setLoading] = useState(true)
  const refreshKey = useAppStore((s) => s.refreshKey)

  useEffect(() => {
    if (!companyId) return
    setLoading(true)

    ;(async () => {
      const profiles = await db.getCompanyProfilesByCompany(companyId)
      const result = await Promise.all(
        profiles.map(async (profile) => {
          const resume = await db.getResume(profile.resumeId)
          if (!resume) return null

          const roles = await db.getRolesByCompanyProfile(profile.id)
          const rolesWithVersions = await Promise.all(
            roles.map(async (role) => {
              const versions = await db.getVersionsByRole(role.id)
              return { role, versions }
            })
          )

          return { resume, profile, roles: rolesWithVersions }
        })
      )

      setTree(result.filter((r): r is NonNullable<typeof r> => r !== null))
      setLoading(false)
    })()
  }, [companyId, refreshKey])

  return { tree, loading }
}
