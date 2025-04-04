import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { BookMarked, Brain, Sparkles } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }

  return (
    <header className="bg-transparent border-b border-opacity-20" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <div className="h-9 w-9 rounded-md flex items-center justify-center mr-3"
              style={{ backgroundColor: 'var(--color-razor-crimson)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <Link href="/" className="font-bold text-xl cursor-pointer" style={{ color: 'var(--color-blazing-amber)' }}>
              QuizGenius
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center rounded-md ${
                location === "/" 
                  ? "bg-opacity-20 bg-white text-white" 
                  : "text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10"
              }`}
            >
              <Brain className="h-5 w-5 mr-1" />
              Learn
            </Link>
            <Link 
              href="/saved" 
              className={`px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center rounded-md ${
                location === "/saved" 
                  ? "bg-opacity-20 bg-white text-white" 
                  : "text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10"
              }`}
            >
              <BookMarked className="h-5 w-5 mr-1" />
              Quiz Scores
            </Link>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
