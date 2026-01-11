"use client"

import { Shield, Bell, Menu, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { useSettings } from "@/lib/settings-context"

export function Header() {
  const [hasNotifications] = useState(true)
  const { settings, updateDisplay } = useSettings()

  const toggleDarkMode = () => {
    updateDisplay({ darkMode: !settings.display.darkMode })
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50" role="banner">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
          aria-label="SafeHer - Home"
        >
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
            aria-hidden="true"
          >
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground leading-tight">SafeHer</h1>
            <span className="text-xs text-muted-foreground leading-tight">AI Safety Companion</span>
          </div>
        </a>

        {/* Right Actions */}
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Header actions">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full hover:bg-primary/10 touch-target"
            aria-label={settings.display.darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {settings.display.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-primary/10 touch-target"
            aria-label={hasNotifications ? "Notifications (new)" : "Notifications"}
          >
            <Bell className="w-5 h-5" />
            {hasNotifications && (
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background"
                aria-hidden="true"
              />
            )}
          </Button>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10 touch-target"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass w-48">
              <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Emergency Contacts</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">Safety Tips</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Help & Support</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
