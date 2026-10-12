import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import InfoRow from './InfoRow';
import { Phone } from 'lucide-react';

// Simple render test without providers (InfoRow doesn't need routing)
describe('InfoRow Component', () => {
    it('renders label and value correctly', () => {
        render(
            <InfoRow
                icon={Phone}
                label="Phone Number"
                value="081234567890"
            />
        );

        expect(screen.getByText('Phone Number')).toBeInTheDocument();
        expect(screen.getByText('081234567890')).toBeInTheDocument();
    });

    it('renders dash when value is empty', () => {
        render(
            <InfoRow
                icon={Phone}
                label="Phone Number"
                value=""
            />
        );

        expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('shows copy button when copyable is true', () => {
        render(
            <InfoRow
                icon={Phone}
                label="Phone Number"
                value="081234567890"
                copyable
            />
        );

        const copyButton = screen.getByTitle('Salin');
        expect(copyButton).toBeInTheDocument();
    });
});
