'use client';

import { useState, useEffect } from 'react';

export default function ButtonPage() {
  const [status, setStatus] = useState('');
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/click')
      .then(res => res.json())
      .then(data => {
        setCount(data.total_clicks || 0);
      })
      .catch(err => console.error('Error:', err));
  }, []);

  const handleClick = async () => {
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to save click');
      }

      const data = await response.json();
      setCount(data.total_clicks);
      setStatus('Saved to database!');
      setHistory(prev => [
        `Click #${data.total_clicks} at ${new Date().toLocaleTimeString()}`,
        ...prev.slice(0, 4)
      ]);

    } catch (error) {
      setStatus('Error saving! Try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-12 flex flex-col items-center gap-8 w-full max-w-md">

        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            One Button App
          </h1>
          <p className="text-gray-400 text-sm">
            Click the button to save to database
          </p>
        </div>

        <div className="bg-gray-700 rounded-xl p-6 w-full text-center">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">
            Total Clicks
          </p>
          <p className="text-6xl font-bold text-green-400">
            {count}
          </p>
        </div>

        <button
          onClick={handleClick}
          disabled={loading}
          className={`w-full py-5 rounded-xl text-white text-2xl font-bold transition-all duration-200 shadow-lg ${
            loading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-400 cursor-pointer'
          }`}
        >
          {loading ? 'Saving...' : 'Click Me!'}
        </button>

        {status && (
          <div className={`w-full p-4 rounded-lg text-center font-medium text-lg ${
            status.includes('Saved')
              ? 'bg-green-900 text-green-300'
              : 'bg-red-900 text-red-300'
          }`}>
            {status}
          </div>
        )}

        {history.length > 0 && (
          <div className="w-full">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
              Recent Clicks
            </p>
            <div className="bg-gray-700 rounded-xl p-4 space-y-2">
              {history.map((item, index) => (
                <div key={index} className="text-gray-300 text-sm flex items-center gap-2">
                  <span className="text-green-400">-</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          Back to Home
        </a>

      </div>
    </main>
  );
}