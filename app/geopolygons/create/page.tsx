'use client';

import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';


// Interfaces
interface Province {
  id: string;
  provinceName: string;
}

interface Municipality {
  id: string;
  municipalityName: string;
  provId: string;
}



export default function CreatePolygon() {
  const [name, setName] = useState('');
  const [polType, setPolType] = useState('');
  const [geometry, setGeometry] = useState('');
  const [provId, setProvId] = useState('');
  const [munId, setmunId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);

   const [formData, setFormData] = useState({
   
    provId: '',
    munId: '',
  });

  const [debouncedFormData] = useDebounce(formData, 300);


  const [isLoading, setIsLoading] = useState({
    provinces: false,
    municipalities: false,
    submit: false,
  });

    // Error handling
  const handleError = (error: unknown, defaultMessage: string) => {
    const message = error instanceof AxiosError
      ? error.response?.data?.error || defaultMessage
      : defaultMessage;
    setError(message);
    toast.error(message);
    console.error(defaultMessage, error);
  };

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Fetch data
  const fetchProvinces = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, provinces: true }));
    try {
      const response = await axiosInstance.get('/province');
      setProvinces(response.data);
    } catch (error) {
      handleError(error, 'Failed to fetch provinces');
    } finally {
      setIsLoading((prev) => ({ ...prev, provinces: false }));
    }
  }, []);

  const fetchMunicipalities = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, municipalities: true }));
    try {
      const response = await axiosInstance.get('/municipality');
      setMunicipalities(response.data);
    } catch (error) {
      handleError(error, 'Failed to fetch municipalities');
    } finally {
      setIsLoading((prev) => ({ ...prev, municipalities: false }));
    }
  }, []);

  useEffect(() => {
    fetchProvinces();
    fetchMunicipalities();
  }, [fetchProvinces, fetchMunicipalities]);



   // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  // Filter municipalities
  const filteredMunicipalities = municipalities.filter((mun) => mun.provId === debouncedFormData.provId);

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
        body: JSON.stringify({ name, polType, provId: formData.provId, munId: formData.munId, geometry: geometryObj }),
      });

      // console.log(JSON.stringify({ name, polType, provId: formData.provId, munId: formData.munId, geometry: geometryObj }));

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <select
              name="provId"
              value={formData.provId}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading.provinces}
            >
              <option value="" disabled>Select Province</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.provinceName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
            <select
              name="munId"
              value={formData.munId}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
              disabled={!formData.provId || isLoading.municipalities}
            >
              <option value="" disabled>Select Municipality</option>
              {filteredMunicipalities.map((municipality) => (
                <option key={municipality.id} value={municipality.id}>
                  {municipality.municipalityName}
                </option>
              ))}
            </select>
          </div>
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
          <label htmlFor="polType" className="block text-sm font-medium">
            Polygon Type
          </label>
          <select
            id="polType"
            value={polType}
            onChange={(e) => setPolType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a type</option>
            <option value="bldg">Building</option>
            <option value="lot">Lot</option>
            <option value="road">Road</option>
            <option value="bar">Barangay</option>
            <option value="mun">Municipality</option>
          </select>
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