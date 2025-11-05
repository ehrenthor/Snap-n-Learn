import React, { useState } from 'react';
import './AnimatedCharacter.css';
import Lottie from 'lottie-react';
import characterIdle from '../Assets/character-idle.json';
import characterHover from '../Assets/character-hover.json';

const AnimatedCharacter = () => {
  const [characterState, setCharacterState] = useState({
    animation: characterIdle,
    message: '',
    visible: true
  });

  const characterMessages = [
    "How are you doing today?",
    "What shall we learn today?",
    "Ready for some fun learning?",
    "You're doing great!",
    "Let's explore together!"
  ];

  const handleCharacterHover = () => {
    const randomIndex = Math.floor(Math.random() * characterMessages.length);
    if (characterState.animation === characterIdle) {
        setCharacterState(prev => ({
        ...prev,
        visible: false
        }));
        
        // After fade out completes, change animation and fade in
        setTimeout(() => {
        setCharacterState({
            animation: characterHover,
            message: characterMessages[randomIndex],
            visible: true // Trigger fade in
        });
        }, 300);
    }
  };
  
  const handleCharacterLeave = () => {
    setCharacterState(prev => ({
      ...prev,
      visible: false // Start fade out
    }));
    
    setTimeout(() => {
      setCharacterState({
        animation: characterIdle,
        message: '',
        visible: true // Trigger fade in
      });
    }, 300);
  };

  return (
    <div>     
        {characterState.message && (
            <div className={`childHomepage-speechBubble ${characterState.message ? 'fade-in' : 'fade-out'}`}>
            {characterState.message}
            </div>
        )}
        
        <div 
            onMouseEnter={handleCharacterHover}
            onMouseLeave={handleCharacterLeave}
            className={`childHomepage-lottieContainer ${characterState.visible ? "fade-in" : "fade-out"}`}
        >
            <Lottie
            animationData={characterState.animation}
            loop={true}
            autoplay={true}
            />
        </div>
    </div>
  );
};

export default AnimatedCharacter;