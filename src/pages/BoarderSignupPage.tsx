import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/hooks/useData";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const BoarderSignupPage = () => {
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {  } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername) {
      toast.error("Username is required.");
      return;
    }

    try {
      setIsLoading(true);

      // 1) Create basic boarder profile (starts as Inactive until admin approval)
      const { data: boarder, error: boarderError } = await supabase
        .from("boarders")
        .insert([{
          full_name: fullName,
          contact_number: contactNumber,
          email,
          status: "Inactive",
        }])
        .select()
        .single();

      if (boarderError || !boarder) {
        console.error(boarderError);
        toast.error("Could not create boarder profile.");
        return;
      }

      // 2) Create login profile linked to that boarder
      const clientId = (window.crypto && "randomUUID" in window.crypto)
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{
          id: clientId,
          username: cleanUsername,
          full_name: fullName,
          role: "Boarder",
          boarder_id: boarder.id,
        }]);

      if (profileError) {
        console.error(profileError);
        toast.error(profileError.code === "23505"
          ? "That username is already taken."
          : "Could not create login account.");
        return;
      }

      toast.success("Account created! Waiting for admin approval.");
      toast.info("Once approved by admin, you can log in using your username as password.");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while creating your account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50/50 relative overflow-hidden px-4 py-4">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-[360px] relative z-10 space-y-3 animate-in fade-in zoom-in duration-500">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </button>

        <div className="flex flex-col items-center space-y-2">
          <div className="text-center">
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">Boarder Sign Up</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-80">
              Resident Access Portal
            </p>
          </div>
        </div>

        <Card className="border-none shadow-[0_16px_28px_-18px_rgba(0,0,0,0.25)] rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Full name
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-accent transition-colors" />
                  <Input
                    id="fullName"
                    placeholder="Juan Dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 pl-9 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-accent/5 transition-all text-xs placeholder:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Contact number
                </Label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-accent transition-colors" />
                  <Input
                    id="contact"
                    placeholder="09XX XXX XXXX"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="h-10 pl-9 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-accent/5 transition-all text-xs placeholder:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Email (optional)
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-accent transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 pl-9 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-accent/5 transition-all text-xs placeholder:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-accent/5 transition-all text-xs placeholder:text-slate-200"
                  required
                />
                <p className="text-[10px] text-slate-400 ml-1 mt-0.5">
                  For now, your password will be the same as your username.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-xs shadow-md shadow-accent/10 transition-all active:scale-[0.98] mt-1 group disabled:opacity-70"
              >
                {isLoading ? "Creating account..." : "Create account"}
                <ShieldCheck className="ml-2 h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] pt-2">
          © 2026 BHaws Management System
        </p>
      </div>
    </div>
  );
};

export default BoarderSignupPage;


