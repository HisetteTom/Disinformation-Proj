import React from 'react';

function AnimatedStyles() {
  return (
    <style jsx global>{`
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 0.3;
        }
        50% {
          opacity: 1;
        }
      }

      .text-shadow {
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .animate-fadeIn {
        animation: fadeIn 0.7s ease-in-out forwards;
      }

      .animate-fadeInUp {
        animation: fadeInUp 0.7s ease-in-out forwards;
      }

      .animate-slideIn {
        animation: slideIn 0.5s ease-in-out forwards;
      }
    `}</style>
  );
}

export default AnimatedStyles;