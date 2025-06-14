
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

  // Use an absolute URL — this is required in server components
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const response = await fetch(`http://localhost:3001/api/polygons/${id}`, {
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
    <div>
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
