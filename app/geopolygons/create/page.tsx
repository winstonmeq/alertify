'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePolygon() {
  const [name, setName] = useState('');
  const [geometry, setGeometry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const geometryObj = JSON.parse(geometry);
      if (geometryObj.type !== 'Polygon' || !geometryObj.coordinates) {
        throw new Error('Invalid GeoJSON Polygon');
      }

      const res = await fetch('/api/geopolygons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, geometry: geometryObj }),
      });

      if (!res.ok) throw new Error('Failed to create polygon');
      router.push('/geopolygons');
    } catch (err) {
      setError('Error creating polygon: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Polygon</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="geometry" className="block text-sm font-medium">
            GeoJSON Geometry (Polygon)
          </label>
          <textarea
            id="geometry"
            value={geometry}
            onChange={(e) => setGeometry(e.target.value)}
            required
            className="w-full p-2 border rounded h-32"
            placeholder='{"type":"Polygon","coordinates":[[[125.0,7.1],[125.1,7.1],[125.1,7.2],[125.0,7.2],[125.0,7.1]]]}'
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Create
        </button>
      </form>
    </div>
  );
}