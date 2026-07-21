import * as React from "react"
import { Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { AppShell } from "@/components/layout/AppShell"
import { CommandPalette } from "@/components/layout/CommandPalette"

// Lazy loaded pages
const Dashboard = React.lazy(() => import("./pages/Dashboard"))
const Resumes = React.lazy(() => import("./pages/Resumes"))
const ResumeDetail = React.lazy(() => import("./pages/ResumeDetail"))
const Companies = React.lazy(() => import("./pages/Companies"))
const CompanyPage = React.lazy(() => import("./pages/CompanyPage"))
const EditorPage = React.lazy(() => import("./pages/EditorPage"))
const Settings = React.lazy(() => import("./pages/Settings"))

// Loading fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full w-full p-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <CommandPalette />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="resumes" element={<Resumes />} />
            <Route path="resumes/:resumeId" element={<ResumeDetail />} />
            <Route path="companies" element={<Companies />} />
            <Route path="companies/:companyId" element={<CompanyPage />} />
            <Route path="editor/:versionId" element={<EditorPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  )
}
