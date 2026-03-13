// Only load visual edit scripts when inside an iframe
if (window.self !== window.top) {
    // Load debug monitor script with SRI
    var debugMonitorScript = document.createElement('script');
    debugMonitorScript.src = 'https://assets.emergent.sh/scripts/debug-monitor.js';
    debugMonitorScript.integrity = 'sha384-jz0y27U7WjxT0QyhXDpA+KVKzfKnXe1hj14hD4DDtVvYIWbQivhaxIVqBskbCBSP';
    debugMonitorScript.crossOrigin = 'anonymous';
    document.head.appendChild(debugMonitorScript);

    // Configure Tailwind
    window.tailwind = window.tailwind || {};
    tailwind.config = {
        corePlugins: { preflight: false },
    };

    // Load Tailwind CDN with SRI
    var tailwindScript = document.createElement('script');
    tailwindScript.src = 'https://cdn.tailwindcss.com';
    tailwindScript.integrity = 'sha384-OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb';
    tailwindScript.crossOrigin = 'anonymous';
    document.head.appendChild(tailwindScript);
}
