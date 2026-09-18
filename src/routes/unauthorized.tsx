import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { getSessionServerFn } from '#/lib/server-auth'
import { authClient } from '#/lib/auth-client'
import { Card } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { ShieldAlert, LogOut, Store } from 'lucide-react'
import { ThemeToggle } from '#/components/theme-toggle'
import { DirectionProvider } from '#/components/direction-provider'

export const Route = createFileRoute('/unauthorized')({
  beforeLoad: async () => {
    const session = await getSessionServerFn()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    const role = (session.user as { role?: string }).role || 'user'
    if (role === 'admin') {
      throw redirect({ to: '/' })
    }
    return { session }
  },
  head: () => ({
    meta: [
      { title: 'Access Denied | SignovaPub' },
      { name: 'description', content: 'Administrator access required.' },
    ],
  }),
  component: UnauthorizedPage,
})

function UnauthorizedPage() {
  const navigate = useNavigate()
  const { session } = Route.useRouteContext()

  const handleSignOut = async () => {
    await authClient.signOut()
    void navigate({ to: '/login' })
  }

  const role = (session.user as { role?: string }).role || 'user'

  return (
    <DirectionProvider dir="ltr">
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        {/* Header */}
        <header className="border-b border-border bg-card/60 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                S
              </div>
              <span className="font-bold text-base tracking-tight">
                SignovaPub
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/p"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Store className="size-3.5" />
                <span>Showcase</span>
              </a>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 shadow-xl border-border bg-card/90 text-center">
            <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <ShieldAlert className="size-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Admin Access Required
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The SignovaPub dashboard and product management tools are
                restricted to users with the{' '}
                <span className="font-semibold text-foreground">admin</span>{' '}
                role.
              </p>
            </div>

            {/* User Account Info */}
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/80 text-left space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  Signed in as:
                </span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">
                  {session.user.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  Current Role:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-foreground border border-border uppercase">
                  {role}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <a
                href="/p"
                className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Store className="size-4" />
                <span>Browse Product Showcase</span>
              </a>

              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full h-10 gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-4" />
                <span>Sign out & switch account</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
          SignovaPub • Access Control & Role-Based Permissions
        </footer>
      </div>
    </DirectionProvider>
  )
}
