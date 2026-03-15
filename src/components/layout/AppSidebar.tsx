import {
  LayoutDashboard,
  DoorOpen,
  Users,
  CreditCard,
  FileBarChart,
  ClipboardList,
  Settings,
  Building2,
  Wrench,
  Receipt,
  User as UserIcon,
  UserCog,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useData } from "@/hooks/useData";

export function AppSidebar() {
  const { user } = useData();
  const role = user?.role || "Staff";

  const mainItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Rooms", url: "/rooms", icon: DoorOpen, roles: ["SuperAdmin", "Admin", "Staff"] },
    { title: "Boarders", url: "/boarders", icon: Users, roles: ["SuperAdmin", "Admin", "Staff"] },
    { title: "Payments", url: "/payments", icon: CreditCard },
    { title: "Maintenance", url: "/maintenance", icon: Wrench },
    { title: "Expenses", url: "/expenses", icon: Receipt, roles: ["SuperAdmin", "Admin", "Staff"] },
  ].filter(item => !item.roles || item.roles.includes(role));

  const systemItems = [
    { title: "Accounts", url: "/accounts", icon: UserCog, roles: ["SuperAdmin", "Admin"] },
    { title: "Reports", url: "/reports", icon: FileBarChart, roles: ["SuperAdmin", "Admin", "Staff"] },
    { title: "Audit Logs", url: "/audit-logs", icon: ClipboardList, roles: ["SuperAdmin", "Admin"] },
    { title: "Settings", url: "/settings", icon: Settings, roles: ["SuperAdmin", "Admin"] },
  ].filter(item => !item.roles || item.roles.includes(role));

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-md overflow-hidden border border-slate-100">
            <img src="/logo.png" alt="BHaws Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-sidebar-accent-foreground">BHaws</h2>
            <p className="text-[10px] text-sidebar-foreground uppercase tracking-widest">Management System</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 mb-2 px-3">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {systemItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 mb-2 px-3">System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
