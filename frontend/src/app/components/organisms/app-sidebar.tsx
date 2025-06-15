"use client";
import * as React from "react";
import {
  Home,
  PlusCircle,
  Search,
  User,
  LogOut,
  Database,
  Shield,
} from "lucide-react";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/app/components/organisms/sidebar";
import Link from "next/link";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
  {
    title: "My Datasets",
    url: "/my-datasets",
    icon: Database,
  },
  {
    title: "Search",
    url: "/datasets",
    icon: Search,
  },
];

export function AppSidebar({ onOpenModal }: { onOpenModal: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Check if user is admin (case-insensitive)
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Create menu items with conditional admin link
  const menuItems = React.useMemo(() => {
    const baseItems = [...items];
    if (isAdmin) {
      baseItems.push({
        title: "Admin Panel",
        url: "/admin",
        icon: Shield,
      });
    }
    return baseItems;
  }, [isAdmin]);

  // Custom styles for menu items
  const getMenuItemStyles = (isActive: boolean) => {
    return {
      transform: isActive ? "translateX(0.25rem)" : "none",
      backgroundColor: isActive ? "hsl(210 100% 95%)" : "transparent",
      color: isActive ? "hsl(210 100% 50%)" : "inherit",
      fontWeight: isActive ? "500" : "normal",
      transition: "all 0.2s ease-in-out",
    };
  };

  // Hover styles to be applied via className
  const menuItemHoverClass =
    "transition-all duration-200 hover:translate-x-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:brightness-105";

  return (
    <Sidebar className="sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Add Dataset Button - Prominently Styled */}
            <div className="mb-4 px-2">
              <button
                onClick={onOpenModal}
                className="flex w-full items-center justify-center gap-2 rounded-md p-2.5 text-white font-medium text-sm transition-all duration-300 hover:opacity-95 hover:shadow-md relative overflow-hidden active:scale-[0.98] active:shadow-inner"
                style={{
                  backgroundColor: "hsl(210 100% 50%)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow:
                    "0 2px 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                }}
              >
                {/* Glossy/shine effect overlay */}
                <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none transition-opacity duration-200 active:opacity-0" />

                <PlusCircle className="h-5 w-5" />
                <span>Add Dataset</span>
              </button>
            </div>

            <SidebarMenu className="flex flex-col space-y-1">
              {menuItems.map((item, index) => {
                const isActive =
                  pathname === item.url ||
                  (item.url === "/admin" && pathname.startsWith("/admin"));
                const isAdminItem = item.url === "/admin";
                return (
                  <React.Fragment key={item.title}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`${menuItemHoverClass} ${isAdminItem ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" : ""}`}
                        style={getMenuItemStyles(isActive)}
                      >
                        <Link href={item.url} className="rounded-md">
                          <item.icon
                            className={`${isActive ? "text-primary" : ""} ${isAdminItem ? "text-red-600 dark:text-red-400" : ""}`}
                          />
                          <span
                            className={
                              isAdminItem
                                ? "text-red-700 dark:text-red-300 font-medium"
                                : ""
                            }
                          >
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {index < menuItems.length - 1 && (
                      <SidebarSeparator className="my-1 opacity-30" />
                    )}
                  </React.Fragment>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="opacity-30" />

      {/* Footer with Profile Button and User Info */}
      <SidebarFooter>
        {user && (
          <div className="px-4 py-2 text-sm">
            <p className="font-medium">{user.email}</p>
            <div className="flex items-center gap-1">
              <p className="text-xs opacity-75">Role: {user.role}</p>
              {isAdmin && <Shield className="h-3 w-3 text-red-500" />}
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/profile"}
              className={menuItemHoverClass}
              style={getMenuItemStyles(pathname === "/profile")}
            >
              <Link href="/profile" className="rounded-md">
                <User
                  className={pathname === "/profile" ? "text-primary" : ""}
                />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className={menuItemHoverClass}
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Improved Sidebar Rail for Smoother Toggle */}
      <SidebarRail className="transition-all duration-300 ease-in-out" />
    </Sidebar>
  );
}
