import { startAgent } from "./agent.mjs";
import { loadInjectedCredentials } from "./credential_injector.mjs";

// Pre-populate credential files from stored Agent (if AGENT_CREDENTIALS_JSON is set)
const injected = loadInjectedCredentials();
if (injected) {
    console.log("[STARTUP] Stored agent credentials loaded — skipping manual auth.");
}

console.log("Starting Phoenix Agent...");
startAgent();

let shutdownCount = 0;
const gracefulShutdown = () => {
    shutdownCount++;
    console.log(`\nReceived shutdown signal (${shutdownCount}). Stopping agent...`);
    if (shutdownCount >= 2) {
        console.log("Forcing exit immediately...");
        process.exit(1);
    }
    // Attempt standard exit
    setTimeout(() => { process.exit(0); }, 200);
};

// Listen generically for all termination signals
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, gracefulShutdown);
});
