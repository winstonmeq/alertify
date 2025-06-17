'use client';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Polygon = { 
  id: string; 
  name: string; 
  munId: string;
   provId: string; 
  points: { lat: number; long: number }[]
  municipality: { id: string; municipalityName: string;};
  province: {id:string; provinceName: string;}
}


interface PolygonTableProps {
  polygons: Polygon[];
}

export default function PolygonTable({ polygons }: PolygonTableProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/api/polygons/${selectedId}`, { method: 'DELETE' });

      console.log(res)

      if (res.ok) {
        router.push("/polygons")
      } else {
        throw new Error('Failed to delete polygon');
      }
    } catch (error) {
      console.log(error)
    }
    setOpen(false);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Municipality</TableHead>
            <TableHead>Province</TableHead>
            <TableHead>Points/Vertex</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {polygons.map((polygon) => (
            <TableRow key={polygon.id}>
              <TableCell>{polygon.name}</TableCell>
                <TableCell>{polygon.municipality.municipalityName} - {polygon.munId}</TableCell>
              <TableCell>{polygon.province.provinceName} - {polygon.provId} </TableCell>
              <TableCell>{polygon.points.length}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => router.push(`/polygons/${polygon.id}`)} className="mr-2">
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setSelectedId(polygon.id);
                    setOpen(true);
                  }}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Are you sure you want to delete this polygon? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}