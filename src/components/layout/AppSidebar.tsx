import * as React from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { LayoutDashboard, FileText, Building2, Settings, GitBranch, Plus } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

export function AppSidebar() {
  const location = useLocation()
  
  const navItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Resumes", url: "/resumes", icon: FileText },
    { title: "Companies", url: "/companies", icon: Building2 },
    { title: "Settings", url: "/settings", icon: Settings },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row justify-between items-center px-4 py-2">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <GitBranch className="h-5 w-5" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(250,85%,65%)] to-[hsl(280,85%,65%)] font-bold text-lg">
            ResumeGit
          </span>
        </Link>
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link to="/resumes">
            <Plus className="h-4 w-4" />
            <span className="sr-only">New Resume</span>
          </Link>
        </Button>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url || 
                               (item.url !== "/" && location.pathname.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive}>
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-md p-2">
          <span>Search</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
