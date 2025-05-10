import { Home, PlusCircle, Search, User } from "lucide-react";

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
} from "@/app/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Search Datasets",
    url: "#",
    icon: Search,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Add Dataset Button - Prominently Styled */}
            <div className="mb-4 px-2">
              <button
                className="flex w-full items-center gap-2 rounded-md p-2 text-white transition-all duration-300 hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: "hsl(210 100% 50%)" }}
              >
                <PlusCircle className="h-5 w-5" />
                <span className="font-medium">Add Dataset</span>
              </button>
            </div>

            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Profile Button */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="transition-all duration-200 hover:bg-sidebar-accent hover:translate-x-1"
            >
              <a href="#">
                <User />
                <span>Profile</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Improved Sidebar Rail for Smoother Toggle */}
      <SidebarRail className="transition-all duration-300 ease-in-out" />
    </Sidebar>
  );
}
