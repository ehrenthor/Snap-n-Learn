import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../Component/AdultHeader';
import './AdultHomepage.css';
import Cookies from 'js-cookie';
const apiUrl = process.env.REACT_APP_API_URL;

const AdultHomepage = () => {
  const [children, setChildren] = useState([]);
  const [error, setError] = useState(null);
  const [username] = useState(Cookies.get("username"));
  const navigate = useNavigate();

  const fetchChildrenData = async () => {
    try {
      const response = await fetch(`${apiUrl}/users/getChildren`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({username}),
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        setChildren(data);
      }
      else {
        setError(data.error || 'Error fetching children data');
        console.error("Error fetching children data:", data.error || response.statusText);
      }
    } catch (error) {
      setError('Network error fetching children data');
      console.error("Network error fetching children data:", error);
    }
  };

  useEffect(() => {
    fetchChildrenData();
  }, []);

  const handleChildAccountClick = (childUsername, childUserId) => {
    // Store child username in cookies before navigation
    Cookies.set('childUsername', childUsername);
    Cookies.set('childUserId', childUserId);
    navigate(`/adultJoinChildSession`);
  };

  const handleLogout = async() => {
    Cookies.remove('username');
    Cookies.remove('childUsername');
    Cookies.remove('childUserId');

    try {
          await fetch(`${apiUrl}/users/logout`, {
            method: 'POST',
            credentials: 'include'
          });
      
        } catch (error) {
          console.error('Logout error:', error);
        }

    navigate('/adultLogin');
  };

  return (
    <div className="adultHomepage-container">
      <Header />
      <div className="adultHomepage-content">
        <div className="adultHomepage-header">
          <h2 className="adultHomepage-title">Child:</h2>
          <div className="adultHomepage-button-group">
            <button 
              onClick={handleLogout}
              className="adultHomepage-logout-button"
            >
              Logout
            </button>
            <button
              onClick={() => navigate('/adult/statistics')}
              className="adultHomepage-stats-button"
            >
              View Statistics
            </button>
          </div>
        </div>

        {error && <p className="adultHomepage-error">{error}</p>}

        <div className="adultHomepage-children-grid">
          {children.map((child) => (
            <div 
              key={child.username}
              className="adultHomepage-child-card"
              onClick={() => handleChildAccountClick(child.username, child.userId)}
              title={child.username}
            >
              <div className="adultHomepage-child-initials">
                {child.username.substring(0, 2).toUpperCase()}
              </div>
              <span className="adultHomepage-child-name">
                {child.username.length > 12 
                  ? `${child.username.substring(0, 10)}...` 
                  : child.username}
              </span>
            </div>
          ))}
          
          <button 
            className="adultHomepage-add-button"
            onClick={() => navigate('/adultRegisterChild', { state: { userType: 'Child' } })}
          >
            <div className="adultHomepage-plus-icon">+</div>
            Add Child
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdultHomepage;