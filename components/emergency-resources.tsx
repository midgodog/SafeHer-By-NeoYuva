"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Building2, MapPin, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmergencyContact {
  id: string
  name: string
  number: string
  icon: React.ReactNode
  color: string
  bgColor: string
  description: string
}

const emergencyContacts: EmergencyContact[] = [
  {
    id: "women-helpline",
    name: "Women Helpline",
    number: "1090",
    icon: <Phone className="w-5 h-5" />,
    color: "text-emergency-purple",
    bgColor: "bg-emergency-purple/10 hover:bg-emergency-purple/20",
    description: "24/7 Women's Safety",
  },
  {
    id: "police",
    name: "Police",
    number: "100",
    icon: <Building2 className="w-5 h-5" />,
    color: "text-emergency-blue",
    bgColor: "bg-emergency-blue/10 hover:bg-emergency-blue/20",
    description: "Emergency Police",
  },
  {
    id: "ambulance",
    name: "Ambulance",
    number: "102",
    icon: <Phone className="w-5 h-5" />,
    color: "text-emergency-orange",
    bgColor: "bg-emergency-orange/10 hover:bg-emergency-orange/20",
    description: "Medical Emergency",
  },
  {
    id: "hospital",
    name: "Nearby Hospital",
    number: "Search",
    icon: <MapPin className="w-5 h-5" />,
    color: "text-emergency-green",
    bgColor: "bg-emergency-green/10 hover:bg-emergency-green/20",
    description: "Find Nearest",
  },
]

function handleCall(number: string) {
  if (number === "Search") {
    // Open Google Maps search for nearby hospitals
    window.open("https://www.google.com/maps/search/hospital+near+me", "_blank")
  } else {
    window.open(`tel:${number}`, "_self")
  }
}

export function EmergencyResources() {
  return (
    <Card className="glass rounded-2xl shadow-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Emergency Resources</h3>
          <span className="text-xs text-muted-foreground">Quick Access</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {emergencyContacts.map((contact) => (
            <Button
              key={contact.id}
              variant="ghost"
              onClick={() => handleCall(contact.number)}
              className={cn(
                "h-auto p-3 flex flex-col items-center gap-2 rounded-xl transition-all duration-200",
                contact.bgColor,
                "border border-transparent hover:border-border/50",
              )}
              aria-label={`Call ${contact.name} at ${contact.number}`}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  contact.bgColor,
                  contact.color,
                )}
              >
                {contact.icon}
              </div>
              <div className="text-center">
                <p className={cn("font-semibold text-sm", contact.color)}>
                  {contact.number === "Search" ? (
                    <span className="flex items-center gap-1">
                      Find <ExternalLink className="w-3 h-3" />
                    </span>
                  ) : (
                    contact.number
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{contact.name}</p>
              </div>
            </Button>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-medium text-foreground">💡 Tip:</span> Save these numbers in your phone's speed dial
            for quick access.
          </p>
        </div>
      </div>
    </Card>
  )
}
