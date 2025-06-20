'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';


interface GeoPolygon {
  id: string;
  name: string;
  geometry: { type: string; coordinates: number[][][] };
  createdAt: string;
  updatedAt: string;
}

export default function EditPolygon() {
  const [name, setName] = useState('');
  const [geometry, setGeometry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    async function fetchPolygon() {
      try {
        const res = await fetch(`/api/geopolygons/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch polygon');
        }
        const data: GeoPolygon = await res.json();
        setName(data.name);
        setGeometry(JSON.stringify(data.geometry, null, 2));
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setLoading(false);
      }
    }
    fetchPolygon();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const cleanedGeometry = geometry.trim();
      if (!cleanedGeometry) {
        throw new Error('Geometry field cannot be empty');
      }

      let geometryObj;
      try {
        geometryObj = JSON.parse(cleanedGeometry);
      } catch (parseError) {
        throw new Error(`Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }

      if (!geometryObj || geometryObj.type !== 'Polygon' || !Array.isArray(geometryObj.coordinates)) {
        throw new Error('Invalid GeoJSON: Must be a Polygon with coordinates array');
      }

      const coords = geometryObj.coordinates;
      if (!coords[0] || !Array.isArray(coords[0]) || coords[0].length < 4) {
        throw new Error('Invalid Polygon: Must have at least 4 coordinates forming a closed ring');
      }
      for (const point of coords[0]) {
        if (!Array.isArray(point) || point.length < 2) {
          throw new Error('Invalid Polygon: Each coordinate must be an array of [longitude, latitude]');
        }
      }

      const res = await fetch(`/api/geopolygons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, geometry: geometryObj }),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to update polygon');
      }

      setSuccess('Polygon updated successfully!');
      setTimeout(() => router.push('/geopolygons'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  if (loading) return <div className="container mx-auto p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Polygon</h1>
      {error && <p className="text-red-500 mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
      {success && <p className="text-green-500 mb-4 bg-green-50 p-3 rounded-lg">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="geometry" className="block text-sm font-medium text-gray-700">
            GeoJSON Geometry (Polygon)
          </label>
          <textarea
            id="geometry"
            value={geometry}
            onChange={(e) => setGeometry(e.target.value)}
            
            className="w-full p-2 border rounded-lg h-32 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-x-3">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Update
          </button>
          <Link
            href="/geopolygons"
            className="inline-block bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}