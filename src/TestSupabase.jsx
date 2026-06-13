import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const TestSupabase = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      console.log('Testing Supabase connection...');
      console.log('Supabase client:', supabase);
      
      // Test 1: Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth user:', user);
      console.log('Auth error:', authError);
      
      // Test 2: Try a simple query
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      console.log('Query result:', data);
      console.log('Query error:', queryError);
      
      if (queryError) {
        setError(queryError);
      } else {
        setData(data);
      }
    };
    
    testConnection();
  }, []);

  return (
    <div>
      <h2>Supabase Connection Test</h2>
      {error && (
        <div style={{ color: 'red' }}>
          <h3>Error:</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      {data && (
        <div>
          <h3>Success! Data:</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestSupabase;