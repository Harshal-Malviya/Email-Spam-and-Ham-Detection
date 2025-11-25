// src/components/Button.jsx
import React from 'react';
import styled from 'styled-components';

const Button = ({ onClick, buttonText = "Button" }) => {
  return (
    <StyledWrapper>
      <button onClick={onClick}>
        {buttonText}
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
    padding: 1.2em 2em;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: bold; /* Changed to bold as requested */
    color: #000;
    background-color:#c3bcff;
    border: none;
    border-radius: 45px;
    box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease 0s;
    cursor: pointer;
    font-weight: bold;
    outline: none;
  }

  button:hover {
    background-color:rgb(103, 86, 255);
    box-shadow: 0px 15px 20px rgba(46, 49, 229, 0.4);
    color: #fff;
    transform: translateY(-7px);
    font-weight: bold;
  }

  button:active {
    transform: translateY(-1px);
    font-weight: bold;
  }
`;

export default Button;