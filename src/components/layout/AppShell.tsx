import * as React from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sun, Moon } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "./AppSidebar"
import { useAppStore } from "@/lib/store"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

export function AppShell() {
  const location = useLocation()
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const theme = useAppStore((state) => state.theme)
  const setCommandPaletteOpen = useAppStore((state) => state.setCommandPaletteOpen)

  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  // Simple breadcrumb logic based on pathname
  const pageName = location.pathname === "/" 
    ? "Dashboard" 
    : location.pathname.split("/").filter(Boolean)[0] || "Page"
  
  const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1)

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{formattedPageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="ml-auto flex items-center gap-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <span className="hidden lg:inline-flex">Search...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
