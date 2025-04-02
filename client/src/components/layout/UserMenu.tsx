import { useState, useRef, useEffect } from "react";
import { logout } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
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
      await logout();
      // Firebase auth state will be handled by the AuthContext
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
        className="bg-primary-100 flex text-sm rounded-full focus:outline-none"
        onClick={toggleMenu}
      >
        <span className="sr-only">Open user menu</span>
        {user.photoURL ? (
          <img
            className="h-8 w-8 rounded-full"
            src={user.photoURL}
            alt={user.displayName || "User avatar"}
          />
        ) : (
          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary-100 text-primary-600">
            <span>{initials}</span>
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="block px-4 py-2 text-sm text-gray-700 border-b">
            <div className="font-medium">
              {user.displayName || "User"}
            </div>
            <div className="text-gray-500 truncate">
              {user.email || "No email"}
            </div>
          </div>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
            onClick={handleSignOut}
          >
            <div className="flex items-center">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sign out</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
