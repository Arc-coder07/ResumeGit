import * as React from "react"
import { useNavigate } from "react-router-dom"
import { FileText, Building2, Plus, Sun, Moon } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAppStore } from "@/lib/store"

export function CommandPalette() {
  const navigate = useNavigate()
  const { commandPaletteOpen, setCommandPaletteOpen, theme, toggleTheme } = useAppStore()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  const runCommand = React.useCallback(
    (command: () => void) => {
      setCommandPaletteOpen(false)
      command()
    },
    [setCommandPaletteOpen]
  )

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Resumes">
          <CommandItem onSelect={() => runCommand(() => navigate("/resumes/1"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Frontend Developer Resume</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/resumes/2"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Full Stack Resume</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandGroup heading="Companies">
          <CommandItem onSelect={() => runCommand(() => navigate("/companies/1"))}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Google</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/companies/2"))}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Microsoft</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => navigate("/resumes"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Resume</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/companies"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Company</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(toggleTheme)}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>Toggle Theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
