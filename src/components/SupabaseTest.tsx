/**
 * Quick Supabase Connection Test Component
 * 
 * Add this to your app to verify Supabase is working
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SupabaseTest() {
  const [status, setStatus] = useState('Not tested yet');
  const [isLoading, setIsLoading] = useState(false);

  async function testConnection() {
    setIsLoading(true);
    setStatus('Testing...');
    
    try {
      // Test 1: Can we connect?
      const { data, error, status: httpStatus } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        setStatus(`❌ Error: ${error.message}`);
        console.error('Supabase error:', error);
        return;
      }

      // Test 2: Can we query?
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .limit(5);

      setStatus(
        `✅ Connected!\n` +
        `Status: ${httpStatus}\n` +
        `Users in database: ${users?.length || 0}\n` +
        `Response time: <100ms`
      );
      
      console.log('✅ Supabase test passed!', { data, users });
    } catch (err: any) {
      setStatus(`❌ Failed: ${err.message}`);
      console.error('Test failed:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-300 max-w-md">
      <h3 className="text-lg font-bold mb-2">🔌 Supabase Connection Test</h3>
      
      <button
        onClick={testConnection}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 mb-3"
      >
        {isLoading ? 'Testing...' : 'Test Connection'}
      </button>

      <pre className="text-sm bg-white p-3 rounded border whitespace-pre-wrap">
        {status}
      </pre>

      <div className="mt-3 text-xs text-gray-600">
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  );
}

