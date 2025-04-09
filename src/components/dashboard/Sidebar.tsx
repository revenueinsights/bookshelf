// components/dashboard/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BarChart2, 
  Package, 
  Book, 
  QrCode, 
  Settings, 
  Menu, 
  X 
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Batches', href: '/dashboard/batches', icon: Package },
    { name: 'Books', href: '/dashboard/books', icon: Book },
    { name: 'Scanner', href: '/dashboard/scanner', icon: QrCode },
    { name: 'Batch Scanner', href: '/dashboard/batch-scanner', icon: QrCode },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
    
  ];

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 z-40 p-4 md:hidden">
        <button
          type="button"
          className="p-2 text-gray-500 rounded-md hover:text-gray-900 focus:outline-none"
          onClick={toggleSidebar}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar for mobile (off-canvas) */}
      <div
        className={`fixed inset-0 z-50 bg-gray-800 bg-opacity-75 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-gray-900 dark:text-white">BookShelf</span>
          </Link>
          <button
            type="button"
            className="p-2 text-gray-500 rounded-md hover:text-gray-900 focus:outline-none md:hidden"
            onClick={toggleSidebar}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-4 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-3 text-base font-medium rounded-md transition-colors ${
                      active
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${active ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;