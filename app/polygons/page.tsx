import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PolygonTable from './polygonTable';
import { notFound } from 'next/navigation';


export default async function Home() {
 


  const response = await fetch('http://localhost:3001/api/polygons', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Prevents caching during SSR
  });

  console.log(response)

  if (!response.ok) {
    notFound();
  }

  const polygons = await response.json();


  return (
    <div className='p-10'>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">GeoTAG Locations</h2>
        <Link href="/polygons/new">
          <Button>Create Location</Button>
        </Link>
      </div>
      <PolygonTable polygons={polygons} />
    </div>
  );
}