import React, { useState, useEffect, useRef } from 'react';
import type { VocabularyWord } from '../../types';

export interface LazyWordCardProps {
  word: VocabularyWord;
  accentColor: string;
  onClick: () => void;
  index: number;
}

export const LazyWordCard: React.FC<LazyWordCardProps> = ({
  word,
  accentColor,
  onClick,
  index
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // First 20 cards render immediately without lazy loading
    if (index < 20) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [index]);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="flex">
        {/* Left accent stripe */}
        <div className={`w-1 ${accentColor}`}></div>

        {/* Card content */}
        <div className="flex-1 p-2.5">
          {isVisible ? (
            <>
              {/* English word */}
              <h3 className="text-base font-bold text-gray-900 mb-1.5 truncate">
                {word.english_word}
              </h3>

              {/* Chinese definition (includes part of speech in English) */}
              {word.chinese_definition && (
                <p
                  className="text-sm text-gray-600 overflow-hidden"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.4'
                  }}
                >
                  {word.chinese_definition}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-gray-400 text-sm">載入中...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
