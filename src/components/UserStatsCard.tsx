/**
 * User Stats Card - Shows current user's statistics from database
 * Updates in real-time when transactions complete
 */

import React, { useState, useEffect } from 'react';
import { getUserByAddress, subscribeToUser, type UserProfile } from '../lib/api-simple';

interface UserStatsCardProps {
  walletAddress: string;
}

export default function UserStatsCard({ walletAddress }: UserStatsCardProps) {
  const [userStats, setUserStats] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);

  // Fetch initial stats
  useEffect(() => {
    fetchStats();
  }, [walletAddress]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToUser(walletAddress, (payload) => {
      console.log('🔔 Your stats updated in real-time!', payload);
      const updateTime = new Date();
      setLastUpdate(updateTime);
      setJustUpdated(true);
      
      // Flash effect for 2 seconds
      setTimeout(() => setJustUpdated(false), 2000);
      
      fetchStats();
    });

    return () => {
      unsubscribe();
    };
  }, [walletAddress]);

  async function fetchStats() {
    try {
      setIsLoading(true);
      const data = await getUserByAddress(walletAddress);
      setUserStats(data);
      console.log('📊 Fetched your stats:', data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading && !userStats) {
    return (
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md border-2 border-blue-200">
        <h2 className="text-xl font-bold mb-4">📊 Your Stats</h2>
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md border-2 border-blue-200">
        <h2 className="text-xl font-bold mb-4">📊 Your Stats</h2>
        <div className="text-center py-4 text-gray-600">
          <p>🎮 No transactions yet!</p>
          <p className="text-sm mt-2">Set a number below to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md border-2 transition-all ${
      justUpdated ? 'border-green-500 shadow-lg shadow-green-200' : 'border-blue-200'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📊 Your Stats</h2>
        {lastUpdate && (
          <span className={`text-xs font-semibold ${justUpdated ? 'text-green-600 animate-pulse' : 'text-gray-500'}`}>
            {justUpdated ? '✨ Just Updated!' : `Last: ${lastUpdate.toLocaleTimeString()}`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Current Number */}
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Current Number</p>
          <p className="text-3xl font-bold text-blue-600">
            {userStats.current_number.toLocaleString()}
          </p>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
          <p className="text-3xl font-bold text-purple-600">
            {userStats.total_transactions}
          </p>
        </div>

        {/* Highest Number */}
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Personal Best</p>
          <p className="text-2xl font-bold text-green-600">
            {userStats.highest_number.toLocaleString()}
          </p>
        </div>

        {/* Wallet Address */}
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Your Address</p>
          <p className="text-xs font-mono text-gray-800 break-all">
            {userStats.wallet_address.slice(0, 10)}...{userStats.wallet_address.slice(-8)}
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Last database update: {new Date(userStats.updated_at).toLocaleString()}
      </div>
    </div>
  );
}

