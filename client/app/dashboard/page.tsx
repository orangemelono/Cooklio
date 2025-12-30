'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated by checking for tokens
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      // If not authenticated, redirect to login
      router.push('/login');
      return;
    }

    // In a real app, you would fetch user data from an API
    // For now, we'll just get basic info from the token
    try {
      const tokenPayload = accessToken.split('.')[1];
      const decodedPayload = JSON.parse(atob(tokenPayload));
      setUser({
        id: decodedPayload.userId,
        email: decodedPayload.email
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold text-gray-900">Cooklio</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/recipes" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                My Recipes
              </Link>
            </li>
            <li>
              <Link href="/meal-planner" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                Meal Planner
              </Link>
            </li>
            <li>
              <Link href="/shopping-list" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                Shopping List
              </Link>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64">
          <div className="p-4 border-t">
            <Link
              href="/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              Settings
            </Link>
          </div>
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Cooklio!</h2>
                <p className="text-gray-600 mb-4">Your culinary companion for recipes and meal planning</p>
                <div className="mt-6">
                  <Link
                    href="/"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Explore Features
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}