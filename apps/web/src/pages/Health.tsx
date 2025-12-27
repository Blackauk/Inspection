import { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function Health() {
  const [apiHealth, setApiHealth] = useState<string>('checking...');
  const [webStatus, setWebStatus] = useState<string>('ok');

  useEffect(() => {
    checkHealth();
  }, []);

  async function checkHealth() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/health`);
      if (response.ok) {
        const data = await response.json();
        setApiHealth(data.status || 'ok');
      } else {
        setApiHealth('error');
      }
    } catch (error) {
      setApiHealth('offline');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">System Health</h1>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Web App:</span>
            <span className="text-green-600 font-semibold">{webStatus}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">API Server:</span>
            <span
              className={`font-semibold ${
                apiHealth === 'ok' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {apiHealth}
            </span>
          </div>
          <button
            onClick={checkHealth}
            className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}















