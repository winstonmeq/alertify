'use client';

import { authClient } from "@/lib/auth-client";

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const [isMounted, setIsMounted] = useState(false);

  // Only run on client after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSignOut = async () => {

    
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  // Render nothing or a fallback on server (before mount)
  if (!isMounted || isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p className="text-red-500">Error: {error.message}</p>
        <button
          className="px-4 py-2 mt-5 rounded-sm border-1px border-solid bg-blue-700 text-white font-bold"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!session) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="flex flex-row items-center justify-center gap-4 p-4">
        <Link href="/geopolygons">Geo Polygons</Link> 
        <Link href="/polygons">Polygons</Link>
          <Link href="/drr-code">DRR Code</Link></div>
      <h1 className="text-2xl">Q-ALERT S1 {session?.user?.email}</h1>
      <button
        className="px-4 py-2 mt-5 rounded-sm border-1px border-solid bg-orange-700 text-white font-bold"
        onClick={handleSignOut}
      >
        Sign Out
      </button>
    </div>
  );
}