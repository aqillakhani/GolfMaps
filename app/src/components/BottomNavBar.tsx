import { useLocation, useNavigate } from "react-router-dom";
import { Search, LayoutGrid, Flag } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { id: "search", label: "Search", icon: Search, path: "/search" },
  { id: "collection", label: "Collection", icon: LayoutGrid, path: "/collection" },
  { id: "mylist", label: "My List", icon: Flag, path: "/my-list" },
] as const;

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: "#F8F5EE", paddingBottom: "var(--sab, 0px)" }}>
      <div className="flex items-center justify-around h-16 max-w-md mx-auto border-t" style={{ borderColor: "hsl(100 15% 85%)" }}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 px-6 py-2"
            >
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: isActive ? "#1A5C2A" : "#9ca3af" }}
              />
              <span
                className="text-[10px] font-semibold transition-colors"
                style={{ color: isActive ? "#1A5C2A" : "#9ca3af" }}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavBar;
