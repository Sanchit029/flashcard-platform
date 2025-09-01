import { useState } from 'react';
import axios from 'axios';

const ApiTest = ({ token }) => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testTextUpload = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5003/api/ai/upload/text',
        { text: 'This is a test text for the API.' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTestResult(`Success: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      setTestResult(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5003/api/flashcard-sets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestResult(`Backend Connected: Got ${response.data.length} flashcard sets`);
    } catch (error) {
      setTestResult(`Backend Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testBackendConnection}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Backend Connection'}
        </button>
        
        <button
          onClick={testTextUpload}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Text Upload API'}
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;
