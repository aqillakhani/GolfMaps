import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-golfmaps.png";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-cream">
      <div className="px-6 pt-12 pb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-8"
        >
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-card">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-3xl font-bold text-foreground italic tracking-tight">About</h1>
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="flex flex-col items-center mb-8">
          <img src={logo} alt="GolfMaps" className="w-16 h-16 object-contain mb-3" />
          <h2 className="font-display text-2xl font-bold text-foreground italic tracking-tight">GolfMaps</h2>
          <p className="text-sm text-muted-foreground">Version 1.0.0</p>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="glass-card rounded-2xl shadow-card p-6 space-y-4 mb-6">
          <p className="text-sm text-foreground leading-relaxed">
            GolfMaps transforms the world's golf courses into stunning, print-ready works of art. Every poster is crafted from validated course data, ensuring accuracy and beauty in every detail.
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            Whether it's your home course, a bucket-list destination, or the site of your greatest round — we turn it into a keepsake you'll treasure forever.
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            Our mission is simple: celebrate the beauty of golf course design and give every golfer a way to own a piece of the courses they love.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.3)} className="glass-card rounded-2xl shadow-card p-6 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credits</h3>
          <p className="text-sm text-foreground leading-relaxed">
            Course data validated with industry-standard golf databases. Map rendering powered by custom SVG layout engines.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Made with ♥ for golfers everywhere.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.4)} className="flex justify-center gap-4 mt-8">
          <button onClick={() => navigate("/terms")} className="text-xs text-muted-foreground underline underline-offset-4">Terms of Use</button>
          <button onClick={() => navigate("/privacy")} className="text-xs text-muted-foreground underline underline-offset-4">Privacy Policy</button>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
