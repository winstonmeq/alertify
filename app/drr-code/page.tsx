'use client';

import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { z } from 'zod';
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

// Form schemas for validation
const singleCodeSchema = z.object({
  drrcode: z.string().min(8).max(8),
  provId: z.string().min(1),
  munId: z.string().min(1),
});

const bulkCodeSchema = z.object({
  count: z.string().regex(/^\d+$/).transform(Number).refine((n) => n >= 1 && n <= 500, {
    message: 'Count must be between 1 and 500',
  }),
  provId: z.string().min(1),
  munId: z.string().min(1),
});

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default function DrrCodeManager() {
 
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  
  const [formData, setFormData] = useState({
    drrcode: '',
    selfie: '',
    provId: '',
    munId: '',
  });
  const [bulkFormData, setBulkFormData] = useState({
    count: '100',
    selfie: '',
    provId: '',
    munId: '',
  });
  const [isLoading, setIsLoading] = useState({
    provinces: false,
    municipalities: false,
    submit: false,
    bulkSubmit: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [debouncedFormData] = useDebounce(formData, 300);
  const [debouncedBulkFormData] = useDebounce(bulkFormData, 300);

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

  // Error handling
  const handleError = (error: unknown, defaultMessage: string) => {
    const message = error instanceof AxiosError
      ? error.response?.data?.error || defaultMessage
      : defaultMessage;
    setError(message);
    toast.error(message);
    console.error(defaultMessage, error);
  };

  // Generate random 8-character code
  const generateRandomCode = useCallback(() => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('');
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleBulkInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBulkFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  // Handle single code generation
  const handleGenerateCode = () => {
    setFormData((prev) => ({ ...prev, drrcode: generateRandomCode() }));
  };

  // Create single code
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading((prev) => ({ ...prev, submit: true }));
    
    try {
      singleCodeSchema.parse(formData);
      await axiosInstance.post('/drr-code', formData);
      toast.success('Code created successfully');
      setFormData({
        drrcode: '',
        selfie: '',
        provId: '',
        munId: '',
      });
      setError(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
        toast.error(error.errors[0].message);
      } else {
        handleError(error, 'Failed to create code');
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  // Create bulk codes
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading((prev) => ({ ...prev, bulkSubmit: true }));
    
    try {
      const validatedData = bulkCodeSchema.parse(bulkFormData);
      const codesToGenerate = Array.from({ length: validatedData.count }, () => ({
        drrcode: generateRandomCode(),
        provId: validatedData.provId,
        munId: validatedData.munId,
      }));
      await axiosInstance.post('/drr-code/bulk', { codes: codesToGenerate });
      toast.success(`${validatedData.count} codes created successfully`);
      setBulkFormData({
        count: '100',
        selfie: '',
        provId: '',
        munId: '',
      });
      setError(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
        toast.error(error.errors[0].message);
      } else {
        handleError(error, 'Failed to create bulk codes');
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, bulkSubmit: false }));
    }
  };

  // Filter municipalities
  const filteredMunicipalities = municipalities.filter((mun) => mun.provId === debouncedFormData.provId);
  const filteredBulkMunicipalities = municipalities.filter((mun) => mun.provId === debouncedBulkFormData.provId);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">DRR Code Manager</h1>
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Single Code Form */}
      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Create Single Code</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">DRR Code</label>
            <div className="flex gap-4">
              <input
                type="text"
                name="drrcode"
                value={formData.drrcode}
                onChange={handleInputChange}
                placeholder="DRR Code"
                className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-yellow-300"
                disabled={isLoading.submit}
              >
                Generate
              </button>
            </div>
          </div>
       
          <button
            type="submit"
            className="md:col-span-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading.submit}
          >
            {isLoading.submit ? 'Creating...' : 'Create Code'}
          </button>
        </div>
      </form>

      {/* Bulk Code Form */}
      <form onSubmit={handleBulkSubmit} className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Generate Bulk Codes</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Codes</label>
            <select
              name="count"
              value={bulkFormData.count}
              onChange={handleBulkInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <select
              name="provId"
              value={bulkFormData.provId}
              onChange={handleBulkInputChange}
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
              value={bulkFormData.munId}
              onChange={handleBulkInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
              disabled={!bulkFormData.provId || isLoading.municipalities}
            >
              <option value="" disabled>Select Municipality</option>
              {filteredBulkMunicipalities.map((municipality) => (
                <option key={municipality.id} value={municipality.id}>
                  {municipality.municipalityName}
                </option>
              ))}
            </select>
          </div>
        
          <button
            type="submit"
            className="md:col-span-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading.bulkSubmit}
          >
            {isLoading.bulkSubmit ? 'Generating...' : 'Generate Bulk Codes'}
          </button>
        </div>
      </form>
    </div>
  );
}