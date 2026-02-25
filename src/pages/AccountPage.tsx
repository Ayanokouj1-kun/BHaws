import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Mail, Phone, MapPin, ShieldCheck, Camera, X } from "lucide-react";
import type { Boarder } from "@/types";
import { toast } from "sonner";

export const AccountPage = () => {
  const { user, boarders, updateBoarder } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Not signed in.
        </div>
      </AppLayout>
    );
  }

  const isBoarder = user.role === "Boarder" && user.boarderId;
  const linkedBoarder: Boarder | undefined = isBoarder
    ? boarders.find(b => b.id === user.boarderId)
    : undefined;

  const [fullName, setFullName] = useState(linkedBoarder?.fullName ?? user.fullName);
  const [email, setEmail] = useState(linkedBoarder?.email ?? "");
  const [contactNumber, setContactNumber] = useState(linkedBoarder?.contactNumber ?? "");
  const [address, setAddress] = useState(linkedBoarder?.address ?? "");
  const [emergencyContact, setEmergencyContact] = useState(linkedBoarder?.emergencyContact ?? "");
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(linkedBoarder?.profilePhoto);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!linkedBoarder) {
      toast.error("Only boarder accounts can edit profile details.");
      return;
    }

    try {
      setIsSaving(true);
      await updateBoarder({
        ...linkedBoarder,
        fullName,
        email,
        contactNumber,
        address,
        emergencyContact,
        profilePhoto,
      });
      toast.success("Account details updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update account.");
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
              <p className="font-semibold text-sm text-foreground truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
          </CardContent>
        </Card>

        {/* Editable boarder profile (only for Boarder role) */}
        {isBoarder && linkedBoarder && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" /> Personal Details
              </CardTitle>
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

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-xl px-6"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isBoarder && (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="py-6 text-sm text-muted-foreground">
              This account is a <span className="font-semibold">{user.role}</span> user. Profile photo and boarder
              details are only available for boarder accounts.
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default AccountPage;

