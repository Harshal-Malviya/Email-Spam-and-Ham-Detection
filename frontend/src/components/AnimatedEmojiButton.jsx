// src/components/AnimatedEmojiButton.jsx
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion'; // Import motion for animations

const AnimatedEmojiButton = ({ onClick }) => {
  return (
    <StyledWrapper
      onClick={onClick}
      as={motion.button} // Use motion.button for framer-motion animations
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <span data-active-content="🤨" data-hover-content="😑" data-content="😐" className="animated-emoji" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  background: none;
  border: none;
  color: #5f6368;
  font-size: 1.1rem; /* Inherit font size from ComposeMail toolbar */
  width: 32px; /* Inherit width from ComposeMail toolbar */
  height: 32px; /* Inherit height from ComposeMail toolbar */
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f0f4f9; /* Apply hover background from ComposeMail toolbar */
  }

  .animated-emoji {
    font-size: 24px; /* Adjust size to fit toolbar, originally 48px */
    display: flex; /* Ensure it centers */
    align-items: center;
    justify-content: center;
  }

  .animated-emoji:after {
    content: attr(data-content);
  }

  .animated-emoji:hover:after {
    content: attr(data-hover-content);
  }

  .animated-emoji:active:after {
    content: attr(data-active-content);
  }
`;

export default AnimatedEmojiButton;