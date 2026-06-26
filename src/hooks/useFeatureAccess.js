import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export const useFeatureAccess = (featureName) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

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

      if (error) {
        // If feature doesn't exist in DB, it's enabled by default
        setIsEnabled(true);
        setShowWarning(false);
      } else {
        const enabled = data?.setting_value === 'enabled';
        setIsEnabled(enabled);
        setShowWarning(!enabled);
      }
    } catch (err) {
      console.error('Error checking feature access:', err);
      setIsEnabled(true);
      setShowWarning(false);
    } finally {
      setLoading(false);
    }
  };

  return { isEnabled, loading, showWarning };
};