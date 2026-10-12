import React from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/react-query';
import AppRoutes from './routes';

import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { authService } from './features/auth/api/authService';

function App() {
  const syncSession = useAuthStore((state) => state.syncSession);
  const setSessionInitialized = useAuthStore((state) => state.setSessionInitialized);

  React.useEffect(() => {
    let initialized = false;

    const markInitialized = () => {
      if (!initialized) {
        initialized = true;
        setSessionInitialized(true);
      }
    };

    const handleSessionAndInit = async (session) => {
      if (session?.user) {
        try {
          const enrichedUser = await authService.enrichUser(session.user);
          syncSession(session, enrichedUser);
        } catch (err) {
          console.error('Enrichment failed:', err);
          syncSession(session, null);
        }
      } else {
        syncSession(null);
      }

      // Mark as initialized and refresh all active queries so they use
      // the now-valid auth token.
      markInitialized();
      queryClient.invalidateQueries();
    };

    // onAuthStateChange is guaranteed to fire at least once (INITIAL_SESSION)
    // on listener setup, providing the cached/refreshed session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        syncSession(null);
        queryClient.clear();
        return;
      }

      // Fire-and-forget async handler. We don't await because Supabase
      // doesn't support async callbacks, but the promise runs to completion.
      handleSessionAndInit(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncSession, setSessionInitialized]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <Toaster position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
