import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export const useFeatureAccess = (featureName) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFeatureAccess();
  }, [featureName]);

  const checkFeatureAccess = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', `feature_${featureName}`)
        .single();

      if (error) throw error;
      
      setIsEnabled(data?.setting_value === 'enabled');
    } catch (err) {
      console.error('Error checking feature access:', err);
      setIsEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  return { isEnabled, loading };
};