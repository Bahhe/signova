import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Package,
  PlusCircle,
  Store,
  ExternalLink,
  LogOut,
  FolderOpen,
  Sparkles,
  Users,
  Settings,
} from 'lucide-react'
import type { Product, StorefrontSettings } from '#/lib/types'
import { useStorefrontSettings } from '#/lib/use-storefront-settings'
import { authClient } from '#/lib/auth-client'
import { getShopUrl } from '#/lib/domain'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '#/components/ui/sidebar'
import { Button } from '#/components/ui/button'

interface DashboardSidebarProps {
  products: Product[]
  currentRoute?: 'products' | 'new-product' | 'users' | 'settings'
  selectedCategory?: string
  onSelectCategory?: (category: string) => void
  onNewProduct?: () => void
  session?: {
    user: {
      name?: string | null
      email: string
      image?: string | null
      role?: string | null
    }
  } | null
  settings?: StorefrontSettings | null
}

export function DashboardSidebar({
  products,
  currentRoute = 'products',
  selectedCategory = 'All',
  onSelectCategory,
  session: propSession,
  settings: propSettings,
}: DashboardSidebarProps) {
  const navigate = useNavigate()
  const [mounted, setMounted] = React.useState(false)
  const { data: clientSession } = authClient.useSession()
  const { settings } = useStorefrontSettings(propSettings)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Use session passed from route context (deterministic across SSR & hydration),
  // or fallback to client-side Better Auth session after initial mount
  const session = propSession ?? (mounted ? clientSession : null)

  const categories = React.useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set)
  }, [products])

  const handleSignOut = async () => {
    await authClient.signOut()
    void navigate({ to: '/login' })
  }

  const userInitials = session?.user.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user.email.charAt(0).toUpperCase() || 'A'

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      {/* Brand Header */}
      <SidebarHeader className="border-b border-border/60 p-3">
        <div className="flex items-center gap-2.5">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.storeName || 'Store Logo'}
              className="size-8 rounded-lg object-contain shrink-0 bg-background border border-border/50 p-0.5"
            />
          ) : (
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {settings?.storeName
                ? settings.storeName.charAt(0).toUpperCase()
                : 'S'}
            </div>
          )}
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sm tracking-tight truncate leading-tight">
              {settings?.storeName || 'SignovaPub'}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Admin Studio
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Management Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Studio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={
                    currentRoute === 'products' && selectedCategory === 'All'
                  }
                  tooltip="All Products"
                >
                  <Link
                    to="/dashboard"
                    onClick={(e) => {
                      if (currentRoute === 'products' && onSelectCategory) {
                        e.preventDefault()
                        onSelectCategory('All')
                      }
                    }}
                  >
                    <Package className="size-4" />
                    <span>All Products</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge>{products.length}</SidebarMenuBadge>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentRoute === 'new-product'}
                  tooltip="New Product"
                >
                  <Link to="/dashboard/new">
                    <PlusCircle className="size-4" />
                    <span>New Product</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentRoute === 'users'}
                  tooltip="User Management"
                >
                  <Link to="/dashboard/users">
                    <Users className="size-4" />
                    <span>Users & Roles</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentRoute === 'settings'}
                  tooltip="Settings"
                >
                  <Link to="/dashboard/settings">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Categories Group */}
        {categories.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="flex items-center gap-1.5">
              <FolderOpen className="size-3.5" />
              <span>Categories</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {categories.map((category) => {
                  const count = products.filter(
                    (p) => p.category === category,
                  ).length
                  const isCatActive = selectedCategory === category
                  return (
                    <SidebarMenuItem key={category}>
                      <SidebarMenuButton
                        isActive={isCatActive}
                        onClick={() =>
                          onSelectCategory?.(isCatActive ? 'All' : category)
                        }
                      >
                        <span className="truncate">{category}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>{count}</SidebarMenuBadge>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Storefront Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Public Storefront</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View Showcase">
                  <a
                    href={getShopUrl('/')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Store className="size-4" />
                    <span>View Showcase</span>
                    <ExternalLink className="ml-auto size-3 opacity-60 group-data-[collapsible=icon]:hidden" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Profile & Logout */}
      <SidebarFooter className="border-t border-border/60 p-3 overflow-x-hidden">
        {session?.user ? (
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="size-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitials}
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold truncate leading-tight">
                    {session.user.name || session.user.email}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-primary text-primary-foreground tracking-wide shrink-0">
                    Admin
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate">
                  {session.user.email}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                size="icon"
                title="Sign out"
              >
                <LogOut className="size-3.5 shrink-0" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 mr-1" />
            <span className="group-data-[collapsible=icon]:hidden">
              signovaPub Admin
            </span>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
