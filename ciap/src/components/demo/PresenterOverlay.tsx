import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, EyeOff, Presentation, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { demoWalkthroughSteps } from '../../data/intelligence';

const PresenterOverlay: React.FC = () => {
  const [visible, setVisible] = useState(() => localStorage.getItem('ciap_presenter_overlay') !== 'false');
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const step = demoWalkthroughSteps[stepIndex];

  if (!visible) {
    return (
      <button
        className="presenter-fab"
        onClick={() => {
          localStorage.setItem('ciap_presenter_overlay', 'true');
          setVisible(true);
        }}
        aria-label="Show presenter overlay"
        title="Show presenter overlay"
      >
        <Presentation size={18} />
      </button>
    );
  }

  const go = (nextIndex: number) => {
    const bounded = Math.max(0, Math.min(demoWalkthroughSteps.length - 1, nextIndex));
    setStepIndex(bounded);
    navigate(demoWalkthroughSteps[bounded].path);
  };

  return (
    <aside className="presenter-overlay" aria-label="Guided demo presenter overlay">
      <div className="presenter-header">
        <div>
          <div className="text-caption text-muted">Guided Demo</div>
          <strong>{step.feature}</strong>
        </div>
        <button
          className="icon-button"
          onClick={() => {
            localStorage.setItem('ciap_presenter_overlay', 'false');
            setVisible(false);
          }}
          aria-label="Hide presenter overlay"
          title="Hide presenter overlay"
        >
          <EyeOff size={15} />
        </button>
      </div>

      <div className="presenter-section">
        <div className="intel-label">Talking Points</div>
        {step.talkingPoints.map(point => <p key={point}>{point}</p>)}
      </div>
      <div className="presenter-section">
        <div className="intel-label">Business Impact</div>
        <p>{step.impact}</p>
      </div>
      <div className="presenter-grid">
        <div>
          <div className="intel-label">AI Models</div>
          <p>{step.models}</p>
        </div>
        <div>
          <div className="intel-label">Catalyst</div>
          <p>{step.catalyst}</p>
        </div>
      </div>
      <div className="recommendation"><Route size={14} /> {step.outcome}</div>

      <div className="presenter-actions">
        <button className="btn btn-secondary btn-sm" onClick={() => go(stepIndex - 1)} disabled={stepIndex === 0}>
          <ChevronLeft size={13} /> Back
        </button>
        <span className="text-caption text-muted">{stepIndex + 1}/{demoWalkthroughSteps.length}</span>
        <button className="btn btn-primary btn-sm" onClick={() => go(stepIndex + 1)} disabled={stepIndex === demoWalkthroughSteps.length - 1}>
          Next <ChevronRight size={13} />
        </button>
      </div>
    </aside>
  );
};

export default PresenterOverlay;
