import Dexie, { type EntityTable } from 'dexie'
import type { Resume, Company, CompanyProfile, Role, Version } from '@/types'

// ============================================================
// Database Schema
// ============================================================

const db = new Dexie('ResumeGitDB') as Dexie & {
  resumes: EntityTable<Resume, 'id'>
  companies: EntityTable<Company, 'id'>
  companyProfiles: EntityTable<CompanyProfile, 'id'>
  roles: EntityTable<Role, 'id'>
  versions: EntityTable<Version, 'id'>
}

db.version(1).stores({
  resumes: 'id, name, category, createdAt, updatedAt',
  companies: 'id, name, createdAt',
  companyProfiles: 'id, resumeId, companyId, [resumeId+companyId]',
  roles: 'id, companyProfileId, title, createdAt',
  versions: 'id, roleId, versionNumber, isCurrent, createdAt',
})

// V2: Schema changes for file uploads instead of rich text
db.version(2).stores({
  resumes: 'id, name, category, createdAt, updatedAt',
  companies: 'id, name, createdAt',
  companyProfiles: 'id, resumeId, companyId, [resumeId+companyId]',
  roles: 'id, companyProfileId, title, createdAt',
  versions: 'id, roleId, versionNumber, isCurrent, createdAt',
}).upgrade(async (tx) => {
  // Wipe old versions as they contain incompatible 'content' fields
  await tx.table('versions').clear()
})

export { db }

// ============================================================
// Resume Operations
// ============================================================

export async function getResumes(): Promise<Resume[]> {
  return db.resumes.orderBy('updatedAt').reverse().toArray()
}

export async function getResume(id: string): Promise<Resume | undefined> {
  return db.resumes.get(id)
}

export async function addResume(resume: Resume): Promise<string> {
  return db.resumes.add(resume)
}

export async function updateResume(id: string, changes: Partial<Resume>): Promise<number> {
  return db.resumes.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteResume(id: string): Promise<void> {
  await db.transaction('rw', [db.resumes, db.companyProfiles, db.roles, db.versions], async () => {
    const profiles = await db.companyProfiles.where('resumeId').equals(id).toArray()
    for (const profile of profiles) {
      const roles = await db.roles.where('companyProfileId').equals(profile.id).toArray()
      for (const role of roles) {
        await db.versions.where('roleId').equals(role.id).delete()
      }
      await db.roles.where('companyProfileId').equals(profile.id).delete()
    }
    await db.companyProfiles.where('resumeId').equals(id).delete()
    await db.resumes.delete(id)
  })
}

// ============================================================
// Company Operations
// ============================================================

export async function getCompanies(): Promise<Company[]> {
  return db.companies.orderBy('name').toArray()
}

export async function getCompany(id: string): Promise<Company | undefined> {
  return db.companies.get(id)
}

export async function addCompany(company: Company): Promise<string> {
  return db.companies.add(company)
}

export async function updateCompany(id: string, changes: Partial<Company>): Promise<number> {
  return db.companies.update(id, changes)
}

export async function deleteCompany(id: string): Promise<void> {
  await db.transaction('rw', [db.companies, db.companyProfiles, db.roles, db.versions], async () => {
    const profiles = await db.companyProfiles.where('companyId').equals(id).toArray()
    for (const profile of profiles) {
      const roles = await db.roles.where('companyProfileId').equals(profile.id).toArray()
      for (const role of roles) {
        await db.versions.where('roleId').equals(role.id).delete()
      }
      await db.roles.where('companyProfileId').equals(profile.id).delete()
    }
    await db.companyProfiles.where('companyId').equals(id).delete()
    await db.companies.delete(id)
  })
}

// ============================================================
// CompanyProfile Operations
// ============================================================

export async function getCompanyProfilesByResume(resumeId: string): Promise<CompanyProfile[]> {
  return db.companyProfiles.where('resumeId').equals(resumeId).toArray()
}

export async function getCompanyProfilesByCompany(companyId: string): Promise<CompanyProfile[]> {
  return db.companyProfiles.where('companyId').equals(companyId).toArray()
}

export async function getCompanyProfile(id: string): Promise<CompanyProfile | undefined> {
  return db.companyProfiles.get(id)
}

export async function addCompanyProfile(profile: CompanyProfile): Promise<string> {
  return db.companyProfiles.add(profile)
}

export async function deleteCompanyProfile(id: string): Promise<void> {
  await db.transaction('rw', [db.companyProfiles, db.roles, db.versions], async () => {
    const roles = await db.roles.where('companyProfileId').equals(id).toArray()
    for (const role of roles) {
      await db.versions.where('roleId').equals(role.id).delete()
    }
    await db.roles.where('companyProfileId').equals(id).delete()
    await db.companyProfiles.delete(id)
  })
}

export async function findOrCreateCompanyProfile(
  resumeId: string,
  companyId: string
): Promise<CompanyProfile> {
  const existing = await db.companyProfiles
    .where('[resumeId+companyId]')
    .equals([resumeId, companyId])
    .first()
  if (existing) return existing

  const profile: CompanyProfile = {
    id: crypto.randomUUID(),
    resumeId,
    companyId,
    createdAt: new Date(),
  }
  await db.companyProfiles.add(profile)
  return profile
}

// ============================================================
// Role Operations
// ============================================================

export async function getRolesByCompanyProfile(companyProfileId: string): Promise<Role[]> {
  return db.roles.where('companyProfileId').equals(companyProfileId).toArray()
}

export async function getRole(id: string): Promise<Role | undefined> {
  return db.roles.get(id)
}

export async function addRole(role: Role): Promise<string> {
  return db.roles.add(role)
}

export async function updateRole(id: string, changes: Partial<Role>): Promise<number> {
  return db.roles.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteRole(id: string): Promise<void> {
  await db.transaction('rw', [db.roles, db.versions], async () => {
    await db.versions.where('roleId').equals(id).delete()
    await db.roles.delete(id)
  })
}

// ============================================================
// Version Operations
// ============================================================

export async function getVersionsByRole(roleId: string): Promise<Version[]> {
  const versions = await db.versions.where('roleId').equals(roleId).toArray()
  return versions.sort((a, b) => b.versionNumber - a.versionNumber)
}

export async function getVersion(id: string): Promise<Version | undefined> {
  return db.versions.get(id)
}

export async function addVersion(version: Version): Promise<string> {
  // Mark all other versions for this role as not current
  await db.versions
    .where('roleId')
    .equals(version.roleId)
    .modify({ isCurrent: false })

  return db.versions.add(version)
}

export async function updateVersionMetadata(
  id: string,
  changes: Partial<Pick<Version, 'title' | 'summary'>>
): Promise<number> {
  return db.versions.update(id, changes)
}

export async function restoreVersion(id: string): Promise<void> {
  const version = await db.versions.get(id)
  if (!version) return

  // Unmark all current versions for this role
  await db.versions
    .where('roleId')
    .equals(version.roleId)
    .modify({ isCurrent: false })

  // Mark this version as current
  await db.versions.update(id, { isCurrent: true })
}

export async function duplicateVersion(
  versionId: string,
  targetRoleId: string
): Promise<Version> {
  const source = await db.versions.get(versionId)
  if (!source) throw new Error('Version not found')

  const existingVersions = await db.versions
    .where('roleId')
    .equals(targetRoleId)
    .toArray()

  const newVersionNumber = existingVersions.length > 0
    ? Math.max(...existingVersions.map(v => v.versionNumber)) + 1
    : 1

  const newVersion: Version = {
    id: crypto.randomUUID(),
    roleId: targetRoleId,
    versionNumber: newVersionNumber,
    title: `Duplicated from v${source.versionNumber}`,
    summary: `Duplicated from version ${source.versionNumber}`,
    fileData: source.fileData,
    fileName: source.fileName,
    fileType: source.fileType,
    fileSize: source.fileSize,
    previousVersionId: null,
    isCurrent: true,
    createdAt: new Date(),
  }

  // Unmark current versions
  await db.versions
    .where('roleId')
    .equals(targetRoleId)
    .modify({ isCurrent: false })

  await db.versions.add(newVersion)
  return newVersion
}

// ============================================================
// Stats & Queries
// ============================================================

export async function getDashboardStats() {
  const [resumes, companies, roles, versions] = await Promise.all([
    db.resumes.count(),
    db.companies.count(),
    db.roles.count(),
    db.versions.count(),
  ])
  return {
    totalResumes: resumes,
    totalCompanies: companies,
    totalRoles: roles,
    totalVersions: versions,
  }
}

export async function getRecentVersions(limit = 10): Promise<Version[]> {
  return db.versions.orderBy('createdAt').reverse().limit(limit).toArray()
}

export async function getResumeStats(resumeId: string) {
  const profiles = await getCompanyProfilesByResume(resumeId)
  let roleCount = 0
  let versionCount = 0
  let latestVersionDate: Date | null = null

  for (const profile of profiles) {
    const roles = await getRolesByCompanyProfile(profile.id)
    roleCount += roles.length

    for (const role of roles) {
      const versions = await getVersionsByRole(role.id)
      versionCount += versions.length

      for (const v of versions) {
        if (!latestVersionDate || v.createdAt > latestVersionDate) {
          latestVersionDate = v.createdAt
        }
      }
    }
  }

  return {
    companyCount: profiles.length,
    roleCount,
    versionCount,
    latestVersionDate,
  }
}

// ============================================================
// Export / Import
// ============================================================

export async function blobToBase64(blob: Blob | ArrayBuffer): Promise<string> {
  const fileBlob = blob instanceof ArrayBuffer ? new Blob([blob]) : blob;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(fileBlob);
  });
}

export async function base64ToBlob(base64: string): Promise<Blob> {
  const res = await fetch(base64);
  return res.blob();
}

export async function exportAllData() {
  const [resumes, companies, companyProfiles, roles, versions] = await Promise.all([
    db.resumes.toArray(),
    db.companies.toArray(),
    db.companyProfiles.toArray(),
    db.roles.toArray(),
    db.versions.toArray(),
  ])
  
  const processedVersions = await Promise.all(versions.map(async (v) => ({
    ...v,
    fileData: await blobToBase64(v.fileData)
  })))
  
  const processedResumes = await Promise.all(resumes.map(async (r) => ({
    ...r,
    masterFileData: r.masterFileData ? await blobToBase64(r.masterFileData) : undefined
  })))

  return { 
    resumes: processedResumes, 
    companies, 
    companyProfiles, 
    roles, 
    versions: processedVersions, 
    exportedAt: new Date().toISOString() 
  }
}

export async function importAllData(data: {
  resumes: any[]
  companies: Company[]
  companyProfiles: CompanyProfile[]
  roles: Role[]
  versions: any[]
}) {
  await db.transaction('rw', [db.resumes, db.companies, db.companyProfiles, db.roles, db.versions], async () => {
    await db.resumes.clear()
    await db.companies.clear()
    await db.companyProfiles.clear()
    await db.roles.clear()
    await db.versions.clear()

    const parseDate = (d: Date | string) => new Date(d)

    const processedVersions = await Promise.all(data.versions.map(async (v) => ({
      ...v,
      fileData: await base64ToBlob(v.fileData),
      createdAt: parseDate(v.createdAt)
    })))
    
    const processedResumes = await Promise.all(data.resumes.map(async (r) => ({
      ...r,
      masterFileData: r.masterFileData ? await base64ToBlob(r.masterFileData) : undefined,
      createdAt: parseDate(r.createdAt),
      updatedAt: parseDate(r.updatedAt)
    })))

    await db.resumes.bulkAdd(processedResumes)
    await db.companies.bulkAdd(data.companies.map(c => ({ ...c, createdAt: parseDate(c.createdAt) })))
    await db.companyProfiles.bulkAdd(data.companyProfiles.map(cp => ({ ...cp, createdAt: parseDate(cp.createdAt) })))
    await db.roles.bulkAdd(data.roles.map(r => ({ ...r, createdAt: parseDate(r.createdAt), updatedAt: parseDate(r.updatedAt) })))
    await db.versions.bulkAdd(processedVersions)
  })
}

export async function clearAllData() {
  await db.transaction('rw', [db.resumes, db.companies, db.companyProfiles, db.roles, db.versions], async () => {
    await db.resumes.clear()
    await db.companies.clear()
    await db.companyProfiles.clear()
    await db.roles.clear()
    await db.versions.clear()
  })
}
