import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./AdminLoginPage.css";
import Cookies from 'js-cookie';
import personIcon from "../../Assets/person.png";
import passwordIcon from "../../Assets/password.png";
import logo from "../../Assets/SnLLogo.JPG";
import { useAuth } from "../../Contexts/AuthContext";

const apiUrl = process.env.REACT_APP_API_URL;

const AdminLoginPage = () => {
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
        if (data.userType === "Admin") {

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
            Cookies.set('userType', data.userType);
            navigate("/adminHomepage");
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "Only admins can log in.",
          });
        }
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
    <div className="adminLogin-container">
      {/* Logo */}
      <div className="adminLogin-logo-container">
        <img src={logo} alt="Logo" className="adminLogin-logo"/>
      </div>

      <div className="adminLogin-title"><h2>Admin Login</h2></div>
      <form onSubmit={handleLogin} className="adminLogin-form">

        {/* Username Input with Icon */}
        <div className="adminLogin-input-container">
          <img src={personIcon} className="adminLogin-input-icon" alt="User Icon"/>
          <input
            type="text"
            placeholder="Enter Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="adminLogin-input"
          />
        </div>

        <div className="adminLogin-input-container">
          <img src={passwordIcon} className="adminLogin-input-icon" alt="Lock Icon"/>
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="adminLogin-input"
          />
        </div>

        <button type="submit" className="adminLogin-button">Login</button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
