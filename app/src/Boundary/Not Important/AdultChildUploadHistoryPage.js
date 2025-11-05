import React, { useState, useEffect } from 'react';  // <-- Import useEffect
import Sidebar from '../../Component/AdultSidebar';
import Header from '../../Component/AdultHeader';
import './AdultChildUploadHistoryPage.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
const apiUrl = process.env.REACT_APP_API_URL;
const AdultChildUploadHistoryPage = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [children, setChildren] = useState([]);  // State to hold child accounts
  const [error, setError] = useState('');  // State for error handling
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
        } else {
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
  
    const handleChildAccountClick = (username) => {
      navigate(`/adultChildUploadHistory/${username}`); 
    };
  

  return (
    <div className="adultChildUploadHistoryPage-homepage">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        toggleSidebarButton={toggleSidebar}
      />

      <div className={`adultChildUploadHistoryPage-main-content ${isSidebarOpen ? 'adultChildUploadHistoryPage-shifted' : 'adultChildUploadHistoryPage-full'}`}>
        <Header />
        <div className="child-section">
          <h2>Child:</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error if there is one */}
          <ul>
            {children.length === 0 ? (
              <span>No children accounts available.</span>
            ) : (
              children.map((child) => (
                <li key={child.username} onClick={() => handleChildAccountClick(child.username)}>
                  {child.username} {/* Use child.Username instead of child.username */}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdultChildUploadHistoryPage;
