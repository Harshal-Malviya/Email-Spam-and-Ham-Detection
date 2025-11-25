import React, { useEffect, useState } from 'react';
import './ModeTransition.css';

const ModeTransition = ({ trigger }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setActive(true);
      const timeout = setTimeout(() => setActive(false), 800); // match animation duration
      return () => clearTimeout(timeout);
    }
  }, [trigger]);

  return active ? <div className="mode-transition" /> : null;
};

export default ModeTransition;
