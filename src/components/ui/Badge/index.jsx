import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary-600 text-white hover:bg-primary-700",
                secondary:
                    "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
                outline: "text-gray-950 border-gray-200",
                success:
                    "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
                warning:
                    "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                danger:
                    "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
                info:
                    "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
                "role-admin": "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200",
                "role-guru": "border-transparent bg-teal-100 text-teal-800 hover:bg-teal-200",
                "role-siswa": "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
                "role-wali-kelas": "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200",
                "role-ketua-kelas": "border-transparent bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
                "role-wali-murid": "border-transparent bg-pink-100 text-pink-800 hover:bg-pink-200",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

function Badge({ className, variant, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
