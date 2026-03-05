import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Save, User, Mail, Phone, Globe, ShieldCheck, BellRing, Plus, Trash2, AlertCircle, Download, Upload, Database, Smartphone, QrCode, Image as ImageIcon, X } from "lucide-react";
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
  const { settings, updateSettings, announcements, addAnnouncement, deleteAnnouncement, resetData, isLoading, rooms, boarders, payments, maintenance, expenses } = useData();
  const [editInfo, setEditInfo] = useState<BhSettings>(settings);
  const [annDialog, setAnnDialog] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: "", message: "", priority: "Normal" as Announcement["priority"] });
  const [isSaving, setIsSaving] = useState(false);

  // Sync editInfo when data is finally loaded from cloud
  useEffect(() => {
    if (settings) {
      setEditInfo(settings);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await updateSettings(editInfo);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const data = {
      rooms, boarders, payments, expenses, maintenance, announcements, settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BHaws_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Database backup downloaded successfully!");
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.boarders && json.rooms && json.settings) {
          toast.success("Database successfully restored from backup! (Cloud writes locked for demo)");
        } else {
          toast.error("Invalid backup file format");
        }
      } catch (err) {
        toast.error("Failed to parse backup JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  const handleQRCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large (max 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditInfo({ ...editInfo, gcashQRCode: event.target?.result as string });
      toast.success("QR Code uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleAddAnn = async () => {
    if (!newAnn.title || !newAnn.message) { toast.error("Fill all fields"); return; }
    const success = await addAnnouncement({ ...newAnn, id: `an${Date.now()}`, createdAt: new Date().toISOString().split("T")[0] });
    if (success) {
      toast.success("Announcement posted");
      setAnnDialog(false);
      setNewAnn({ title: "", message: "", priority: "Normal" });
    }
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

        {/* GCash Settings */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Smartphone className="h-5 w-5 text-blue-600" /></div>
              <div>
                <CardTitle className="text-base">GCash Payment Details</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Configure your GCash account for online tenant payments.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> GCash Number
                </Label>
                <Input
                  value={editInfo.gcashNumber || ""}
                  onChange={e => setEditInfo({ ...editInfo, gcashNumber: e.target.value })}
                  placeholder="e.g., 09171234567"
                />
              </div>
            </div>

            <div className="grid gap-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5" /> GCash QR Code (Photo)
              </Label>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative group shrink-0">
                  <div className="h-48 w-48 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-500/50">
                    {editInfo.gcashQRCode ? (
                      <>
                        <img src={editInfo.gcashQRCode} alt="GCash QR" className="h-full w-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => setEditInfo({ ...editInfo, gcashQRCode: "" })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground text-center px-4">
                        <ImageIcon className="h-8 w-8 opacity-20" />
                        <p className="text-[10px] font-medium leading-tight">No QR code uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                    <div className="flex gap-3">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold">Important Note</p>
                        <p className="text-[10px] leading-relaxed opacity-90">
                          This photo will be displayed to all boarders when they click "Pay Online".
                          Make sure your QR code is clear and shows your registered GCash name.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="gcash-qr-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleQRCodeUpload}
                    />
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => document.getElementById("gcash-qr-upload")?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {editInfo.gcashQRCode ? "Change Photo" : "Upload QR Photo"}
                    </Button>
                    {editInfo.gcashQRCode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive font-medium h-9"
                        onClick={() => setEditInfo({ ...editInfo, gcashQRCode: "" })}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
          <CardContent className="pt-4">
            {announcements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No announcements posted yet.</p>
            )}
            <div className="max-h-[420px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {[...announcements]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(ann => (
                  <div key={ann.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-border/40 shrink-0 hover:border-accent/20 transition-all">
                    <Badge variant="outline" className={`shrink-0 text-[10px] font-bold uppercase ${priorityColors[ann.priority]}`}>{ann.priority}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ann.message}</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-1 uppercase tracking-wider">{ann.createdAt}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0 hover:bg-destructive/5 transition-colors" onClick={() => deleteAnnouncement(ann.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Database className="h-5 w-5 text-primary" /></div>
              <div>
                <CardTitle className="text-base">Data Management</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Backup your boarding house data to your local machine.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleBackup}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-accent/5 hover:border-accent/30 focus-visible:ring-1 focus-visible:ring-accent outline-none transition-all text-left shadow-sm hover:shadow cursor-pointer"
              >
                <div className="p-2 bg-accent/10 rounded-lg shrink-0">
                  <Download className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Download Backup</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Export as JSON format</p>
                </div>
              </button>
              <div>
                <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/60 focus-visible:ring-1 focus-visible:ring-ring outline-none transition-all text-left shadow-sm hover:shadow cursor-pointer"
                >
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Restore from File</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Upload previous JSON backup</p>
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Footer */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border/60 bg-muted/30 shadow-sm mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Save className="h-4 w-4 shrink-0" />
            <span>Changes will be saved to the cloud immediately.</span>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            size="lg"
            className="gap-2 px-8 shadow-md shrink-0"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <><Save className="h-4 w-4" /> Save All Settings</>
            )}
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


    </AppLayout >
  );
};

export default SettingsPage;
