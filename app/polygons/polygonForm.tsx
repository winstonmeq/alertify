'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type Point = { lat: number; long: number };
type Polygon = { id?: string; name: string; munId: string; provId: string; points: Point[] };

interface PolygonFormProps {
  initialData?: Polygon;
}

export default function PolygonForm({ initialData }: PolygonFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [munId, setMunId] = useState(initialData?.munId || '');
  const [provId, setProvId] = useState(initialData?.provId || '');
  const [points, setPoints] = useState<Point[]>(initialData?.points || [{ lat: 0, long: 0 }]);
  const router = useRouter();

  const validateInputs = (): boolean => {
    if (!name.trim()) {
      toast('Location name is required');
      return false;
    }
    if (!munId.trim()) {
      toast('Municipality ID is required');
      return false;
    }
    if (!provId.trim()) {
      toast('Province ID is required');
      return false;
    }
    if (points.length === 0) {
      toast('At least one point is required');
      return false;
    }
    for (const point of points) {
      if (isNaN(point.lat) || isNaN(point.long)) {
        toast('All points must have valid latitude and longitude values');
        return false;
      }
      if (point.lat === 0 && point.long === 0) {
        toast('Points cannot have both latitude and longitude as 0');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      return;
    }

    const method = initialData ? 'PUT' : 'POST';
    const url = initialData ? `${process.env.NEXT_PUBLIC_DOMAIN}/api/polygons/${initialData.id}` : `${process.env.NEXT_PUBLIC_DOMAIN}/api/polygons`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, munId, provId, points }),
      });

      if (res.ok) {
        alert(`Polygon ${initialData ? 'updated' : 'created'} successfully`);
        router.push('/polygons');
      } else {
        throw new Error('Failed to save polygon');
      }
    } catch (error) {
      toast('Failed to save polygon');
      console.log(error);
    }
  };

  const addPoint = () => setPoints([...points, { lat: 0, long: 0 }]);
  const updatePoint = (index: number, field: 'lat' | 'long', value: string) => {
    const newPoints = [...points];
    newPoints[index][field] = parseFloat(value) || 0;
    setPoints(newPoints);
  };
  const removePoint = (index: number) => setPoints(points.filter((_, i) => i !== index));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Location Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="munId">Municipality ID</Label>
        <Input id="munId" value={munId} onChange={(e) => setMunId(e.target.value)} required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="provId">Province ID</Label>
        <Input id="provId" value={provId} onChange={(e) => setProvId(e.target.value)} required className="mt-1" />
      </div>
      <div>
        <Label>Points</Label>
        {points.map((point, index) => (
          <div key={index} className="flex space-x-2 mt-2">
            <Label>Lat</Label>
            <Input
              type="number"
              step="any"
              placeholder="Latitude"
              value={point.lat}
              onChange={(e) => updatePoint(index, 'lat', e.target.value)}
              className="w-1/2"
            />
            <Label>Long</Label>
            <Input
              type="number"
              step="any"
              placeholder="Longitude"
              value={point.long}
              onChange={(e) => updatePoint(index, 'long', e.target.value)}
              className="w-1/2"
            />
            {points.length > 1 && (
              <Button type="button" variant="destructive" onClick={() => removePoint(index)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addPoint} className="mt-2">
          Add Point
        </Button>
      </div>
      <div className="flex space-x-2">
        <Button type="submit">Save Polygon</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}