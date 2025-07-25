import { Outlet, createRootRouteWithContext } from '@tanstack/solid-router'
import { AuthProvider } from "../contexts/AuthContext"

export const Route = createRootRouteWithContext()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
