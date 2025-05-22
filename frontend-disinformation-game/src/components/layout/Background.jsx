import React from 'react';
import './background-animation.css';

function Background() {
  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a1f38] via-[#123C6D] to-[#1a4b82]">
      <div className="network-grid"></div>
      <div className="information-flow"></div>
      
      {/* Multiple truth bubbles with different positions and animations */}
      <div className="truth-bubble truth-bubble-1"></div>
      <div className="truth-bubble truth-bubble-2"></div>
      <div className="truth-bubble truth-bubble-3"></div>
      <div className="truth-bubble truth-bubble-4"></div>
      <div className="truth-bubble truth-bubble-5"></div>
      <div className="truth-bubble truth-bubble-6"></div>
      
      {/* Multiple falsehood symbols with different positions and animations */}
      <div className="false-symbol false-symbol-1"></div>
      <div className="false-symbol false-symbol-2"></div>
      <div className="false-symbol false-symbol-3"></div>
      <div className="false-symbol false-symbol-4"></div>
      <div className="false-symbol false-symbol-5"></div>
      <div className="false-symbol false-symbol-6"></div>
      
      {/* Social media symbols */}
      <div className="social-symbol social-symbol-1">#</div>
      <div className="social-symbol social-symbol-2">@</div>
      <div className="social-symbol social-symbol-3">#</div>
      <div className="social-symbol social-symbol-4">@</div>
    </div>
  );
}

export default Background;