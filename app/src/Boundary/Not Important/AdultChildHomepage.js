import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Component/AdultSidebar';
import Header from '../../Component/AdultHeader';
import './AdultChildHomepage.css';
import Cookies from 'js-cookie';
const apiUrl = process.env.REACT_APP_API_URL;

const AdultHomepage = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [error, setError] = useState(null);
  const [username] = useState(Cookies.get("username"));
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const fetchChildrenData = async () => {
    try {
      const response = await fetch(`${apiUrl}/users/getChildren`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({username}),
      });
      const data = await response.json();

      if (response.ok) {
        setChildren(data);
      }
      else if (response.status===500) {
        setError('Error fetching children data');
      }
    } catch (error) {
      setError('Error fetching children data');
      console.error("Error fetching children data:", error);
    }
  };

  useEffect(() => {
    fetchChildrenData();
  }, []);

  const handleChildAccountClick = (childUsername) => {
    navigate(`/childAccount/${childUsername}`); // Navigate to the child's account page
  };

  return (
    <div className="adultHomepage-homepage">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        toggleSidebarButton={toggleSidebar}
      />

      <div className={`adultHomepage-main-content ${isSidebarOpen ? 'adultHomepage-shifted' : 'adultHomepage-full'}`}>
        <Header />

        <div className="child-section">
          <h2>Child:</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <ul>
            {children.length === 0 ? (
              <span>No children accounts available.</span>
            ) : (
              children.map((child) => (
                <li key={child.username} onClick={() => handleChildAccountClick(child.username)} title={child.username}>
                  {child.username.length > 3 
                    ? `${child.username.substring(0, 2)}...` 
                    : child.username}
                </li>
              ))
            )}
          </ul>

          <button 
            onClick={() => navigate('/adultRegisterChild', { state: { userType: 'Child' } })} 
            className="register-circle-button"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdultHomepage;
