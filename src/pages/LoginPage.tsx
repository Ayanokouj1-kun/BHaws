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
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50/50 relative overflow-hidden px-4 py-8">
            {/* Soft Background Accents */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[80px]" />
            </div>

            <div className="w-full max-w-[360px] relative z-10 space-y-5 animate-in fade-in zoom-in duration-500">
                {/* Compact Brand Header */}
                <div className="flex flex-col items-center space-y-3">
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                        <img src="/logo.png" alt="BoardHub Logo" className="h-full w-full object-cover" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">BoardHub</h1>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 opacity-80">Management Portal</p>
                    </div>
                </div>

                {/* Streamlined Identity Card */}
                <Card className="border-none shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-[1.75rem] bg-white overflow-hidden">
                    <CardContent className="p-6 space-y-5">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="username" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                    Username
                                </Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-accent transition-colors" />
                                    <Input
                                        id="username"
                                        placeholder="Identification"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="h-10 pl-9 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-accent/5 transition-all text-xs placeholder:text-slate-200"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        Security Key
                                    </Label>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-accent transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-10 pl-9 rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-accent/5 transition-all text-xs placeholder:text-slate-200"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-10 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-xs shadow-md shadow-accent/10 transition-all active:scale-[0.98] mt-1 group">
                                Enter Terminal
                                <ShieldCheck className="ml-2 h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </Button>

                            {/* Simplified Demo Strip */}
                            <div className="pt-2">
                                <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2.5">Speed Access</p>
                                <div className="flex justify-center gap-1.5 px-0.5">
                                    {["admin", "staff", "boarder"].map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => { setUsername(role); setPassword(role); }}
                                            className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-slate-50 text-slate-400 border border-slate-100 hover:border-accent/40 hover:text-accent hover:bg-white transition-all uppercase tracking-wider capitalize"
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </form>

                        <div className="pt-2 border-t border-slate-100 mt-3">
                            <p className="text-[10px] text-slate-400 text-center mb-1">
                                New boarder? You can create your own access.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate("/signup")}
                                className="w-full text-[11px] font-semibold text-accent hover:text-accent/90 mt-1"
                            >
                                Create a boarder account
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Compact Footer */}
                <p className="text-center text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] pt-2">
                    © 2026 BoardHub Cloud • v2.6
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
