import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { BookMarked } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-md flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <Link href="/" className="font-semibold text-lg text-gray-900 cursor-pointer">
              FlashKnowledge
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/saved" 
              className={`px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center ${
                location === "/saved" 
                  ? "text-primary-600" 
                  : "text-gray-700 hover:text-primary-600"
              }`}
            >
              <BookMarked className="h-5 w-5 mr-1" />
              Saved
            </Link>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
