import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabButton from './TabButton';
import { User } from 'lucide-react';

describe('TabButton Component', () => {
    const defaultProps = {
        id: 'personal',
        label: 'Personal Info',
        icon: User,
        activeTab: 'personal',
        onTabChange: vi.fn(),
    };

    it('renders label correctly', () => {
        render(<TabButton {...defaultProps} />);
        expect(screen.getByText('Personal Info')).toBeInTheDocument();
    });

    it('calls onTabChange when clicked', async () => {
        const onTabChangeMock = vi.fn();
        const user = userEvent.setup();

        render(<TabButton {...defaultProps} onTabChange={onTabChangeMock} />);

        await user.click(screen.getByRole('button'));

        expect(onTabChangeMock).toHaveBeenCalledWith('personal');
    });

    it('renders icon component', () => {
        const { container } = render(<TabButton {...defaultProps} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });
});
