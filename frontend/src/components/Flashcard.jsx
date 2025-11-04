import { useState, useEffect } from 'react';

const Flashcard = ({ 
  question, 
  answer, 
  index, 
  cardId,
  difficulty = 'medium',
  onKnown,
  onReview,
  onEdit,
  onRegenerate,
  showActions = true
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState(question);
  const [editAnswer, setEditAnswer] = useState(answer);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [cardId]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnown = () => {
    if (onKnown) {
      onKnown(cardId, index);
    }
    setIsFlipped(false);
  };

  const handleNeedReview = () => {
    if (onReview) {
      onReview(cardId, index);
    }
    setIsFlipped(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditQuestion(question);
    setEditAnswer(answer);
    setIsFlipped(false);
  };

  const handleSaveEdit = async () => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      alert('Both question and answer are required');
      return;
    }

    setSaving(true);
    try {
      if (onEdit) {
        await onEdit(cardId, editQuestion.trim(), editAnswer.trim());
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditQuestion(question);
    setEditAnswer(answer);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      if (onRegenerate) {
        await onRegenerate(cardId);
      }
    } catch (error) {
      console.error('Error regenerating card:', error);
      alert('Failed to regenerate card');
    } finally {
      setRegenerating(false);
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy': return 'from-green-500 to-green-600';
      case 'hard': return 'from-red-500 to-red-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Info and Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
          <span className="text-gray-600">Card {index + 1}</span>
          <span className="text-gray-500">•</span>
          <span className="capitalize text-gray-600">{difficulty}</span>
        </div>
        
        {/* Edit and Regenerate buttons */}
        {!isEditing && (onEdit || onRegenerate) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit flashcard"
              >
                ✏️
              </button>
            )}
            {onRegenerate && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate with AI"
              >
                {regenerating ? '⏳' : '🔄'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Mode */}
      {isEditing ? (
        <div className="bg-white border-2 border-blue-200 rounded-xl shadow-lg p-6">
          <div className="text-lg font-semibold text-gray-800 mb-4">Edit Flashcard {index + 1}</div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <textarea
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
                placeholder="Enter the question..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
              <textarea
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
                placeholder="Enter the answer..."
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSaveEdit}
              disabled={saving || !editQuestion.trim() || !editAnswer.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Normal Card View */
        <>
          <div 
            className="relative h-64 cursor-pointer perspective-1000"
            onClick={handleFlip}
          >
            <div className={`absolute inset-0 w-full h-full transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front of card (Question) */}
              <div className={`absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br ${getDifficultyColor()} rounded-xl shadow-lg flex flex-col justify-center items-center p-6 text-white`}>
                <div className="text-sm font-medium opacity-80 mb-2">Question {index + 1}</div>
                <div className="text-lg font-semibold text-center leading-relaxed">
                  {question}
                </div>
                <div className="mt-4 text-sm opacity-70">Click to reveal answer</div>
              </div>

              {/* Back of card (Answer) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg flex flex-col justify-center items-center p-6 text-white rotate-y-180">
                <div className="text-sm font-medium opacity-80 mb-2">Answer</div>
                <div className="text-lg font-semibold text-center leading-relaxed">
                  {answer}
                </div>
                <div className="mt-4 text-sm opacity-70">How did you do?</div>
              </div>
            </div>
          </div>

          {/* Quick Revision Buttons */}
          {isFlipped && showActions && (onKnown || onReview) && (
            <div className="mt-6 space-y-3">
              <div className="text-center text-gray-700 font-medium">Did you know this?</div>
              <div className="flex gap-4 justify-center">
                {onReview && (
                  <button
                    onClick={handleNeedReview}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg font-medium transition-colors shadow-sm border border-orange-200"
                  >
                    <span className="text-xl">🔄</span>
                    <span>Review Again</span>
                  </button>
                )}
                {onKnown && (
                  <button
                    onClick={handleKnown}
                    className="flex items-center gap-2 px-6 py-3 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-medium transition-colors shadow-sm border border-green-200"
                  >
                    <span className="text-xl">✅</span>
                    <span>Got It!</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Flashcard;
