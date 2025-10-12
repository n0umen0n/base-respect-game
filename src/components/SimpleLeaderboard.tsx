/**
 * Simple Leaderboard Component
 * 
 * Displays top users from the simplified schema
 */

import React, { useState, useEffect } from 'react';
import { getTopProfiles, subscribeToUsers, type UserProfile } from '../lib/api-simple';

export default function SimpleLeaderboard() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToUsers((payload) => {
      console.log('👀 User updated:', payload);
      // Refetch when any user changes
      fetchProfiles();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function fetchProfiles() {
    try {
      setIsLoading(true);
      const data = await getTopProfiles(10); // Top 10
      setProfiles(data);
      setError(null);
      console.log('✅ Fetched profiles:', data);
    } catch (err: any) {
      console.error('Failed to fetch profiles:', err);
      setError(err.message || 'Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading && profiles.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">🏆 Top Profiles</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">🏆 Top Profiles</h2>
        <div className="text-center py-8">
          <p className="text-red-600">❌ {error}</p>
          <button
            onClick={fetchProfiles}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">🏆 Top Profiles</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No users yet. Be the first to set a number!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🏆 Top Profiles</h2>
        <button
          onClick={fetchProfiles}
          disabled={isLoading}
          className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          title="Refresh"
        >
          {isLoading ? '🔄' : '↻'}
        </button>
      </div>

      <div className="space-y-2">
        {profiles.map((profile, index) => (
          <div
            key={profile.id}
            className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
              index < 3
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {/* Rank & User */}
            <div className="flex items-center space-x-4">
              {/* Medal/Rank */}
              <div className="text-2xl font-bold w-12 text-center">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && <span className="text-gray-500">#{index + 1}</span>}
              </div>

              {/* User Info */}
              <div>
                <div className="font-semibold text-gray-800">
                  {profile.username || `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`}
                </div>
                <div className="text-xs text-gray-500">
                  {profile.total_transactions} tx{profile.total_transactions !== 1 ? 's' : ''}
                  {' • '}
                  Best: {profile.highest_number.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Current Number */}
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {profile.current_number.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(profile.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 text-center">
          Showing top {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

