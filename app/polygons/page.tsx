'use client'

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PolygonTable from './polygonTable';
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type Polygon = { 
  id: string; 
  name: string; 
  munId: string;
  provId: string; 
  points: { lat: number; long: number }[];
  municipality: { id: string; municipalityName: string; };
  province: { id: string; provinceName: string; };
}

export default function Home() {
  const router = useRouter();
  const { data: session, isPending: isAuthPending, error: authError, refetch } = authClient.useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [isLoadingPolygons, setIsLoadingPolygons] = useState(true);
  const [polygonError, setPolygonError] = useState<string | null>(null);

  // Ensure client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to sign-in if unauthenticated
  useEffect(() => {
    if (isMounted && !isAuthPending && !session) {
      router.push("/sign-in");
    }
  }, [isMounted, isAuthPending, session, router]);

  // Fetch polygons
  useEffect(() => {
    const fetchPolygons = async () => {
      setIsLoadingPolygons(true);
      setPolygonError(null);
      try {
        const response = await fetch(`http://localhost:3001/api/polygons`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch polygons');
        }

        const polygonsData = await response.json();
        // Optional: Validate polygonsData with a schema (e.g., Zod)
        setPolygons(polygonsData);
      } catch (err) {
        setPolygonError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoadingPolygons(false);
      }
    };

    if (isMounted && session) {
      fetchPolygons();
    }
  }, [isMounted, session]);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  if (!isMounted || isAuthPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p>Loading...</p>
      </div>
    );
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

  if (polygonError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p className="text-red-500">Error: {polygonError}</p>
        <button
          className="px-4 py-2 mt-5 rounded-sm border-1px border-solid bg-blue-700 text-white font-bold"
          onClick={() => setIsLoadingPolygons(true)} // Trigger refetch
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoadingPolygons) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p>Loading polygons...</p>
      </div>
    );
  }

  return (
    <div className='p-10'>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">GeoTAG Locations</h2>
        <div className="flex gap-4">
          <Link href="/polygons/new">
            <Button>Create Location</Button>
          </Link>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>
      </div>
      <PolygonTable polygons={polygons} />
    </div>
  );
}