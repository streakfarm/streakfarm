import { Home, Trophy, User, ListTodo } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-6 py-3 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center space-y-1 transition-colors ${
            isActive("/") ? "text-green-400" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs">Home</span>
        </button>

        <button
          onClick={() => navigate("/tasks")}
          className={`flex flex-col items-center space-y-1 transition-colors ${
            isActive("/tasks") ? "text-green-400" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <ListTodo className="h-6 w-6" />
          <span className="text-xs">Tasks</span>
        </button>

        <button
          onClick={() => navigate("/leaderboard")}
          className={`flex flex-col items-center space-y-1 transition-colors ${
            isActive("/leaderboard") ? "text-green-400" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <Trophy className="h-6 w-6" />
          <span className="text-xs">Leaderboard</span>
        </button>

        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center space-y-1 transition-colors ${
            isActive("/profile") ? "text-green-400" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
