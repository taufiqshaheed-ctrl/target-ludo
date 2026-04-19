import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, User, Lock, ArrowLeft, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import FloatingInput from "@/components/FloatingInput";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            const data = await login(formData.email, formData.password);
            toast.success("Login successful!");

            // Redirect based on role
            if (data.user.role === 'admin') {
                navigate("/admin");
            } else {
                navigate("/home");
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex">
            <BackgroundOrbs />

            {/* Desktop left branding panel */}
            <div className="hidden md:flex flex-col justify-center items-center w-1/2 px-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <img src="/Target_ludo_logo-removebg-preview.png" alt="Logo" className="w-28 h-28 object-contain mx-auto mb-6" />
                    <h1 className="text-5xl font-black text-foreground mb-3">Target Ludo</h1>
                    <p className="text-muted-foreground text-lg">Your trusted payment platform</p>
                </motion.div>
            </div>

            {/* Right / full-width form */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-12">
                {/* Mobile logo */}
                <div className="md:hidden flex items-center gap-3 mb-8">
                    <img src="/Target_ludo_logo-removebg-preview.png" alt="Logo" className="w-10 h-10 object-contain" />
                    <span className="font-bold text-xl text-foreground">Target Ludo</span>
                </div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 md:p-12 w-full max-w-md"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4"
                        >
                            <LogIn className="w-8 h-8 text-primary" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Welcome <span className="text-gradient-primary">Back</span>
                        </h1>
                        <p className="text-muted-foreground">Sign in to Target Ludo</p>
                    </div>



                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                                <FloatingInput
                                    type="email"
                                    label="Email Address"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    className="pl-11"
                                    labelClassName="peer-focus:left-11 peer-[:not(:placeholder-shown)]:left-0 left-11"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                                <FloatingInput
                                    type={showPassword ? "text" : "password"}
                                    label="Password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange("password", e.target.value)}
                                    className="pl-11 pr-11"
                                    labelClassName="left-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </motion.div>

                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl font-semibold text-lg bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                            whileHover={!isLoading ? { scale: 1.02 } : {}}
                            whileTap={!isLoading ? { scale: 0.98 } : {}}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Sign In
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Sign Up Link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 text-center"
                    >
                        <p className="text-muted-foreground">
                            Don't have an account?{" "}
                            <Link
                                to="/signup"
                                className="text-primary hover:text-primary/80 font-semibold transition-colors"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
