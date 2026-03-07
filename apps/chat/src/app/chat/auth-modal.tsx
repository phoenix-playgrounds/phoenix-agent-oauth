import { useState } from 'react';
import type { AuthModalState } from './use-chat-websocket';

interface AuthModalProps {
  open: boolean;
  authModal: AuthModalState;
  onClose: () => void;
  onSubmitCode: (code: string) => void;
}

export function AuthModal({ open, authModal, onClose, onSubmitCode }: AuthModalProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const showUrl = authModal.authUrl && !authModal.isManualToken;
  const isDeviceCode = Boolean(authModal.deviceCode && !authModal.isManualToken);
  const codeLabel = authModal.isManualToken
    ? 'Paste Claude Code OAuth Token'
    : isDeviceCode
      ? 'One-time device code'
      : 'Paste authorization code';
  const codeValue = isDeviceCode ? (authModal.deviceCode ?? '') : code;
  const readOnly = isDeviceCode;
  const showSubmit = !isDeviceCode;

  const handleSubmit = () => {
    const value = codeValue.trim();
    if (!value && !readOnly) return;
    setSubmitting(true);
    onSubmitCode(value);
    setCode('');
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-600">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <KeyIcon />
            Connect to Provider
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="p-4 space-y-4">
          {showUrl && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">
                Please follow the link below to authorize the AI assistant.
              </p>
              <a
                href={authModal.authUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
              >
                <ExternalIcon />
                Open Authentication URL
              </a>
            </div>
          )}
          {showUrl && (authModal.deviceCode || authModal.isManualToken) && (
            <div className="border-t border-slate-600 pt-4" />
          )}
          <div className="space-y-2">
            <label htmlFor="auth-code" className="block text-sm font-medium text-slate-300">
              {codeLabel}
            </label>
            <input
              id="auth-code"
              type="text"
              value={codeValue}
              readOnly={readOnly}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste code here..."
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {showSubmit && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
