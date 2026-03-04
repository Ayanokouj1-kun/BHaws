import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Mail, Phone, MapPin, ShieldCheck, Camera, X, Home, CreditCard, Calendar, AlertCircle } from "lucide-react";
import type { Boarder } from "@/types";
import { toast } from "sonner";

export const AccountPage = () => {
  const { user, boarders, payments, rooms, profiles, updateBoarder, updateProfile } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const isBoarder = user?.role === "Boarder" && user.boarderId;
  const linkedBoarder: Boarder | undefined = isBoarder
    ? boarders.find(b => b.id === user?.boarderId)
    : undefined;
  const myProfile = user ? profiles.find(p => p.id === user.id || p.username === user.username) : undefined;
  const canSaveToDb = !!myProfile || !!linkedBoarder;

  const boarderRoom = linkedBoarder
    ? rooms.find(r => r.id === linkedBoarder.assignedRoomId)
    : undefined;
  const boarderBed = linkedBoarder && boarderRoom
    ? boarderRoom.beds.find(b => b.id === linkedBoarder.assignedBedId)
    : undefined;

  const boarderPayments = isBoarder && user?.boarderId
    ? payments
        .filter(p => p.boarderId === user.boarderId)
        .sort((a, b) => {
          const dateA = new Date(a.paidDate || a.date || a.createdAt || 0).getTime();
          const dateB = new Date(b.paidDate || b.date || b.createdAt || 0).getTime();
          return dateB - dateA;
        })
    : [];
  const recentPayments = boarderPayments.slice(0, 5);

  useEffect(() => {
    if (!user) return;
    if (linkedBoarder) {
      setFullName(linkedBoarder.fullName);
      setEmail(linkedBoarder.email ?? "");
      setContactNumber(linkedBoarder.contactNumber ?? "");
      setAddress(linkedBoarder.address ?? "");
      setEmergencyContact(linkedBoarder.emergencyContact ?? "");
      setProfilePhoto(linkedBoarder.profilePhoto);
    } else {
      setFullName(user.fullName);
      setEmail(user.email ?? "");
      setContactNumber(user.phone ?? "");
      setAddress(user.address ?? "");
      setEmergencyContact(user.emergencyContact ?? "");
      setProfilePhoto(user.profilePhoto);
    }
  }, [user, linkedBoarder]);

  if (!user) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Not signed in.
        </div>
      </AppLayout>
    );
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setProfilePhoto(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!canSaveToDb) {
      toast.error("Your account is not in the database. Ask an admin to create your account under Accounts to save changes.");
      return;
    }
    try {
      setIsSaving(true);
      if (isBoarder && linkedBoarder) {
        await updateBoarder({
          ...linkedBoarder,
          fullName,
          email,
          contactNumber,
          address,
          emergencyContact,
          profilePhoto,
        });
      } else if (myProfile) {
        await updateProfile(myProfile.id, {
          fullName,
          email,
          phone: contactNumber,
          address,
          emergencyContact,
          profilePhoto,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="page-header">My Account</h1>
            <p className="page-subtitle">Manage your profile and account details</p>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">
            {user.role}
          </Badge>
        </div>

        {/* Account summary */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center overflow-hidden text-accent font-bold text-sm">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user.fullName.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{fullName || user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
          </CardContent>
        </Card>

        {/* Personal profile — editable by everyone */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" /> Personal Details
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your name, contact info, address, and profile photo. Everyone can edit this.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col items-center justify-center pb-2">
              <div className="relative group">
                <div className="h-24 w-24 rounded-2xl bg-muted border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden transition-all hover:border-accent/40">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl shadow-lg border border-border"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                {profilePhoto && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                    onClick={removePhoto}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-3">
                Profile Photo
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>

            <div className="grid gap-3">
              <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5" /> Full Name
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> Contact Number
                </Label>
                <Input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="09XX XXX XXXX"
                />
              </div>
              <div className="grid gap-3">
                <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Address
              </Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, Province"
              />
            </div>

            <div className="grid gap-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Emergency Contact
              </Label>
              <Input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Name - Contact number"
              />
            </div>

            {!canSaveToDb && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Your account is not in the database. Ask an admin to add you under <strong>Accounts</strong> to save changes.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || !canSaveToDb}
                className="rounded-xl px-6"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Boarder-only: Stay details & Recent payments */}
        {isBoarder && linkedBoarder && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Home className="h-4 w-4 text-accent" /> Stay Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs uppercase tracking-widest">Room</span>
                    <span className="font-semibold">{boarderRoom?.name || "Not assigned"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs uppercase tracking-widest">Bed</span>
                    <span className="font-semibold">{boarderBed?.name || "Not assigned"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Move In
                    </span>
                    <span>{linkedBoarder.moveInDate || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs uppercase tracking-widest">Status</span>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                      {linkedBoarder.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-accent" /> Recent Payments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentPayments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      You do not have any recorded payments yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {recentPayments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-xs"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-[11px]">{p.type}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {p.month || p.date || "No period set"}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[12px] font-bold">
                              ₱{p.amount.toLocaleString()}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase tracking-widest ${
                                p.status === "Paid"
                                  ? "bg-success/10 text-success border-success/30"
                                  : p.status === "Overdue"
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : "bg-warning/10 text-warning border-warning/30"
                              }`}
                            >
                              {p.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground">
                        For full history, go to the <span className="font-semibold">Payments</span> page.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default AccountPage;

