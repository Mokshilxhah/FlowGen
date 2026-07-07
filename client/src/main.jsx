import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import { router } from './router/index.jsx'
import AuthBootstrap from './components/AuthBootstrap.jsx'

import { queryClient } from './lib/queryClient.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A2236',
              color: '#F1F5F9',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '12px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#1A2236' } },
            error: { iconTheme: { primary: '#F43F5E', secondary: '#1A2236' } },
          }}
        />
        <RouterProvider router={router} />
      </AuthBootstrap>
    </QueryClientProvider>
  </StrictMode>,
)
