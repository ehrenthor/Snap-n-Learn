import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminHomePage.css';
import Cookies from 'js-cookie';
const apiUrl = process.env.REACT_APP_API_URL;

const AdminHomepage = () => {
  const [username] = useState(Cookies.get("username"));
  const navigate = useNavigate();

  useEffect(() => {
    if (Cookies.get("userType") !== "Admin") {
      navigate("/unauthorized");
    }
  }, [navigate]);

  const handleLogout = async() => {
    Cookies.remove("username");
    Cookies.remove("userType");

    try {
          await fetch(`${apiUrl}/users/logout`, {
            method: 'POST',
            credentials: 'include'
          });
      
        } catch (error) {
          console.error('Logout error:', error);
        }

    navigate('/admin');
  };

  return (
    <div className="adminHomepage-container">
      <header className="adminHomepage-header">
        <h1 className="adminHomepage-title">Administration Console</h1>
        <div className="adminHomepage-userinfo">
          <span className="adminHomepage-username">{username}</span>
          <button className="adminHomepage-logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <div className="adminHomepage-content">
        <nav className="adminHomepage-nav">
          <button className="adminHomepage-nav-btn" onClick={() => navigate('/viewUsers')}>
            User Management
          </button>
          <button 
            className="adminHomepage-nav-btn" 
            onClick={() => navigate('/registerAdmin', { state: { userType: 'Admin' } })}
          >
            Admin Registration
          </button>
          <button className="adminHomepage-nav-btn" onClick={() => navigate('/userStatistics')}>
            Usage Analytics
          </button>
        </nav>
      </div>
    </div>
  );
};

export default AdminHomepage;