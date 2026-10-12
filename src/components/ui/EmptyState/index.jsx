import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from '../Button';

export const EmptyState = ({
    title = 'Tidak ada data',
    description = 'Belum ada data yang tersedia saat ini.',
    action,
    icon: Icon = PackageOpen
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6">{description}</p>
            {action && (
                <div onClick={action.onClick}>
                    <Button {...action.props}>
                        {action.label}
                    </Button>
                </div>
            )}
        </div>
    );
};
