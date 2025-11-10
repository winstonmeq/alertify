'use client';

import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { useState, useEffect, useCallback } from 'react';

// axiosInstance is stable and shared — defined outside component
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
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
  const router = useRouter();

  // Form fields
  const [name, setName] = useState('');
  const [polType, setPolType] = useState('');
  const [geometry, setGeometry] = useState('');

  // Select data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    provId: '',
    munId: '',
  });

  // Loading states
  const [isLoading, setIsLoading] = useState({
    provinces: false,
    municipalities: false,
    submit: false,
  });

  const [error, setError] = useState<string | null>(null);

  // Error handler
  const handleError = (error: unknown, defaultMessage: string) => {
    const message =
      error instanceof AxiosError
        ? error.response?.data?.error || error.message || defaultMessage
        : defaultMessage;
    setError(message);
    toast.error(message);
    console.error('[API Error]', error);
  };

  // Fetch all provinces
  const fetchProvinces = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, provinces: true }));
    try {
      const response = await axiosInstance.get('/province');
      setProvinces(response.data || []);
    } catch (err) {
      handleError(err, 'Failed to load provinces');
      setProvinces([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, provinces: false }));
    }
  }, []);

  // Fetch municipalities for selected province
  const fetchMunicipalities = useCallback(async (provId: string) => {
    if (!provId) {
      setMunicipalities([]);
      return;
    }

    setIsLoading((prev) => ({ ...prev, municipalities: true }));
    try {
      const response = await axiosInstance.get(`/municipality?provId=${provId}`);
      setMunicipalities(response.data || []);
    } catch (err) {
      handleError(err, 'Failed to load municipalities');
      setMunicipalities([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, municipalities: false }));
    }
  }, []);

  // Load provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  // Load municipalities when province changes
  useEffect(() => {
    fetchMunicipalities(formData.provId);
  }, [formData.provId, fetchMunicipalities]);

  // Handle select/input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset municipality when province changes
      ...(name === 'provId' ? { munId: '' } : {}),
    }));

    setError(null);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading((prev) => ({ ...prev, submit: true }));

    try {
      let geometryObj;
      try {
        geometryObj = JSON.parse(geometry);
      } catch {
        throw new Error('Invalid JSON in GeoJSON field');
      }

      if (geometryObj.type !== 'Polygon' || !Array.isArray(geometryObj.coordinates)) {
        throw new Error('GeoJSON must be a valid Polygon');
      }

      const response = await fetch('/api/geopolygons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          polType: polType || null,
          provId: formData.provId,
          munId: formData.munId || null,
          geometry: geometryObj,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create polygon');
      }

      toast.success('Polygon created successfully!');
      router.push('/geopolygons');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Polygon</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Province */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Province <span className="text-red-500">*</span>
          </label>
          <select
            name="provId"
            value={formData.provId}
            onChange={handleInputChange}
            required
            disabled={isLoading.provinces}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="">
              {isLoading.provinces ? 'Loading provinces...' : 'Select a province'}
            </option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.provinceName}
              </option>
            ))}
          </select>
        </div>

        {/* Municipality */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Municipality <span className="text-red-500">*</span>
          </label>
          <select
            name="munId"
            value={formData.munId}
            onChange={handleInputChange}
            required
            disabled={!formData.provId || isLoading.municipalities}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="">
              {isLoading.municipalities
                ? 'Loading municipalities...'
                : !formData.provId
                ? 'Please select a province first'
                : 'Select a municipality'}
            </option>
            {municipalities.length === 0 && formData.provId && !isLoading.municipalities && (
              <option disabled>No municipalities found</option>
            )}
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.municipalityName}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., City Hall Compound"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Polygon Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Polygon Type
          </label>
          <select
            value={polType}
            onChange={(e) => setPolType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select type</option>
            <option value="bldg">Building</option>
            <option value="lot">Lot</option>
            <option value="road">Road</option>
            <option value="bar">Barangay</option>
            <option value="mun">Municipality</option>
          </select>
        </div>

        {/* GeoJSON */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            GeoJSON Polygon <span className="text-red-500">*</span>
          </label>
          <textarea
            value={geometry}
            onChange={(e) => setGeometry(e.target.value)}
            required
            rows={8}
            placeholder={`{"type":"Polygon","coordinates":[[[125.0,7.1],[125.1,7.1],[125.1,7.2],[125.0,7.2],[125.0,7.1]]]}`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Must be valid GeoJSON Polygon format
          </p>
        </div>

        {/* Submit */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading.submit}
            className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-all transform hover:scale-105 ${
              isLoading.submit
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
            }`}
          >
            {isLoading.submit ? 'Creating Polygon...' : 'Create Polygon'}
          </button>
        </div>
      </form>
    </div>
  );
}