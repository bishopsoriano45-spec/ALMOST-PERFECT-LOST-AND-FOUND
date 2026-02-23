
import http from 'http';

const displayStatus = (name, url, success, statusCode, error = null) => {
    const statusSymbol = success ? '✅' : '❌';
    console.log(`${statusSymbol} ${name} (${url}): ${success ? `Online (Status: ${statusCode})` : `Offline (${error})`}`);
};

const checkService = (name, url) => {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            displayStatus(name, url, true, res.statusCode);
            resolve(true);
        });

        req.on('error', (e) => {
            displayStatus(name, url, false, 0, e.message);
            resolve(false);
        });
    });
};

(async () => {
    console.log("Verifying Local Deployment...");
    console.log("-----------------------------");

    // Frontend (Vite)
    await checkService('Frontend (localhost)', 'http://localhost:5173/');
    await checkService('Frontend (127.0.0.1)', 'http://127.0.0.1:5173/');

    // Backend (Node/Express)
    // Note: Backend might be on 3000 or 5000 depending on env, previous output said 3000
    await checkService('Backend', 'http://localhost:3000/');

    // AI Service (FastAPI)
    // Previous output said 5000 (which is unusual for fastapi default 8000, but uvicorn output said 5000)
    await checkService('AI Service', 'http://localhost:5000/health');
    await checkService('AI Service (Root)', 'http://localhost:5000/');
})().catch(e => {
    console.error("Script failed:", e);
    process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
    process.exit(1);
});
