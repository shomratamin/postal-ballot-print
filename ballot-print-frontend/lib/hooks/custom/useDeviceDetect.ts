import { useState, useEffect } from 'react';

function useDeviceDetect() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check if the code is running in a browser
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                setIsMobile(window.innerWidth < 768);
            };

            // Set initial state
            setIsMobile(window.innerWidth < 768);

            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, []);

    return { isMobile };
}

export default useDeviceDetect;
