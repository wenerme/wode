import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const ReactQueryClientProvider: React.FC<{ children?: React.ReactNode; url?: string }> = ({ children, url }) => {
	const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 5 * 1000 } } }));
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
