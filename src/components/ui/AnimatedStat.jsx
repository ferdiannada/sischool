import React, { useEffect, useState } from 'react';

const AnimatedStat = ({ value, duration = 1000, formatter = (val) => val.toLocaleString() }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        // Parse value to number if it's a string (remove non-numeric chars except .)
        const numericValue = typeof value === 'string'
            ? parseFloat(value.replace(/[^0-9.-]+/g, ''))
            : value;

        if (isNaN(numericValue)) {
            setCount(value); // Fallback for non-numeric values
            return;
        }

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Easing function: easeOutExpo
            const easeOut = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));

            const currentCount = Math.floor(easeOut(percentage) * numericValue);
            setCount(currentCount);

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(numericValue);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <>{typeof value === 'number' || !isNaN(parseFloat(value)) ? formatter(count) : value}</>;
};

export default AnimatedStat;
