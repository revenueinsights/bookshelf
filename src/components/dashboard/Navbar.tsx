// components/dashboard/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Bell, User, LogOut, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center md:hidden">
          {/* Logo only visible on mobile when sidebar is hidden */}
          <Link href="/dashboard" className="text-lg font-bold text-gray-900 dark:text-white">
            BookShelf
          </Link>
        </div>

        <div className="flex-1 md:flex-none md:ml-auto"></div>

        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            className="p-2 text-gray-500 rounded-md hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="p-2 text-gray-500 rounded-md hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center space-x-2 p-2 text-gray-500 rounded-md hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              onClick={toggleUserMenu}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <span className="sr-only">Open user menu</span>
              {user.image ? (
                <img
                  className="h-8 w-8 rounded-full"
                  src={user.image}
                  alt={user.name || "User"}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <User className="w-4 h-4" />
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.name || user.email || "User"}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                  <div className="font-medium">{user.name || "User"}</div>
                  <div className="text-gray-500 truncate">{user.email}</div>
                </div>
                <Link
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={handleSignOut}
                >
                  <div className="flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;