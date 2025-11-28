import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Global flag to prevent duplicate notifications across component re-renders
let hasShownAuthNotification = false;

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Prevent duplicate processing
      if (hasProcessed.current) return;
      hasProcessed.current = true;
      
      try {
        // Check for error in URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (errorParam) {
          if (!hasShownAuthNotification) {
            hasShownAuthNotification = true;
            toast.error(errorDescription || 'Authentication failed');
          }
          navigate('/login');
          return;
        }

        // Supabase automatically handles the OAuth callback from the URL hash
        // Wait a moment for Supabase to process the callback
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          if (!hasShownAuthNotification) {
            hasShownAuthNotification = true;
            toast.error('Authentication failed: ' + error.message);
          }
          navigate('/login');
          return;
        }

        if (data.session) {
          if (!hasShownAuthNotification) {
            hasShownAuthNotification = true;
            toast.success('Successfully signed in!');
            // Reset flag after a delay to allow for future sign-ins
            setTimeout(() => {
              hasShownAuthNotification = false;
            }, 2000);
          }
          navigate('/dashboard');
        } else {
          // No session found, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        if (!hasShownAuthNotification) {
          hasShownAuthNotification = true;
          toast.error('An error occurred during authentication');
          setTimeout(() => {
            hasShownAuthNotification = false;
          }, 2000);
        }
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

