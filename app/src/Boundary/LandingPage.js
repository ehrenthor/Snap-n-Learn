import './LandingPage.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import logo from "../Assets/SnLLogo.JPG";

const LandingPage = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false); // State for fade-out

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleWelcomeClick = () => {
    setFadeOut(true); // Trigger fade-out
    // Add a delay to allow the fade-out animation to complete
    setTimeout(() => navigate("/childLogin"), 500); // Matches the fade-out duration
  };

  const handleAdultClick = () => {
    setFadeOut(true); // Trigger fade-out
    // Add a delay to allow the fade-out animation to complete
    setTimeout(() => navigate("/adultLogin"), 500); // Matches the fade-out duration
  };

  return (
    <div className={`landingPage-container ${fadeIn ? "fade-in" : ""} ${fadeOut ? "fade-out" : ""}`}>
      {/* Logo in the middle with a shadowy outline */}
      <div className="landingPage-logoContainer">
        <img src={logo} alt="Website Logo" className="landingPage-logo"/>
      </div>

      {/* Welcome button for kids */}
      <button className="landingPage-welcomeButton" onClick={handleWelcomeClick}>
        Welcome!
      </button>

      {/* Admin button (less obvious) */}
      <button className="landingPage-adminLink" onClick={handleAdultClick}>
        For Grown-Ups
      </button>
    </div>
  );
}

export default LandingPage;