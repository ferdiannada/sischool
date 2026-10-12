import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a fresh QueryClient for each test
 */
export const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: Infinity,
            },
            mutations: {
                retry: false,
            },
        },
    });

/**
 * All-in-one wrapper with Router and QueryClient
 */
export const AllProviders = ({ children }) => {
    const queryClient = createTestQueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {children}
            </BrowserRouter>
        </QueryClientProvider>
    );
};

/**
 * Custom render function that wraps component with all providers
 */
export const renderWithProviders = (ui, options = {}) => {
    return render(ui, { wrapper: AllProviders, ...options });
};

/**
 * Mock user for testing authenticated components
 */
export const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    roles: ['admin'],
    is_active: true,
};

/**
 * Mock student data for testing
 */
export const mockStudent = {
    id: 1,
    user_id: 'student-user-id',
    nis: '12345',
    nisn: '0012345678',
    full_name: 'Test Student',
    kelas_id: 1,
    kelas_nama: 'X-A',
    status: 'aktif',
    jenis_kelamin: 'L',
    tanggal_lahir: '2010-05-15',
};

/**
 * Mock class data for testing
 */
export const mockClass = {
    id: 1,
    nama: 'X-A',
    tingkat: 10,
    kapasitas: 40,
    wali_kelas_id: 'guru-user-id',
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
