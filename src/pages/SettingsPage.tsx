import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Save, User, Mail, Phone, Globe, ShieldCheck, BellRing, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Announcement, BhSettings } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const priorityColors: Record<string, string> = {
  Normal: "bg-muted text-muted-foreground border-border",
  Important: "bg-warning/10 text-warning border-warning/20",
  Urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

const SettingsPage = () => {
  const { settings, updateSettings, announcements, addAnnouncement, deleteAnnouncement, resetData, isLoading } = useData();
  const [editInfo, setEditInfo] = useState<BhSettings>(settings);
  const [annDialog, setAnnDialog] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: "", message: "", priority: "Normal" as Announcement["priority"] });

  const handleSave = () => {
    if (!editInfo.name || !editInfo.contact) {
      toast.error("Name and contact are required");
      return;
    }
    updateSettings(editInfo);
    toast.success("Settings saved successfully");
  };

  const handleReset = () => {
    if (confirm("⚠️ This will DELETE all data and reset the system. This action CANNOT be undone. Continue?")) {
      resetData();
    }
  };

  const handleAddAnn = () => {
    if (!newAnn.title || !newAnn.message) { toast.error("Fill all fields"); return; }
    addAnnouncement({ ...newAnn, id: `an${Date.now()}`, createdAt: new Date().toISOString().split("T")[0] });
    toast.success("Announcement posted");
    setAnnDialog(false);
    setNewAnn({ title: "", message: "", priority: "Normal" });
  };

  if (isLoading) return <AppLayout><div>Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-3xl">
        <div>
          <h1 className="page-header">Settings</h1>
          <p className="page-subtitle">Manage your boarding house configuration and preferences</p>
        </div>

        {/* Boarding House Information */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg"><Building2 className="h-5 w-5 text-accent" /></div>
              <div>
                <CardTitle className="text-base">Boarding House Information</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">This information appears on all printed reports and receipts.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 grid gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bh-name" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> House Name *
                </Label>
                <Input id="bh-name" value={editInfo.name} onChange={e => setEditInfo({ ...editInfo, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bh-owner" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> Owner Name
                </Label>
                <Input id="bh-owner" value={editInfo.ownerName || ""} onChange={e => setEditInfo({ ...editInfo, ownerName: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Address</Label>
              <Input value={editInfo.address} onChange={e => setEditInfo({ ...editInfo, address: e.target.value })} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> Contact Number *
                </Label>
                <Input value={editInfo.contact} onChange={e => setEditInfo({ ...editInfo, contact: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </Label>
                <Input type="email" value={editInfo.email} onChange={e => setEditInfo({ ...editInfo, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" /> Website (Optional)
                </Label>
                <Input value={editInfo.website || ""} onChange={e => setEditInfo({ ...editInfo, website: e.target.value })} placeholder="https://..." />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tax ID (Optional)</Label>
                <Input value={editInfo.taxId || ""} onChange={e => setEditInfo({ ...editInfo, taxId: e.target.value })} placeholder="e.g., 123-456-789" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Late Fee Settings */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg"><ShieldCheck className="h-5 w-5 text-warning" /></div>
              <div>
                <CardTitle className="text-base">Payment Policies</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Configure late fees and grace periods for overdue payments.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/40">
              <div>
                <p className="text-sm font-semibold">Enable Late Fee</p>
                <p className="text-xs text-muted-foreground">Automatically apply a fee to overdue payments</p>
              </div>
              <Switch
                checked={editInfo.lateFeeEnabled ?? true}
                onCheckedChange={v => setEditInfo({ ...editInfo, lateFeeEnabled: v })}
              />
            </div>
            {editInfo.lateFeeEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Late Fee Amount (₱)</Label>
                  <Input type="number" value={editInfo.lateFeeAmount ?? 200} onChange={e => setEditInfo({ ...editInfo, lateFeeAmount: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grace Period (Days)</Label>
                  <Input type="number" value={editInfo.gracePeriodDays ?? 5} onChange={e => setEditInfo({ ...editInfo, gracePeriodDays: Number(e.target.value) })} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg"><BellRing className="h-5 w-5 text-accent" /></div>
                <div>
                  <CardTitle className="text-base">Announcements</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Post notices for boarders and staff.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setAnnDialog(true)}>
                <Plus className="h-3.5 w-3.5" /> Post
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {announcements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No announcements posted yet.</p>
            )}
            {announcements.map(ann => (
              <div key={ann.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-border/40">
                <Badge variant="outline" className={`shrink-0 text-[10px] font-bold uppercase ${priorityColors[ann.priority]}`}>{ann.priority}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{ann.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ann.message}</p>
                  <p className="text-[9px] text-muted-foreground/50 mt-1 uppercase tracking-wider">{ann.createdAt}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteAnnouncement(ann.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save & Danger */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="gap-2 flex-1" onClick={handleSave}>
            <Save className="h-4 w-4" /> Save All Settings
          </Button>
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive" onClick={handleReset}>
            Factory Reset
          </Button>
        </div>
      </div>

      {/* Announcement Dialog */}
      <Dialog open={annDialog} onOpenChange={setAnnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={newAnn.title} onChange={e => setNewAnn({ ...newAnn, title: e.target.value })} placeholder="e.g., Water interruption notice" />
            </div>
            <div className="grid gap-2">
              <Label>Message *</Label>
              <Textarea value={newAnn.message} onChange={e => setNewAnn({ ...newAnn, message: e.target.value })} rows={4} placeholder="Write your announcement here..." />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={newAnn.priority} onValueChange={v => setNewAnn({ ...newAnn, priority: v as Announcement["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Important">Important</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnDialog(false)}>Cancel</Button>
            <Button onClick={handleAddAnn}>Post Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SettingsPage;
