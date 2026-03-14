import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

const Login = () => {
  const navigate = useNavigate();
  const { signInWithApple, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    setError(null);
    setLoading(true);
    const fn = isSignUp ? signUpWithEmail : signInWithEmail;
    const { error } = await fn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cream flex flex-col items-center justify-center px-6">
      <motion.div {...fadeUp(0)} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">
            GolfMaps
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {/* Social login buttons */}
        <motion.div {...fadeUp(0.1)} className="space-y-3">
          <button
            onClick={signInWithApple}
            className="w-full py-4 rounded-2xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Sign in with Apple
          </button>

          <button
            onClick={signInWithGoogle}
            className="w-full py-4 rounded-2xl bg-card border border-border text-foreground font-semibold text-sm flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </motion.div>

        {/* Divider */}
        <motion.div {...fadeUp(0.15)} className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* Email form */}
        <motion.div {...fadeUp(0.2)} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary transition-all"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary transition-all"
          />
          {error && <p className="text-xs text-destructive px-1">{error}</p>}
          <button
            onClick={handleEmailAuth}
            disabled={loading || !email || !password}
            className="w-full py-4 rounded-2xl bg-gradient-green text-primary-foreground font-semibold text-sm shadow-golf disabled:opacity-50"
          >
            {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </motion.div>

        <motion.p {...fadeUp(0.25)} className="text-center text-xs text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="text-primary font-medium">
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </motion.p>

        <motion.button
          {...fadeUp(0.3)}
          onClick={() => navigate("/")}
          className="w-full text-center text-xs text-muted-foreground underline underline-offset-2"
        >
          Continue without account
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Login;
