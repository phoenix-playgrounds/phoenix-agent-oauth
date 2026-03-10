import fs from "fs";
import path from "path";

/**
 * Loads pre-authenticated credentials from the AGENT_CREDENTIALS_JSON environment variable.
 *
 * This is injected by Phoenix when a stored Agent is attached to a Playground.
 * The JSON maps filenames to their contents, e.g.:
 *   { "agent_token.txt": "sk-ant-..." }       (Claude)
 *   { "oauth_creds.json": "{...}" }            (Gemini)
 *   { "auth.json": "{\"api_key\":\"...\"}" }   (OpenAI Codex)
 *
 * Files are written to SESSION_DIR (provider-specific config directory).
 * If AGENT_CREDENTIALS_JSON is not set or empty, this is a no-op.
 *
 * @returns {boolean} true if credentials were injected, false otherwise
 */
export function loadInjectedCredentials() {
    const raw = process.env.AGENT_CREDENTIALS_JSON;
    if (!raw || !raw.trim()) {
        return false;
    }

    const sessionDir = process.env.SESSION_DIR;
    if (!sessionDir) {
        console.warn("[CREDENTIALS] AGENT_CREDENTIALS_JSON is set but SESSION_DIR is not. Skipping injection.");
        return false;
    }

    let credentialFiles;
    try {
        credentialFiles = JSON.parse(raw);
    } catch (err) {
        console.error("[CREDENTIALS] Failed to parse AGENT_CREDENTIALS_JSON:", err.message);
        return false;
    }

    if (!credentialFiles || typeof credentialFiles !== "object" || Array.isArray(credentialFiles)) {
        console.error("[CREDENTIALS] AGENT_CREDENTIALS_JSON must be a JSON object { filename: content }");
        return false;
    }

    const entries = Object.entries(credentialFiles);
    if (entries.length === 0) {
        console.warn("[CREDENTIALS] AGENT_CREDENTIALS_JSON is empty object. Skipping.");
        return false;
    }

    // Ensure config directory exists
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
        console.log(`[CREDENTIALS] Created session directory: ${sessionDir}`);
    }

    let injectedCount = 0;
    for (const [filename, content] of entries) {
        // Security: prevent path traversal
        const sanitized = path.basename(filename);
        if (sanitized !== filename) {
            console.warn(`[CREDENTIALS] Skipping suspicious filename: ${filename}`);
            continue;
        }

        const filePath = path.join(sessionDir, sanitized);
        try {
            fs.writeFileSync(filePath, content, { mode: 0o600 });
            console.log(`[CREDENTIALS] Injected: ${filePath}`);
            injectedCount++;
        } catch (err) {
            console.error(`[CREDENTIALS] Failed to write ${filePath}:`, err.message);
        }
    }

    if (injectedCount > 0) {
        console.log(`[CREDENTIALS] Successfully injected ${injectedCount} credential file(s) from stored Agent.`);
    }

    return injectedCount > 0;
}
