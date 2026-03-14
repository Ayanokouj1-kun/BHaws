import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus,
  Search,
  Shield,
  Trash2,
  Edit,
  Clock,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import type { User as UserType } from "@/types";

const AccountsPage = () => {
  const {
    profiles,
    boarders,
    auditLogs,
    user: currentUser,
    addUser,
    deleteUser,
    updateUserRole,
    isLoading,
  } = useData();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    fullName: "",
    role: "Staff" as "Admin" | "Staff" | "Boarder",
    boarderId: "",
  });

  const getLastActivity = (fullName: string) => {
    const found = auditLogs
      .filter((log) => log.performedBy === fullName)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
    return found
      ? new Date(found.timestamp).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "—";
  };

  const filtered = profiles.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.username.toLowerCase().includes(term) ||
      p.fullName.toLowerCase().includes(term) ||
      p.role.toLowerCase().includes(term)
    );
  });

  const handleCreate = () => {
    const usernameClean = newUser.username.trim().toLowerCase();
    if (!usernameClean) {
      toast.error("Username is required");
      return;
    }
    if (!newUser.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    addUser({
      username: usernameClean,
      fullName: newUser.fullName.trim(),
      role: newUser.role,
      boarderId: newUser.role === "Boarder" ? newUser.boarderId || undefined : undefined,
    });
    setCreateOpen(false);
    setNewUser({ username: "", fullName: "", role: "Staff", boarderId: "" });
  };

  const handleDelete = (profile: UserType) => {
    if (profile.id === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (!confirm(`Remove account "${profile.fullName}" (${profile.username})? This cannot be undone.`)) return;
    deleteUser(profile.id);
  };

  const isSuper = (profile: UserType) =>
    profile.username === "admin" || profile.username === "staff";

  const roleBadgeClass = (role: string) =>
    role === "Admin"
      ? "bg-accent/10 text-accent border-accent/20"
      : role === "Staff"
        ? "bg-success/10 text-success border-success/20"
        : "bg-warning/10 text-warning border-warning/20";

  if (currentUser?.role !== "Admin") {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center text-destructive font-semibold">
          Access denied. Admin only.
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-header">Accounts</h1>
            <p className="page-subtitle">
              Create and monitor user accounts (Admin, Staff, Boarder)
            </p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" /> Create Account
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserCog className="h-4 w-4 text-accent" /> All Accounts
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Database accounts. Built-in admin/staff (if used) are not listed here.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-[11px]">User</TableHead>
                  <TableHead className="text-[11px]">Username</TableHead>
                  <TableHead className="text-[11px]">Role</TableHead>
                  <TableHead className="text-[11px]">Last Activity</TableHead>
                  <TableHead className="w-[180px] text-right text-[11px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No accounts found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold overflow-hidden">
                            {profile.profilePhoto ? (
                              <img src={profile.profilePhoto} alt={profile.fullName} className="h-full w-full object-cover" />
                            ) : (
                              profile.fullName.charAt(0)
                            )}
                          </div>
                          <span className="font-medium text-sm">{profile.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {profile.username}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase ${roleBadgeClass(profile.role)}`}
                          >
                            {profile.role}
                          </Badge>
                          {isSuper(profile) && (
                            <Badge variant="outline" className="text-[9px] font-bold uppercase bg-accent/10 text-accent border-accent/30">
                              Super
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {getLastActivity(profile.fullName)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Select
                            value={profile.role}
                            onValueChange={(val) =>
                              updateUserRole(profile.id, val as "Admin" | "Staff" | "Boarder")
                            }
                            disabled={profile.id === currentUser?.id || isSuper(profile)}
                          >
                            <SelectTrigger className="w-[100px] h-8 text-[11px]">
                              <Edit className="h-3 w-3 mr-1" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Staff">Staff</SelectItem>
                              <SelectItem value="Boarder">Boarder</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(profile)}
                            disabled={profile.id === currentUser?.id || isSuper(profile)}
                            title="Delete account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" /> Create Account
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              New user logs in with username as password (e.g. username: juan, password: juan).
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Username *</Label>
              <Input
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })}
                placeholder="e.g. juan"
              />
            </div>
            <div className="grid gap-2">
              <Label>Full Name *</Label>
              <Input
                value={newUser.fullName}
                onChange={(e) =>
                  setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="e.g. Juan Dela Cruz"
              />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) =>
                  setNewUser({
                    ...newUser,
                    role: v as "Admin" | "Staff" | "Boarder",
                    boarderId: v !== "Boarder" ? "" : newUser.boarderId,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Boarder">Boarder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newUser.role === "Boarder" && (
              <div className="grid gap-2">
                <Label>Link to Boarder *</Label>
                <Select
                  value={newUser.boarderId}
                  onValueChange={(v) => setNewUser({ ...newUser, boarderId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a boarder..." />
                  </SelectTrigger>
                  <SelectContent>
                    {boarders
                      .filter((b) => b.status === "Active")
                      .map((b) => {
                        const isLinked = profiles.some((p) => p.boarderId === b.id);
                        return (
                          <SelectItem key={b.id} value={b.id} disabled={isLinked}>
                            {b.fullName}
                            {b.email ? ` (${b.email})` : ""}
                            {isLinked ? " (Already linked)" : ""}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <UserPlus className="h-4 w-4" /> Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AccountsPage;
