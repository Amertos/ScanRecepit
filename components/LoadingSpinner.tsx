import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <svg width="80" height="80" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-white">
          <style>{`.spinner_DupU{animation:spinner_sM3D 1.2s linear infinite}.spinner_GWtZ{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-.1s}.spinner_dwN6{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-.2s}.spinner_4_Gg{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-.3s}.spinner_Q7Yc{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-.4s}.spinner_4vM5{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-.5s}.spinner_1_s1{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-.6s}.spinner_Nu6h{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-.7s}.spinner_Ed1v{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-.8s}.spinner_z7PY{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-.9s}.spinner_K316{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-1s}.spinner_52_p{animation:spinner_sM3D 1.2s linear infinite;animation-delay:-1.1s}@keyframes spinner_sM3D{0%,50%{r:4px}100%{r:10px}}`}</style>
          <circle className="spinner_DupU" cx="12" cy="3" r="0" fill="currentColor"/>
          <circle className="spinner_GWtZ" cx="16.5" cy="4.21" r="0" fill="currentColor"/>
          <circle className="spinner_dwN6" cx="19.79" cy="7.5" r="0" fill="currentColor"/>
          <circle className="spinner_4_Gg" cx="21" cy="12" r="0" fill="currentColor"/>
          <circle className="spinner_Q7Yc" cx="19.79" cy="16.5" r="0" fill="currentColor"/>
          <circle className="spinner_4vM5" cx="16.5" cy="19.79" r="0" fill="currentColor"/>
          <circle className="spinner_1_s1" cx="12" cy="21" r="0" fill="currentColor"/>
          <circle className="spinner_Nu6h" cx="7.5" cy="19.79" r="0" fill="currentColor"/>
          <circle className="spinner_Ed1v" cx="4.21" cy="16.5" r="0" fill="currentColor"/>
          <circle className="spinner_z7PY" cx="3" cy="12" r="0" fill="currentColor"/>
          <circle className="spinner_K316" cx="4.21" cy="7.5" r="0" fill="currentColor"/>
          <circle className="spinner_52_p" cx="7.5" cy="4.21" r="0" fill="currentColor"/>
        </svg>
        <p className="mt-4 text-[var(--text-inverted)] font-semibold text-lg">AI is analyzing your receipt...</p>
      </div>
    </div>
  );
};