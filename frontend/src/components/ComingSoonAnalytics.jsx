import { BarChart3, Clock } from 'lucide-react';

const ComingSoonAnalytics = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Clock className="w-4 h-4" />
          Coming Soon
        </div>
        
        {/* Main Content */}
        <BarChart3 className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          Track your study progress, view detailed insights, and monitor your learning journey.
        </p>
        
        {/* Simple Feature List */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Upcoming Features:</h3>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li>• Study time tracking</li>
            <li>• Progress charts</li>
            <li>• Performance insights</li>
            <li>• Achievement badges</li>
          </ul>
        </div>
        
        {/* Back Button */}
        <button 
          onClick={() => window.history.back()}
          className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ComingSoonAnalytics;