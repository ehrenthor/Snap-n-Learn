import React, { useState } from "react"; 
import { useAuth } from '../../Contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./AdultLoginPage.css";
import Cookies from 'js-cookie';
import personIcon from "../../Assets/person.png";
import passwordIcon from "../../Assets/password.png";
import logo from "../../Assets/SnLLogo.JPG";

const apiUrl = process.env.REACT_APP_API_URL;

const AdultLogin = () => {
  const { setAuthState } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch(`${apiUrl}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
  
      const data = await response.json();
  
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: `Welcome, ${data.username}!`,
          confirmButtonText: "OK",
        }).then(() => {
          setAuthState({
            isAuthenticated: true,
            userType: data.userType,
            username: data.username,
            userId: data.userId
          });
          Cookies.set('username', data.username);
          navigate("/adultHomepage");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: data.error,
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
    <div className="adultLogin-container">
      <button 
        className="adultLogin-backButton" 
        onClick={() => navigate("/")}
        aria-label="Go back"
      >
        <span className="adultLogin-backArrow"></span>
      </button>

      <div className="adultLogin-logoContainer">
        <img src={logo} alt="Logo" className="adultLogin-logo" />
      </div>

      <h1 className="adultLogin-title">Welcome Back</h1>
      
      <form onSubmit={handleLogin} className="adultLogin-form">
        <div className="adultLogin-inputContainer">
          <img src={personIcon} className="adultLogin-inputIcon" alt="User" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="adultLogin-input"
          />
        </div>

        <div className="adultLogin-inputContainer">
          <img src={passwordIcon} className="adultLogin-inputIcon" alt="Password" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="adultLogin-input"
          />
        </div>

        <button type="submit" className="adultLogin-primaryButton">Sign In</button>
      </form>

      <div className="adultLogin-footer">
        <p className="adultLogin-footerText">Don't have an account?</p>
        <button 
          onClick={() => navigate("/registerAdult")} 
          className="adultLogin-secondaryButton"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};

export default AdultLogin;
