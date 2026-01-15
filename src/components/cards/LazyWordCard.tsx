import React, { useState, useEffect, useRef } from "react";
import type { VocabularyWord } from "../../types";

export interface LazyWordCardProps {
  word: VocabularyWord;
  accentColor: string;
  onClick: () => void;
  index: number;
  isFavorite?: boolean;
  onToggleFavorite?: (wordId: number) => void;
}

export const LazyWordCard: React.FC<LazyWordCardProps> = ({
  word,
  accentColor,
  onClick,
  index,
  isFavorite = false,
  onToggleFavorite,
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
        rootMargin: "50px", // Start loading 50px before entering viewport
      },
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
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden flex flex-col relative group"
    >
      <div className="flex cursor-pointer" onClick={onClick}>
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

              {/* Chinese definition + POS original format */}
              <p
                className="text-sm text-gray-600 overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: "1.4",
                }}
              >
                {word.chinese_definition}
                {word.posOriginal && (
                  <span className="text-gray-500 font-medium">
                    {" "}{word.posOriginal}
                  </span>
                )}
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-gray-400 text-sm">
                載入中...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Favorite button */}
      {onToggleFavorite && isVisible && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(word.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-all opacity-0 group-hover:opacity-100"
          title={isFavorite ? "從重點訓練移除" : "加入重點訓練"}
        >
          {isFavorite ? (
            <svg
              className="w-5 h-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-gray-400 hover:text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};
