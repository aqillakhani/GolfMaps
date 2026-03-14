import { useApp } from "@/context/AppContext";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { isSubscribed } = useApp();
  
  if (isSubscribed) {
    return <Navigate to="/search" replace />;
  }
  
  return <Navigate to="/paywall" replace />;
};

export default Index;
