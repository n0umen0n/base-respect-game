/**
 * Leaderboard Component
 * 
 * Displays the top users ranked by their current number.
 * Data is fetched from Supabase and updates in realtime.
 */

import React, { useState, useEffect } from 'react';
import { getLeaderboard, subscribeToLeaderboard, type TopLeaderboardEntry } from '../lib/api';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<TopLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial leaderboard data
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((payload) => {
      console.log('Leaderboard updated:', payload);
      // Refetch leaderboard when changes occur
      fetchLeaderboard();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function fetchLeaderboard() {
    try {
      setIsLoading(true);
      const data = await getLeaderboard(10); // Top 10
      setLeaderboard(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading && leaderboard.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">🏆 Leaderboard</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">🏆 Leaderboard</h2>
        <div className="text-center py-8">
          <p className="text-red-600">❌ {error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">🏆 Leaderboard</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No data yet. Be the first to submit a transaction!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🏆 Leaderboard</h2>
        <button
          onClick={fetchLeaderboard}
          disabled={isLoading}
          className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          {isLoading ? '🔄' : '↻'} Refresh
        </button>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.wallet_address}
            className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
              index < 3
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {/* Rank */}
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold w-12 text-center">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && <span className="text-gray-500">#{index + 1}</span>}
              </div>

              {/* User Info */}
              <div>
                <div className="font-semibold text-gray-800">
                  {entry.username || `${entry.wallet_address.slice(0, 6)}...${entry.wallet_address.slice(-4)}`}
                </div>
                <div className="text-xs text-gray-500">
                  {entry.total_transactions} transaction{entry.total_transactions !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Current Number */}
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {entry.current_number.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                Best: {entry.highest_number.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-4 text-center">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
          View Full Leaderboard →
        </button>
      </div>
    </div>
  );
}

