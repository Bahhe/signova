import * as React from 'react'
import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { getSessionServerFn } from '#/lib/server-auth'
import { ThemeToggle } from '#/components/theme-toggle'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { DirectionProvider } from '#/components/direction-provider'
import { Lock, Mail, User, AlertCircle, ArrowRight, Store } from 'lucide-react'

interface LoginSearchParams {
  redirect?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearchParams => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const session = await getSessionServerFn()
    if (session) {
      throw redirect({
        to: (search.redirect as string) || '/',
      })
    }
  },
  head: () => ({
    meta: [
      { title: 'Sign In | SignovaPub' },
      {
        name: 'description',
        content: 'Sign in to access your SignovaPub product dashboard.',
      },
    ],
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const redirectTarget = search.redirect || '/'

  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin')
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your full name.')
          setIsLoading(false)
          return
        }

        const res = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        })

        if (res.error) {
          setError(
            res.error.message || 'Failed to create account. Please try again.',
          )
          setIsLoading(false)
          return
        }
      } else {
        const res = await authClient.signIn.email({
          email: email.trim(),
          password,
        })

        if (res.error) {
          setError(res.error.message || 'Invalid email or password.')
          setIsLoading(false)
          return
        }
      }

      // Successful auth - redirect
      await navigate({ to: redirectTarget })
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err?.message || 'An unexpected authentication error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DirectionProvider dir="ltr">
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        {/* Top Navigation */}
        <header className="border-b border-border bg-card/60 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                S
              </div>
              <span className="font-bold text-base tracking-tight">
                Signova
              </span>
            </a>

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
          <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 shadow-xl border-border bg-card/90">
            <div className="text-center space-y-2">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                <Lock className="size-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {mode === 'signin'
                  ? 'Sign in to SignovaPub'
                  : 'Create your account'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {mode === 'signin'
                  ? 'Enter your credentials to access the admin dashboard'
                  : 'Get started by creating your administrator account'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-muted rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError(null)
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Name
                  </label>
                  <div className="relative">
                    <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    placeholder={
                      mode === 'signup' ? 'At least 8 characters' : '••••••••'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 gap-2 text-sm font-semibold"
                disabled={isLoading}
              >
                <span>
                  {isLoading
                    ? 'Please wait...'
                    : mode === 'signin'
                      ? 'Sign In'
                      : 'Create Account'}
                </span>
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
          SignovaPub • High-Converting Product Generator & Admin Dashboard
        </footer>
      </div>
    </DirectionProvider>
  )
}
