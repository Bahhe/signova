import { Link } from '@tanstack/react-router'
import { FileQuestion, LayoutDashboard, Store } from 'lucide-react'
import { authClient } from '#/lib/auth-client'

export function NotFound() {
  const { data: session } = authClient.useSession()
  const isAdmin = (session?.user as { role?: string })?.role === 'admin'

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center text-foreground">
      <div className="size-16 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center text-muted-foreground mb-6 shadow-xs">
        <FileQuestion className="size-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/p"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
        >
          <Store className="size-3.5" />
          <span>Explore Showcase</span>
        </Link>
        {isAdmin && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-xs"
          >
            <LayoutDashboard className="size-3.5" />
            <span>Dashboard</span>
          </Link>
        )}
      </div>
    </div>
  )
}
