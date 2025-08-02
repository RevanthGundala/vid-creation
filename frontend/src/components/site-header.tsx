import { SidebarIcon } from "lucide-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { SearchForm } from "@/components/search-form"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

interface SiteHeaderProps {
  title: string
}

export function SiteHeader({ title }: SiteHeaderProps) {
  const { toggleSidebar } = useSidebar()
  const navigate = useNavigate()
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleProjectsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowConfirmModal(true)
  }

  const handleConfirmNavigation = () => {
    setShowConfirmModal(false)
    navigate({ to: "/projects" })
  }

  const handleCancelNavigation = () => {
    setShowConfirmModal(false)
  }

  return (
    <>
      <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <button
                onClick={handleProjectsClick}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Projects
              </button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title || "My Project"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* <SearchForm className="w-full sm:ml-auto sm:w-auto" /> */}
      </div>
    </header>

    {/* Confirmation Modal */}
    {showConfirmModal && (
      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in-0 duration-200">
        <div className="bg-white rounded-lg p-6 w-full max-w-md animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Confirm Exit</h2>
            <button
              onClick={handleCancelNavigation}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to go back to the projects list? All of your changes will be saved.
            </p>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelNavigation}
                className="flex-1 transition-all duration-200 hover:scale-105"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmNavigation}
                className="flex-1 transition-all duration-200 hover:scale-105"
              >
                Go to projects
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
