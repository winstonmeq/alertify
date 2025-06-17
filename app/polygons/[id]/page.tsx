
import { notFound } from 'next/navigation';
import PolygonForm from '../polygonForm';

interface PageProps {
  params: Promise<{ id: string }>; // Define params as a Promise
}

export default async function EditPolygon({ params }: PageProps) {
  const {id }= await params;

  if (!id) {
    notFound();
  }


  const response = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/api/polygons/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Prevents caching during SSR
  });

  if (!response.ok) {
    notFound();
  }

  const polygon = await response.json();

  return (
    <div className='p-10'>
      <h2 className="text-xl font-semibold mb-6">Edit Polygon</h2>
      <PolygonForm
        initialData={{
          ...polygon,
          points: polygon.points.map((p: { lat: number; long: number }) => ({
            lat: p.lat,
            long: p.long,
          })),
        }}
      />
    </div>
  );
}
