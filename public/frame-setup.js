// Only load visual edit scripts when inside an iframe
if (window.self !== window.top) {
    // Load debug monitor script
    var debugMonitorScript = document.createElement('script');
    debugMonitorScript.src = 'https://assets.emergent.sh/scripts/debug-monitor.js';
    document.head.appendChild(debugMonitorScript);

    // Configure Tailwind
    window.tailwind = window.tailwind || {};
    tailwind.config = {
        corePlugins: { preflight: false },
    };

    // Load Tailwind CDN
    var tailwindScript = document.createElement('script');
    tailwindScript.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(tailwindScript);
}
