import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Package,
  Plus,
  Store,
  ExternalLink,
  LogOut,
  FolderOpen,
  Sparkles,
  Users,
  Settings,
  BarChart3,
} from 'lucide-react'
import type { Product } from '#/lib/types'
import { authClient } from '#/lib/auth-client'
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
  currentRoute?: 'products' | 'users' | 'settings' | 'pixel'
  selectedCategory?: string
  onSelectCategory?: (category: string) => void
  onNewProduct?: () => void
}

export function DashboardSidebar({
  products,
  currentRoute = 'products',
  selectedCategory = 'All',
  onSelectCategory,
  onNewProduct,
}: DashboardSidebarProps) {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()

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

  const handleNewProductClick = () => {
    if (onNewProduct) {
      onNewProduct()
    } else {
      void navigate({ to: '/' })
    }
  }

  const userInitials = session?.user.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user.email.charAt(0).toUpperCase() || 'A'

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      {/* Brand Header */}
      <SidebarHeader className="border-b border-border/60 p-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            S
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sm tracking-tight truncate leading-tight">
              SignovaPub
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
                  <a
                    href="/"
                    onClick={(e) => {
                      if (currentRoute === 'products' && onSelectCategory) {
                        e.preventDefault()
                        onSelectCategory('All')
                      }
                    }}
                  >
                    <Package className="size-4" />
                    <span>All Products</span>
                  </a>
                </SidebarMenuButton>
                <SidebarMenuBadge>{products.length}</SidebarMenuBadge>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleNewProductClick}
                  tooltip="New Product"
                >
                  <Plus className="size-4" />
                  <span>New Product</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentRoute === 'users'}
                  tooltip="User Management"
                >
                  <a href="/users">
                    <Users className="size-4" />
                    <span>Users & Roles</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentRoute === 'settings'}
                  tooltip="Storefront & Footer Settings"
                >
                  <a href="/settings">
                    <Settings className="size-4" />
                    <span>Storefront & Footer</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={currentRoute === 'pixel'}
                  tooltip="Meta Pixel Integration"
                >
                  <a href="/pixel">
                    <BarChart3 className="size-4" />
                    <span>Meta Pixel</span>
                  </a>
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
                  <a href="/p">
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
            </div>

            <Button
              variant="outline"
              size="xs"
              onClick={handleSignOut}
              className="w-full justify-start h-8 gap-2 text-xs text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 truncate"
              title="Sign out"
            >
              <LogOut className="size-3.5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden truncate">
                Sign Out
              </span>
            </Button>
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
