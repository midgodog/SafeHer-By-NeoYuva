export interface RiskFactor {
  name: string
  level: "LOW" | "MEDIUM" | "HIGH"
  percentage: number
  icon: "clock" | "map" | "person" | "eye"
}

export interface Recommendation {
  priority: number
  action: string
  icon: "shield" | "phone" | "map-pin" | "users" | "alert" | "move"
}

export interface RiskAssessment {
  level: "LOW" | "MEDIUM" | "HIGH"
  percentage: number
  reason?: string
  factors?: RiskFactor[]
  recommendations?: Recommendation[]
}

export interface RiskHistory {
  id: number
  percentage: number
  timestamp: Date
}

export function parseRiskFromResponse(response: string): RiskAssessment | null {
  // Look for the comprehensive risk pattern with factors
  // Format: [RISK: LEVEL - percentage% | FACTORS: time:level,location:level,alone:level,visibility:level | ACTIONS: 1.action;2.action;3.action]

  const comprehensivePattern =
    /\[RISK:\s*(LOW|MEDIUM|HIGH)\s*-\s*(\d+)%?\s*(?:\|\s*FACTORS:\s*([^\]|]+))?\s*(?:\|\s*ACTIONS:\s*([^\]]+))?\]/i
  const match = response.match(comprehensivePattern)

  if (match) {
    const level = match[1].toUpperCase() as "LOW" | "MEDIUM" | "HIGH"
    const percentage = Number.parseInt(match[2], 10)

    // Parse factors if present
    let factors: RiskFactor[] | undefined
    if (match[3]) {
      factors = parseFactors(match[3])
    }

    // Parse recommendations if present
    let recommendations: Recommendation[] | undefined
    if (match[4]) {
      recommendations = parseRecommendations(match[4])
    }

    return {
      level,
      percentage: Math.min(100, Math.max(0, percentage)),
      factors: factors || generateDefaultFactors(percentage),
      recommendations: recommendations || generateDefaultRecommendations(level, percentage),
    }
  }

  // Fallback: Simple risk pattern
  const simplePattern = /\[RISK:\s*(LOW|MEDIUM|HIGH)\s*-\s*(\d+)%?\]/i
  const simpleMatch = response.match(simplePattern)

  if (simpleMatch) {
    const level = simpleMatch[1].toUpperCase() as "LOW" | "MEDIUM" | "HIGH"
    const percentage = Number.parseInt(simpleMatch[2], 10)

    return {
      level,
      percentage: Math.min(100, Math.max(0, percentage)),
      factors: generateDefaultFactors(percentage),
      recommendations: generateDefaultRecommendations(level, percentage),
    }
  }

  // Fallback: Analyze content for risk indicators
  const riskFromContent = analyzeContentForRisk(response)
  if (riskFromContent) {
    return riskFromContent
  }

  return null
}

function parseFactors(factorString: string): RiskFactor[] {
  const factors: RiskFactor[] = []
  const factorMap: { [key: string]: { name: string; icon: "clock" | "map" | "person" | "eye" } } = {
    time: { name: "Time of Day Risk", icon: "clock" },
    location: { name: "Location Familiarity", icon: "map" },
    alone: { name: "Alone Status", icon: "person" },
    visibility: { name: "Environment Visibility", icon: "eye" },
  }

  const parts = factorString.split(",")
  for (const part of parts) {
    const [key, value] = part.trim().split(":")
    if (key && value && factorMap[key.toLowerCase()]) {
      const levelMatch = value.match(/(LOW|MEDIUM|HIGH)(?:\s*-?\s*(\d+))?/i)
      if (levelMatch) {
        const level = levelMatch[1].toUpperCase() as "LOW" | "MEDIUM" | "HIGH"
        const percentage = levelMatch[2] ? Number.parseInt(levelMatch[2], 10) : getDefaultPercentage(level)

        factors.push({
          ...factorMap[key.toLowerCase()],
          level,
          percentage,
        })
      }
    }
  }

  return factors.length > 0 ? factors : generateDefaultFactors(50)
}

function parseRecommendations(actionString: string): Recommendation[] {
  const recommendations: Recommendation[] = []
  const iconMap: { [key: string]: "shield" | "phone" | "map-pin" | "users" | "alert" | "move" } = {
    call: "phone",
    phone: "phone",
    share: "map-pin",
    location: "map-pin",
    friend: "users",
    contact: "users",
    move: "move",
    leave: "move",
    alert: "alert",
    sos: "alert",
    safe: "shield",
    stay: "shield",
  }

  const parts = actionString.split(";")
  for (let i = 0; i < Math.min(parts.length, 3); i++) {
    const part = parts[i].trim()
    const priorityMatch = part.match(/^(\d+)\.?\s*(.+)/)

    if (priorityMatch) {
      const action = priorityMatch[2].trim()
      let icon: "shield" | "phone" | "map-pin" | "users" | "alert" | "move" = "shield"

      // Determine icon based on keywords
      for (const [keyword, iconType] of Object.entries(iconMap)) {
        if (action.toLowerCase().includes(keyword)) {
          icon = iconType
          break
        }
      }

      recommendations.push({
        priority: i + 1,
        action,
        icon,
      })
    } else if (part.length > 0) {
      recommendations.push({
        priority: i + 1,
        action: part,
        icon: "shield",
      })
    }
  }

  return recommendations.length > 0 ? recommendations : generateDefaultRecommendations("MEDIUM", 50)
}

function getDefaultPercentage(level: "LOW" | "MEDIUM" | "HIGH"): number {
  switch (level) {
    case "LOW":
      return Math.floor(Math.random() * 20) + 10
    case "MEDIUM":
      return Math.floor(Math.random() * 25) + 40
    case "HIGH":
      return Math.floor(Math.random() * 20) + 75
  }
}

function generateDefaultFactors(overallPercentage: number): RiskFactor[] {
  const baseLevel = overallPercentage <= 33 ? "LOW" : overallPercentage <= 66 ? "MEDIUM" : "HIGH"

  // Generate varied but correlated factor levels
  const getVariedLevel = (): "LOW" | "MEDIUM" | "HIGH" => {
    const rand = Math.random()
    if (baseLevel === "LOW") {
      return rand < 0.7 ? "LOW" : "MEDIUM"
    } else if (baseLevel === "MEDIUM") {
      return rand < 0.3 ? "LOW" : rand < 0.8 ? "MEDIUM" : "HIGH"
    } else {
      return rand < 0.3 ? "MEDIUM" : "HIGH"
    }
  }

  return [
    {
      name: "Time of Day Risk",
      icon: "clock",
      level: getVariedLevel(),
      percentage: Math.max(5, Math.min(95, overallPercentage + (Math.random() * 20 - 10))),
    },
    {
      name: "Location Familiarity",
      icon: "map",
      level: getVariedLevel(),
      percentage: Math.max(5, Math.min(95, overallPercentage + (Math.random() * 20 - 10))),
    },
    {
      name: "Alone Status",
      icon: "person",
      level: getVariedLevel(),
      percentage: Math.max(5, Math.min(95, overallPercentage + (Math.random() * 20 - 10))),
    },
    {
      name: "Environment Visibility",
      icon: "eye",
      level: getVariedLevel(),
      percentage: Math.max(5, Math.min(95, overallPercentage + (Math.random() * 20 - 10))),
    },
  ]
}

function generateDefaultRecommendations(level: "LOW" | "MEDIUM" | "HIGH", percentage: number): Recommendation[] {
  if (level === "HIGH" || percentage > 66) {
    return [
      { priority: 1, action: "Contact emergency services or someone you trust immediately", icon: "phone" },
      { priority: 2, action: "Move to a safe, well-lit public area if possible", icon: "move" },
      { priority: 3, action: "Activate SOS to share your location with emergency contacts", icon: "alert" },
    ]
  } else if (level === "MEDIUM" || percentage > 33) {
    return [
      { priority: 1, action: "Share your live location with a trusted friend or family member", icon: "map-pin" },
      { priority: 2, action: "Stay in well-lit areas and be aware of your surroundings", icon: "shield" },
      { priority: 3, action: "Keep your phone charged and easily accessible", icon: "phone" },
    ]
  } else {
    return [
      { priority: 1, action: "Continue staying aware of your surroundings", icon: "shield" },
      { priority: 2, action: "Keep emergency contacts easily accessible", icon: "users" },
      { priority: 3, action: "Trust your instincts if something feels off", icon: "alert" },
    ]
  }
}

function analyzeContentForRisk(response: string): RiskAssessment | null {
  const lowerResponse = response.toLowerCase()

  // High risk indicators
  const highRiskWords = [
    "immediate danger",
    "call police",
    "emergency",
    "being followed",
    "threatened",
    "attack",
    "assault",
    "violence",
    "urgent",
    "get help now",
    "leave immediately",
    "domestic violence",
    "stalking",
    "harassed",
  ]

  // Medium risk indicators
  const mediumRiskWords = [
    "be careful",
    "stay alert",
    "trust your instincts",
    "potentially unsafe",
    "unfamiliar area",
    "alone at night",
    "cautious",
    "concerning",
    "share your location",
    "uncomfortable",
    "uneasy",
    "nervous",
  ]

  // Low risk / safe indicators
  const lowRiskWords = [
    "safe",
    "glad you're okay",
    "relieved",
    "good to hear",
    "no immediate concern",
    "stay safe",
    "doing well",
    "secure",
    "comfortable",
  ]

  let highScore = 0
  let mediumScore = 0
  let lowScore = 0

  highRiskWords.forEach((word) => {
    if (lowerResponse.includes(word)) highScore++
  })
  mediumRiskWords.forEach((word) => {
    if (lowerResponse.includes(word)) mediumScore++
  })
  lowRiskWords.forEach((word) => {
    if (lowerResponse.includes(word)) lowScore++
  })

  if (highScore > mediumScore && highScore > lowScore) {
    const percentage = Math.min(100, 70 + highScore * 5)
    return {
      level: "HIGH",
      percentage,
      factors: generateDefaultFactors(percentage),
      recommendations: generateDefaultRecommendations("HIGH", percentage),
    }
  } else if (mediumScore > lowScore) {
    const percentage = Math.min(66, 35 + mediumScore * 5)
    return {
      level: "MEDIUM",
      percentage,
      factors: generateDefaultFactors(percentage),
      recommendations: generateDefaultRecommendations("MEDIUM", percentage),
    }
  } else if (lowScore > 0) {
    const percentage = Math.max(10, 25 - lowScore * 3)
    return {
      level: "LOW",
      percentage,
      factors: generateDefaultFactors(percentage),
      recommendations: generateDefaultRecommendations("LOW", percentage),
    }
  }

  return null
}

export function removeRiskTag(response: string): string {
  // Remove the comprehensive risk tag from the displayed message
  return response
    .replace(/\[RISK:\s*(LOW|MEDIUM|HIGH)\s*-\s*\d+%?\s*(?:\|\s*FACTORS:[^\]]+)?\s*(?:\|\s*ACTIONS:[^\]]+)?\]/gi, "")
    .replace(/\[RISK:\s*(LOW|MEDIUM|HIGH)\s*-\s*\d+%?\]/gi, "")
    .trim()
}
