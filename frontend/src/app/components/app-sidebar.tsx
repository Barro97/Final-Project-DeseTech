"use client";
import * as React from "react";
import { Home, PlusCircle, Search, User, LogOut } from "lucide-react";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useRouter } from "next/navigation";

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
} from "@/app/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
  {
    title: "Search Datasets",
    url: "/datasets",
    icon: Search,
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Add Dataset Button - Prominently Styled */}
            <div className="mb-4 px-2">
              <button
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
              {items.map((item, index) => (
                <React.Fragment key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="transition-all duration-200 hover:bg-sidebar-accent hover:translate-x-1"
                    >
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {index < items.length - 1 && (
                    <SidebarSeparator className="my-1 opacity-30" />
                  )}
                </React.Fragment>
              ))}
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
            <p className="text-xs opacity-75">Role: {user.role}</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="transition-all duration-200 hover:bg-sidebar-accent hover:translate-x-1"
            >
              <a href="/profile">
                <User />
                <span>Profile</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="transition-all duration-200 hover:bg-sidebar-accent hover:translate-x-1"
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
