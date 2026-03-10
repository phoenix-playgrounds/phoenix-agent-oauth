import { jest } from "@jest/globals";

const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockWriteFileSync = jest.fn();

jest.unstable_mockModule("fs", () => ({
    default: {
        existsSync: mockExistsSync,
        mkdirSync: mockMkdirSync,
        writeFileSync: mockWriteFileSync
    },
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    writeFileSync: mockWriteFileSync
}));

describe("loadInjectedCredentials", () => {
    let loadInjectedCredentials;
    const originalEnv = { ...process.env };

    beforeEach(async () => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        process.env = { ...originalEnv };

        // Re-import to pick up fresh env
        const mod = await import("../src/credential_injector.mjs");
        loadInjectedCredentials = mod.loadInjectedCredentials;
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    it("returns false when AGENT_CREDENTIALS_JSON is not set", () => {
        delete process.env.AGENT_CREDENTIALS_JSON;
        expect(loadInjectedCredentials()).toBe(false);
        expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it("returns false when AGENT_CREDENTIALS_JSON is empty", () => {
        process.env.AGENT_CREDENTIALS_JSON = "";
        expect(loadInjectedCredentials()).toBe(false);
    });

    it("returns false when SESSION_DIR is not set", () => {
        process.env.AGENT_CREDENTIALS_JSON = '{"token.txt":"abc"}';
        delete process.env.SESSION_DIR;
        expect(loadInjectedCredentials()).toBe(false);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("SESSION_DIR"));
    });

    it("returns false for invalid JSON", () => {
        process.env.AGENT_CREDENTIALS_JSON = "not-json";
        process.env.SESSION_DIR = "/tmp/test";
        expect(loadInjectedCredentials()).toBe(false);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining("Failed to parse"),
            expect.any(String)
        );
    });

    it("returns false for non-object JSON (array)", () => {
        process.env.AGENT_CREDENTIALS_JSON = '["a","b"]';
        process.env.SESSION_DIR = "/tmp/test";
        expect(loadInjectedCredentials()).toBe(false);
    });

    it("returns false for empty object", () => {
        process.env.AGENT_CREDENTIALS_JSON = '{}';
        process.env.SESSION_DIR = "/tmp/test";
        expect(loadInjectedCredentials()).toBe(false);
    });

    it("writes credential files to SESSION_DIR with 0o600 permissions", () => {
        process.env.AGENT_CREDENTIALS_JSON = '{"agent_token.txt":"sk-ant-123"}';
        process.env.SESSION_DIR = "/home/node/.claude";
        mockExistsSync.mockReturnValue(true);

        expect(loadInjectedCredentials()).toBe(true);
        expect(mockWriteFileSync).toHaveBeenCalledWith(
            "/home/node/.claude/agent_token.txt",
            "sk-ant-123",
            { mode: 0o600 }
        );
    });

    it("creates SESSION_DIR if it doesn't exist", () => {
        process.env.AGENT_CREDENTIALS_JSON = '{"auth.json":"{}"}';
        process.env.SESSION_DIR = "/home/node/.codex";
        mockExistsSync.mockReturnValue(false);

        loadInjectedCredentials();
        expect(mockMkdirSync).toHaveBeenCalledWith("/home/node/.codex", { recursive: true });
    });

    it("writes multiple credential files", () => {
        process.env.AGENT_CREDENTIALS_JSON = JSON.stringify({
            "oauth_creds.json": '{"token":"abc"}',
            "credentials.json": '{"refresh":"xyz"}'
        });
        process.env.SESSION_DIR = "/home/node/.gemini";
        mockExistsSync.mockReturnValue(true);

        expect(loadInjectedCredentials()).toBe(true);
        expect(mockWriteFileSync).toHaveBeenCalledTimes(2);
    });

    it("rejects path traversal in filenames", () => {
        process.env.AGENT_CREDENTIALS_JSON = '{"../../../etc/passwd":"malicious"}';
        process.env.SESSION_DIR = "/home/node/.claude";
        mockExistsSync.mockReturnValue(true);

        expect(loadInjectedCredentials()).toBe(false);
        expect(mockWriteFileSync).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("suspicious"));
    });
});
