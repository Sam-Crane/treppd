'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  PersistQueryClientProvider,
  type Persister,
} from '@tanstack/react-query-persist-client';
import { useEffect, useState } from 'react';

const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const IDB_KEY = 'treppd-query-cache';

async function createIDBPersister(): Promise<Persister> {
  const { get, set, del } = await import('idb-keyval');

  return {
    persistClient: async (client) => {
      await set(IDB_KEY, client);
    },
    restoreClient: async () => {
      return (await get(IDB_KEY)) as Awaited<ReturnType<Persister['restoreClient']>>;
    },
    removeClient: async () => {
      await del(IDB_KEY);
    },
  };
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            gcTime: MAX_AGE,
          },
        },
      }),
  );

  const [persister, setPersister] = useState<Persister | null>(null);

  useEffect(() => {
    createIDBPersister().then(setPersister).catch(() => {
      // IDB unavailable — fall through to plain QueryClientProvider
    });
  }, []);

  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: MAX_AGE,
        buster: 'v1',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
