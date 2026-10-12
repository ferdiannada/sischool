import * as React from 'react';
import { cn } from '../../../utils/cn';

const ContentWrapper = ({ className, children, ...props }) => {
    return (
        <div className={cn("mx-auto max-w-7xl", className)} {...props}>
            {children}
        </div>
    );
};

export { ContentWrapper };
