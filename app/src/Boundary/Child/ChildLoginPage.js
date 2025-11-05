import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Contexts/AuthContext';
import './ChildLoginPage.css';
import logo from "../../Assets/SnLLogo.JPG";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Cookies from 'js-cookie';
import { FaArrowLeft } from 'react-icons/fa'; // Import back arrow icon
const apiUrl = process.env.REACT_APP_API_URL;

const ChildLoginPage = () => {
  const { setAuthState } = useAuth();
  const [fadeIn, setFadeIn] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleBack = () => {
    setFadeOut(true);
    setTimeout(() => navigate(-1), 500); // Go back to previous page
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || username.trim() === "") {
      Swal.fire({
        icon: "info",
        title: "Oops!",
        text: "Please enter your name. If you don't have one, ask your parents to register for you!",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/users/childLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }), // Only send the username
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Welcome!",
          text: `Let's start learning, ${data.username}!`,
          confirmButtonText: "OK",
        }).then(() => {
          setAuthState({
            isAuthenticated: true,
            userType: data.userType,
            username: data.username,
            userId: data.userId
          });
          Cookies.set('username', data.username);
          navigate("/childHomepage"); // Navigate to the child homepage
        });
      } else if (data.isLocked) {
        Swal.fire({
          icon: "error",
          title: "Account Locked",
          text: "Your account has been locked. Please contact an administrator.",
          confirmButtonText: "OK",
        });
      } else {
        // Handle case where username doesn't exist
        Swal.fire({
          icon: "info",
          title: "Oops!",
          text: "It looks like you don't have an account yet. Ask your parents to register for you!",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong. Try again!",
      });
    }
  };

  return (
    <div className={`childLoginPage-container ${fadeIn ? "fade-in" : ""} ${fadeOut ? "fade-out" : ""}`}>
      {/* Back button */}
      <button className="childLoginPage-backButton" onClick={handleBack}>
        <FaArrowLeft/> Back
      </button>

      {/* Logo with chat bubble */}
      <div className="childLoginPage-logoContainer">
        <img src={logo} alt="Website Logo" className="childLoginPage-logo"/>
        <div className="childLoginPage-chatBubble">
          Hi there! What's your name?
        </div>
      </div>

      {/* Username input field */}
      <input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        className="childLoginPage-input"
      />

      {/* Submit button */}
      <button className="childLoginPage-submitButton" onClick={handleSubmit}>
        This is my name!
      </button>
    </div>
  );
};

export default ChildLoginPage;