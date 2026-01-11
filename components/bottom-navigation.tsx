"use client"

import { Home, AlertOctagon, BookOpen, Settings, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ActivePage } from "@/app/page"

interface BottomNavigationProps {
  activePage: ActivePage
  onNavigate: (page: ActivePage) => void
}

const navItems = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "incidents" as const, label: "Log", icon: FileText },
  { id: "sos" as const, label: "SOS", icon: AlertOctagon, isEmergency: true },
  { id: "resources" as const, label: "Resources", icon: BookOpen },
  { id: "settings" as const, label: "Settings", icon: Settings },
]

export function BottomNavigation({ activePage, onNavigate }: BottomNavigationProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:relative glass border-t border-border/50 safe-area-inset-bottom no-print"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-lg mx-auto px-2 py-2">
        <ul className="flex items-center justify-around list-none m-0 p-0">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            const isEmergency = item.isEmergency

            if (isEmergency) {
              return (
                <li key={item.id}>
                  <Button
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      "relative -mt-6 w-14 h-14 rounded-full touch-target",
                      "bg-gradient-to-br from-red-500 to-red-600",
                      "hover:from-red-600 hover:to-red-700",
                      "text-white shadow-lg shadow-red-500/30",
                      "sos-pulse",
                      "focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2",
                    )}
                    aria-label="SOS Emergency - Activate emergency mode"
                    aria-pressed={isActive}
                  >
                    <div className="flex flex-col items-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span className="text-[9px] font-bold mt-0.5">SOS</span>
                    </div>
                  </Button>
                </li>
              )
            }

            return (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 h-auto py-2 px-3 sm:px-4 rounded-xl transition-all touch-target",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={cn("w-5 h-5", isActive && "scale-110")} aria-hidden="true" />
                  <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
                </Button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
