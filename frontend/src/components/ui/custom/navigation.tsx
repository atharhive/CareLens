"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Home, 
  Stethoscope, 
  BarChart3, 
  MapPin, 
  Share2,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    description: "Start your health assessment"
  },
  {
    href: "/assessment",
    label: "Assessment",
    icon: Stethoscope,
    description: "Complete health evaluation"
  },
  {
    href: "/results",
    label: "Results",
    icon: BarChart3,
    description: "View your risk assessment"
  },
  {
    href: "/providers",
    label: "Find Care",
    icon: MapPin,
    description: "Locate healthcare providers"
  },
  {
    href: "/share",
    label: "Share",
    icon: Share2,
    description: "Share results securely"
  }
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">CareLens</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center space-x-2",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm">
              <span className="sr-only">Open menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link key={item.href} href={item.href}>
                <Card className={cn(
                  "cursor-pointer transition-colors",
                  isActive && "bg-primary text-primary-foreground"
                )}>
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 