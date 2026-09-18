import { useNavigate } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { LogOut, User } from 'lucide-react'

export default function BetterAuthHeader() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="h-8 w-24 bg-muted/60 rounded-lg animate-pulse" />
    )
  }

  if (session?.user) {
    const initials = session.user.name
      ? session.user.name.charAt(0).toUpperCase()
      : session.user.email.charAt(0).toUpperCase()

    const handleSignOut = async () => {
      await authClient.signOut()
      void navigate({ to: '/login' })
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-muted/50 border border-border text-xs">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px]">
              {initials}
            </div>
          )}
          <span className="font-medium text-foreground max-w-[120px] truncate hidden sm:inline">
            {session.user.name || session.user.email}
          </span>
          {(session.user as { role?: string }).role === 'admin' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-primary text-primary-foreground tracking-wide">
              Admin
            </span>
          )}
        </div>

        <Button
          size="xs"
          variant="outline"
          onClick={handleSignOut}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="xs"
      variant="outline"
      onClick={() => {
        void navigate({ to: '/login' })
      }}
      className="h-8 gap-1 text-xs"
    >
      <User className="size-3.5" />
      <span>Sign In</span>
    </Button>
  )
}
