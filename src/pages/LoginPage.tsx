import { useState, useEffect } from "react";
import { useData } from "@/hooks/useData";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Lock, User, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { login, user } = useData();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate("/dashboard", { replace: true });
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(username, password);
        if (success) {
            toast.success("Welcome back!");
            navigate("/dashboard");
        } else {
            toast.error("Invalid credentials.");
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] relative overflow-hidden px-4 py-4">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]" 
                     style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            </div>

            <div className="w-full max-w-[380px] relative z-10 space-y-4 animate-in fade-in zoom-in-95 duration-700">
                {/* Brand header: logo and text aligned - Preserved structure */}
                <div className="flex items-center justify-center gap-3 mb-1">
                    <div className="h-14 w-14 shrink-0 flex items-center justify-center overflow-hidden drop-shadow-sm">
                        <img src="/login.png" alt="BHaws Logo" className="h-full w-full object-contain" />
                    </div>
                    <div className="text-left">
                        <p className="text-[12px] text-slate-600 font-bold uppercase tracking-[0.2em] opacity-90">
                            Management System Portal
                        </p>
                    </div>
                </div>

                {/* Premium Glassmorphic Identity Card */}
                <Card className="border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[1.5rem] bg-white/70 backdrop-blur-2xl overflow-hidden">
                    <CardContent className="px-7 py-6 space-y-4">
                        <div className="space-y-0.5">
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Welcome back</h1>
                            <p className="text-[13px] text-slate-500">Access your management portal</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-3.5">
                            <div className="space-y-1.5">
                                <Label htmlFor="username" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider ml-1">
                                    Username
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors z-10">
                                        <User className="h-4.5 w-4.5" />
                                    </div>
                                    <Input
                                        id="username"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="h-11 w-full pl-10 rounded-xl bg-white/50 border-slate-200/60 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent/30 transition-all text-sm placeholder:text-slate-300"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider ml-1">
                                    Security Key
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors z-10">
                                        <Lock className="h-4.5 w-4.5" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-11 w-full pl-10 rounded-xl bg-white/50 border-slate-200/60 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent/30 transition-all text-sm placeholder:text-slate-300"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm shadow-lg shadow-accent/20 transition-all hover:scale-[1.01] active:scale-[0.98] mt-1 group">
                                Sign In
                                <ShieldCheck className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Refined Footer */}
                <div className="space-y-2 pt-1">
                    <div className="h-px w-10 bg-slate-200 mx-auto opacity-50" />
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">
                        © 2026 BHaws Management
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
