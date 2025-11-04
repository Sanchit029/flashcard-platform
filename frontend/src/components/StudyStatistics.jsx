/**
 * Study Statistics Component
 * 
 * Displays recent Quick Revision sessions from localStorage
 */

import { useState, useEffect } from 'react';

export default function StudyStatistics() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalCards: 0,
    averageAccuracy: 0,
    totalTime: 0
  });

  useEffect(() => {
    // Load sessions from localStorage
    const savedSessions = JSON.parse(localStorage.getItem('quickRevisionSessions') || '[]');
    setSessions(savedSessions.slice(0, 5)); // Show last 5 sessions

    // Calculate aggregate stats
    if (savedSessions.length > 0) {
      const totalSessions = savedSessions.length;
      const totalCards = savedSessions.reduce((sum, s) => sum + s.totalCards, 0);
      const avgAccuracy = Math.round(
        savedSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / savedSessions.length
      );
      const totalTime = savedSessions.reduce((sum, s) => sum + s.duration, 0);

      setStats({
        totalSessions,
        totalCards,
        averageAccuracy: avgAccuracy,
        totalTime
      });
    }
  }, []);

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <span>⚡</span>
        Quick Revision Stats
      </h2>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-4xl font-bold mb-2">{stats.totalSessions}</div>
          <div className="text-sm opacity-90">Sessions</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-4xl font-bold mb-2">{stats.totalCards}</div>
          <div className="text-sm opacity-90">Cards Reviewed</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-4xl font-bold mb-2">{stats.averageAccuracy}%</div>
          <div className="text-sm opacity-90">Avg Accuracy</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-4xl font-bold mb-2">{stats.totalTime}m</div>
          <div className="text-sm opacity-90">Total Time</div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 opacity-90">Recent Sessions</h3>
        <div className="space-y-2">
          {sessions.map((session, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="font-medium">{session.setTitle || 'Flashcard Set'}</div>
                <div className="text-sm opacity-75">
                  {new Date(session.date).toLocaleDateString()} • {session.duration}m
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{session.accuracy}%</div>
                <div className="text-xs opacity-75">{session.known}/{session.totalCards}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motivational Message */}
      <div className="mt-6 text-center">
        <p className="text-lg font-medium">
          {stats.averageAccuracy >= 80 && "🎉 Excellent work! Keep it up!"}
          {stats.averageAccuracy >= 60 && stats.averageAccuracy < 80 && "💪 Great progress! You're improving!"}
          {stats.averageAccuracy < 60 && "🚀 Keep practicing! You're learning!"}
        </p>
      </div>
    </div>
  );
}
