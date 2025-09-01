import { useState } from 'react';

const Flashcard = ({ question, answer, index }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className="relative h-64 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div className={`absolute inset-0 w-full h-full transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front of card (Question) */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex flex-col justify-center items-center p-6 text-white">
            <div className="text-sm font-medium opacity-80 mb-2">Question {index + 1}</div>
            <div className="text-lg font-semibold text-center leading-relaxed">
              {question}
            </div>
            <div className="mt-4 text-sm opacity-70">Click to reveal answer</div>
          </div>

          {/* Back of card (Answer) */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex flex-col justify-center items-center p-6 text-white rotate-y-180">
            <div className="text-sm font-medium opacity-80 mb-2">Answer</div>
            <div className="text-lg font-semibold text-center leading-relaxed">
              {answer}
            </div>
            <div className="mt-4 text-sm opacity-70">Click to see question</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
