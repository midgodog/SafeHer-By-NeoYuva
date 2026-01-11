// Trusted contacts management with localStorage persistence

export interface TrustedContact {
  id: string
  name: string
  phone: string
  relationship: string
  createdAt: Date
}

const STORAGE_KEY = "safeher_trusted_contacts"

// Get all trusted contacts from localStorage
export function getTrustedContacts(): TrustedContact[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return parsed.map((contact: TrustedContact & { createdAt: string }) => ({
      ...contact,
      createdAt: new Date(contact.createdAt),
    }))
  } catch {
    return []
  }
}

// Save trusted contacts to localStorage
export function saveTrustedContacts(contacts: TrustedContact[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
}

// Add a new trusted contact
export function addTrustedContact(contact: Omit<TrustedContact, "id" | "createdAt">): TrustedContact {
  const contacts = getTrustedContacts()

  const newContact: TrustedContact = {
    ...contact,
    id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  }

  contacts.push(newContact)
  saveTrustedContacts(contacts)

  return newContact
}

// Remove a trusted contact
export function removeTrustedContact(id: string): void {
  const contacts = getTrustedContacts()
  const filtered = contacts.filter((c) => c.id !== id)
  saveTrustedContacts(filtered)
}

// Update a trusted contact
export function updateTrustedContact(
  id: string,
  updates: Partial<Omit<TrustedContact, "id" | "createdAt">>,
): TrustedContact | null {
  const contacts = getTrustedContacts()
  const index = contacts.findIndex((c) => c.id === id)

  if (index === -1) return null

  contacts[index] = { ...contacts[index], ...updates }
  saveTrustedContacts(contacts)

  return contacts[index]
}

// Validate phone number (Indian format)
export function validatePhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "")
  // Indian phone: 10 digits or 12 digits with country code
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith("91"))
}

// Format phone number for display
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
