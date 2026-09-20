import * as React from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  User,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Store,
  Clock,
} from 'lucide-react'
import { getSessionServerFn } from '#/lib/server-auth'
import { getProductsServerFn } from '#/lib/server-products'
import {
  getUsersServerFn,
  setUserRoleServerFn,
  deleteUserServerFn,
} from '#/lib/server-users'
import type { UserRecord } from '#/lib/server-users'
import { useProducts } from '#/lib/use-products'
import { ThemeToggle } from '#/components/theme-toggle'
import { toast } from '#/components/ui/sonner'
import { Button } from '#/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Separator } from '#/components/ui/separator'
import { Card } from '#/components/ui/card'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { DashboardSidebar } from '#/components/dashboard-sidebar'
import { DirectionProvider } from '#/components/direction-provider'
import { getShopUrl } from '#/lib/domain'

export const Route = createFileRoute('/dashboard/users')({
  beforeLoad: async () => {
    const session = await getSessionServerFn()
    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: '/dashboard/users',
        },
      })
    }

    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      throw redirect({
        to: '/unauthorized',
      })
    }

    return {
      session,
    }
  },
  loader: async () => {
    try {
      const [users, products] = await Promise.all([
        getUsersServerFn(),
        getProductsServerFn().catch(() => []),
      ])
      return { initialUsers: users, initialProducts: products }
    } catch {
      return { initialUsers: [], initialProducts: [] }
    }
  },
  head: () => ({
    meta: [
      { title: 'User Management | SignovaPub Admin' },
      {
        name: 'description',
        content: 'Manage users and assign administrator privileges.',
      },
    ],
  }),
  component: UsersManagementPage,
})

function UsersManagementPage() {
  const router = useRouter()
  const { session } = Route.useRouteContext()
  const { initialUsers, initialProducts } = Route.useLoaderData()
  const { products } = useProducts(initialProducts)

  const [users, setUsers] = React.useState<UserRecord[]>(initialUsers)
  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<'all' | 'admin' | 'user'>(
    'all',
  )
  const [loadingUserId, setLoadingUserId] = React.useState<string | null>(null)
  const [statusFeedback, setStatusFeedback] = React.useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Keep state updated if loader re-runs
  React.useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const totalUsers = users.length
  const adminCount = users.filter((u) => u.role === 'admin').length
  const regularCount = users.filter((u) => u.role !== 'admin').length

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'admin' && u.role === 'admin') ||
        (roleFilter === 'user' && u.role !== 'admin')

      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const targetRole: 'admin' | 'user' =
      currentRole === 'admin' ? 'user' : 'admin'

    if (userId === session.user.id && targetRole === 'user') {
      const msg = 'Safety rule: You cannot demote yourself from the admin role.'
      setStatusFeedback({
        type: 'error',
        message: msg,
      })
      toast.error(msg)
      return
    }

    setLoadingUserId(userId)
    setStatusFeedback(null)

    try {
      await setUserRoleServerFn({
        data: {
          userId,
          role: targetRole,
        },
      })

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u)),
      )

      const successMsg = `Successfully ${
        targetRole === 'admin'
          ? 'granted admin privileges to'
          : 'revoked admin privileges from'
      } user.`
      setStatusFeedback({
        type: 'success',
        message: successMsg,
      })
      toast.success(successMsg)

      await router.invalidate()
    } catch (err: any) {
      const errMsg =
        err?.message || 'Failed to update user role. Please try again.'
      setStatusFeedback({
        type: 'error',
        message: errMsg,
      })
      toast.error(errMsg)
    } finally {
      setLoadingUserId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === session.user.id) {
      const msg =
        'Safety rule: You cannot delete your own active administrator account.'
      setStatusFeedback({
        type: 'error',
        message: msg,
      })
      toast.error(msg)
      return
    }

    setLoadingUserId(userId)
    setStatusFeedback(null)

    try {
      await deleteUserServerFn({
        data: userId,
      })

      setUsers((prev) => prev.filter((u) => u.id !== userId))

      const successMsg = 'User account has been permanently removed.'
      setStatusFeedback({
        type: 'success',
        message: successMsg,
      })
      toast.success(successMsg)

      await router.invalidate()
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to delete user. Please try again.'
      setStatusFeedback({
        type: 'error',
        message: errMsg,
      })
      toast.error(errMsg)
    } finally {
      setLoadingUserId(null)
    }
  }

  const handleRefresh = async () => {
    try {
      setStatusFeedback(null)
      const freshUsers = await getUsersServerFn()
      setUsers(freshUsers)
      toast.success('User list refreshed.')
      await router.invalidate()
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to refresh user list.'
      setStatusFeedback({
        type: 'error',
        message: errMsg,
      })
      toast.error(errMsg)
    }
  }

  const formatDate = (dateInput: Date | string) => {
    try {
      const d = new Date(dateInput)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <DirectionProvider dir="ltr">
      <SidebarProvider>
        <DashboardSidebar
          products={products}
          currentRoute="users"
          session={session}
        />
        <SidebarInset className="min-h-screen bg-background text-foreground transition-colors flex flex-col">
          {/* Inset Top Bar */}
          <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <span className="font-bold text-sm tracking-tight">
                User Management
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                • Access Control & Roles
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="xs"
                onClick={handleRefresh}
                className="gap-1.5 h-8 text-xs"
                title="Refresh users list"
              >
                <RotateCw className="size-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <a
                href={getShopUrl('/')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md"
                title="View Public Showcase"
              >
                <Store className="size-3.5" />
                <span className="hidden sm:inline">Showcase</span>
              </a>
              <ThemeToggle />
            </div>
          </header>

          {/* Main Content Area */}
          <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6 w-full flex-1">
            {/* Header Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                  <Users className="size-6 text-primary" />
                  <span>Users & Permissions</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Assign administrative roles to allow team members to access
                  the dashboard and manage products.
                </p>
              </div>
            </div>

            {/* Feedback Banner */}
            {statusFeedback && (
              <div
                className={`p-3.5 rounded-lg border text-sm flex items-start gap-3 transition-all ${
                  statusFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}
              >
                {statusFeedback.type === 'success' ? (
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
                )}
                <div className="flex-1 font-medium">
                  {statusFeedback.message}
                </div>
                <button
                  type="button"
                  onClick={() => setStatusFeedback(null)}
                  className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 bg-card/80 border-border/80 shadow-xs flex items-center gap-3.5">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Total Registered
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {totalUsers}
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 border-border/80 shadow-xs flex items-center gap-3.5">
                <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Administrators
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {adminCount}
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-card/80 border-border/80 shadow-xs flex items-center gap-3.5">
                <div className="size-11 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center font-bold">
                  <User className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Standard Users
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {regularCount}
                  </p>
                </div>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-sm h-9 bg-card"
                />
              </div>

              {/* Role Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border/60 rounded-lg self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    roleFilter === 'all'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({totalUsers})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('admin')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    roleFilter === 'admin'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Admins ({adminCount})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('user')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    roleFilter === 'user'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Standard ({regularCount})
                </button>
              </div>
            </div>

            {/* Users Table / List */}
            <Card className="border border-border/80 overflow-hidden shadow-xs">
              {filteredUsers.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Users className="size-10 stroke-1 text-muted-foreground/50" />
                  <p className="font-semibold text-sm">No users found</p>
                  <p className="text-xs max-w-sm">
                    {search
                      ? `No users match "${search}". Try adjusting your search keywords.`
                      : 'No users registered yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredUsers.map((userItem) => {
                    const isCurrent = userItem.id === session.user.id
                    const isAdmin = userItem.role === 'admin'
                    const isBusy = loadingUserId === userItem.id

                    const initials = userItem.name
                      ? userItem.name.charAt(0).toUpperCase()
                      : userItem.email.charAt(0).toUpperCase()

                    return (
                      <div
                        key={userItem.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                      >
                        {/* User Info */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          {/* Avatar */}
                          <div
                            className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                              isAdmin
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-muted border-border text-muted-foreground'
                            }`}
                          >
                            {initials}
                          </div>

                          {/* Name, Email, Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {userItem.name || 'Unnamed User'}
                              </span>
                              {isCurrent && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1.5 h-4 font-medium border-primary/40 text-primary bg-primary/5"
                                >
                                  You
                                </Badge>
                              )}
                              {isAdmin ? (
                                <Badge
                                  variant="default"
                                  className="gap-1 text-[11px] py-0.5 px-2 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                                >
                                  <ShieldCheck className="size-3 text-amber-600 dark:text-amber-400" />
                                  <span>Admin</span>
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="gap-1 text-[11px] py-0.5 px-2"
                                >
                                  <User className="size-3 text-muted-foreground" />
                                  <span>User</span>
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              <span className="truncate">{userItem.email}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                <span>
                                  Joined {formatDate(userItem.createdAt)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {/* Role Toggle Button */}
                          <Button
                            size="sm"
                            variant={isAdmin ? 'outline' : 'default'}
                            disabled={isBusy || (isCurrent && isAdmin)}
                            onClick={() =>
                              handleRoleToggle(userItem.id, userItem.role)
                            }
                            title={
                              isCurrent && isAdmin
                                ? 'You cannot demote yourself'
                                : isAdmin
                                  ? 'Revoke admin access'
                                  : 'Grant admin access'
                            }
                            className={`h-8 text-xs gap-1.5 font-medium ${
                              isAdmin
                                ? 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                                : ''
                            }`}
                          >
                            {isBusy ? (
                              <RotateCw className="size-3.5 animate-spin" />
                            ) : isAdmin ? (
                              <ShieldAlert className="size-3.5" />
                            ) : (
                              <ShieldCheck className="size-3.5" />
                            )}
                            <span>
                              {isBusy
                                ? 'Updating...'
                                : isAdmin
                                  ? 'Remove Admin'
                                  : 'Make Admin'}
                            </span>
                          </Button>

                          {/* Delete User Button with AlertDialog */}
                          {!isCurrent && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isBusy}
                                  title="Delete user account"
                                  className="h-8 size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete User Account?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete{' '}
                                    <span className="font-semibold text-foreground">
                                      {userItem.name || userItem.email}
                                    </span>
                                    ? This action cannot be undone and will
                                    permanently remove their account and revoke
                                    all administrative access immediately.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    variant="destructive"
                                    onClick={() =>
                                      handleDeleteUser(userItem.id)
                                    }
                                  >
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DirectionProvider>
  )
}
