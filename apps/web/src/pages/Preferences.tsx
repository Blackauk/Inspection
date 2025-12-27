import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export default function Preferences() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text)' }}>
          Preferences
        </h1>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Theme
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Choose your preferred color theme for the application.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
                style={{
                  backgroundColor: theme === 'light' ? 'var(--hover)' : 'var(--card)',
                  borderColor: theme === 'light' ? '#3b82f6' : 'var(--border)',
                  color: theme === 'light' ? '#1e40af' : 'var(--text)',
                }}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--hover)' : 'var(--card)',
                  borderColor: theme === 'dark' ? '#3b82f6' : 'var(--border)',
                  color: theme === 'dark' ? '#1e40af' : 'var(--text)',
                }}
              >
                Dark
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

