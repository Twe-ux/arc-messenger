'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { RefreshCw, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestGmailPage() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const forceGmailReauth = async () => {
    // Clear session and redirect to Google with forced consent
    await signOut({ redirect: false });
    
    // Wait a bit for session to clear
    setTimeout(() => {
      signIn('google', { 
        callbackUrl: '/test-gmail',
      });
    }, 1000);
  };

  const runDebugTest = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/gmail/debug');
      const data = await response.json();
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        status: 500,
        data: { error: error.message },
      });
    } finally {
      setLoading(false);
    }
  };

  const testGmailAPI = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/gmail/conversations?limit=5');
      const data = await response.json();
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        status: 500,
        data: { error: error.message },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Mail className="w-6 h-6 text-purple-600" />
            Gmail Integration Test
          </h1>

          {/* Authentication Status */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {status === 'authenticated' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span>Session Status: {status}</span>
              </div>

              {session?.user && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>User: {session.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Name: {session.user.name}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex gap-4">
              {status === 'authenticated' ? (
                <>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={forceGmailReauth}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Re-auth with Gmail
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Gmail Tests</h2>
            
            <div className="flex gap-4">
              <button
                onClick={runDebugTest}
                disabled={loading || status !== 'authenticated'}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                Run Debug Test
              </button>

              <button
                onClick={testGmailAPI}
                disabled={loading || status !== 'authenticated'}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Test Gmail API
              </button>
            </div>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Test Results</h2>
              
              <div className={`p-4 rounded-lg ${
                testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              } border`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    Status: {testResult.status} ({testResult.success ? 'Success' : 'Failed'})
                  </span>
                </div>

                <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border-blue-200 border rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>Make sure you're signed in with a Google account</li>
              <li>The Google account should have Gmail access</li>
              <li>Run the Debug Test first to check configuration</li>
              <li>If debug passes, test the Gmail API</li>
              <li>Check the browser console for detailed logs</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}