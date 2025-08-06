'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface GeoPolygon {
  id: string;
  name: string;
  polType: string;
  geometry: { type: string; coordinates: number[][][] };
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [polygons, setPolygons] = useState<GeoPolygon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, isPending: isAuthPending, error: authError, refetch } = authClient.useSession();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Ensure client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to sign-in if unauthenticated
  useEffect(() => {
    if (isMounted && !isAuthPending && !session) {
      router.replace('/sign-in'); // Use replace instead of push to avoid adding to history
    }
  }, [isMounted, isAuthPending, session, router]);

  // Fetch polygons only if authenticated
  useEffect(() => {
    if (!isMounted || isAuthPending || !session) return;

    async function fetchPolygons() {
      try {
        const res = await fetch('/api/geopolygons', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch polygons');
        }
        const data = await res.json();
        setPolygons(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchPolygons();
  }, [isMounted, isAuthPending, session]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the polygon "${name}"?`)) return;
    try {
      const res = await fetch(`/api/geopolygons/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete polygon');
      }
      setPolygons(polygons.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  // Return loading state until authentication is resolved
  if (!isMounted || isAuthPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p>Loading...</p>
      </div>
    );
  }

  // Return nothing or redirect if no session
  if (!session) {
    return null; // Prevent rendering anything before redirect
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p className="text-red-500">Error: {authError.message}</p>
        <button
          className="px-4 py-2 mt-5 rounded-sm border-1px border-solid bg-blue-700 text-white font-bold"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">GeoPolygons</h1>
      <Link
        href="/geopolygons/create"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg mb-6 hover:bg-blue-700 transition"
      >
        Create New Polygon
      </Link>
      {error && (
        <p className="text-red-500 mb-4 bg-red-50 p-3 rounded-lg">{error}</p>
      )}
      {loading ? (
        <p className="text-gray-600">Loading polygons...</p>
      ) : polygons.length === 0 ? (
        <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
          No polygons found. Create one to get started!
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-lg rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-b p-4 text-left text-gray-700 font-semibold">Name</th>
                <th className="border-b p-4 text-left text-gray-700 font-semibold">Type</th>
                <th className="border-b p-4 text-left text-gray-700 font-semibold">Geometry (Points)</th>
                <th className="border-b p-4 text-left text-gray-700 font-semibold">Created At</th>
                <th className="border-b p-4 text-left text-gray-700 font-semibold">Updated At</th>
                <th className="border-b p-4 text-left text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {polygons.map((polygon) => (
                <tr key={polygon.id} className="hover:bg-gray-50 transition">
                  <td className="border-b p-4">{polygon.name}</td>
                  <td className="border-b p-4">{polygon.polType}</td>
                  <td className="border-b p-4">
                    {polygon.geometry.coordinates[0]?.length || 0} points
                  </td>
                  <td className="border-b p-4">
                    {new Date(polygon.createdAt).toLocaleString()}
                  </td>
                  <td className="border-b p-4">
                    {new Date(polygon.updatedAt).toLocaleString()}
                  </td>
                  <td className="border-b p-4 space-x-3">
                    <Link
                      href={`/geopolygons/edit/${polygon.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(polygon.id, polygon.name)}
                      className="text-red-600 hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}