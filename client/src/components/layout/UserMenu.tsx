import { useState, useRef, useEffect } from "react";
import { logoutLocalUser } from "@/lib/localAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, authType } = useAuth();
  const { toast } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      // For Google simulated users, remove from localStorage
      if (localStorage.getItem("localUser")) {
        localStorage.removeItem("localUser");
        toast({
          title: "Signed out successfully",
          description: "You have been signed out.",
        });
        window.location.href = "/auth";
        return;
      }
      
      // Check if this is a test user
      const testUserJson = localStorage.getItem("testUser");
      if (testUserJson) {
        // For test user, just remove from localStorage
        localStorage.removeItem("testUser");
        window.location.href = "/auth";
        return;
      }
      
      // Handle logout based on auth type
      if (authType === 'local' || user?.isLocalUser) {
        // Local authentication logout
        logoutLocalUser();
        window.location.href = "/auth"; // Force reload to update auth state
        return;
      }
    } catch (error) {
      let message = "Failed to sign out";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
      
      // Last resort: force a page reload to clean up the session
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
    }
  };

  if (!user) {
    return null;
  }

  // Generate initials from displayName or email
  let initials = "U";
  if (user.displayName) {
    const nameParts = user.displayName.split(" ");
    if (nameParts.length > 1) {
      initials = `${nameParts[0][0]}${nameParts[1][0]}`;
    } else {
      initials = nameParts[0][0];
    }
  } else if (user.email) {
    initials = user.email[0].toUpperCase();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex text-sm rounded-full focus:outline-none transition-transform duration-200 hover:scale-105 ring-2 ring-opacity-50 ring-amber-500"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }}
        onClick={toggleMenu}
      >
        <span className="sr-only">Open user menu</span>
        {user.photoURL ? (
          <img
            className="h-9 w-9 rounded-full border-2"
            style={{ borderColor: 'var(--color-razor-crimson)' }}
            src={user.photoURL}
            alt={user.displayName || "User avatar"}
          />
        ) : (
          <div 
            className="h-9 w-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-razor-crimson)', color: 'white' }}
          >
            <span className="font-semibold">{initials}</span>
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden z-10 border border-opacity-20 backdrop-blur-md"
          style={{ 
            backgroundColor: 'rgba(38, 50, 56, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="block px-5 py-3 text-sm border-b border-opacity-20"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
          >
            <div className="font-bold text-base" style={{ color: 'var(--color-blazing-amber)' }}>
              {user.displayName || "User"}
            </div>
            <div className="text-white text-opacity-70 truncate">
              {user.email || "No email"}
            </div>
          </div>
          <button
            className="block w-full text-left px-5 py-3 text-sm text-white hover:bg-white hover:bg-opacity-10 transition-colors duration-150"
            style={{ color: 'white' }}
            role="menuitem"
            onClick={handleSignOut}
          >
            <div className="flex items-center">
              <LogOut className="h-4 w-4 mr-2" style={{ color: 'var(--color-razor-crimson)' }} />
              <span>Sign out</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
