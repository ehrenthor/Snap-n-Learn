import React from 'react';
import './AdultSidebar.css';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
const AdultSidebar = ({ isSidebarOpen, toggleSidebar, toggleSidebarButton }) => {

  const navigate = useNavigate();
  const childUsername = Cookies.get("childUsername");

  const handleBackButton = () => {
    Cookies.remove('childUsername');
    Cookies.remove('childUserId');
    navigate(`/adultHomepage`);
  }; 

  return (
    <div className="adultSidebar-container">
      {/* Sidebar */}
      <div className={`adultSidebar ${isSidebarOpen ? 'adultHomepage-open' : 'adultHomepage-closed'}`}>
        <button className="adultSidebar-close-button" onClick={toggleSidebar}>
          ×
        </button>
        <ul style={{paddingTop: '20%'}}>
          <li onClick={handleBackButton}>Home</li>          
          <li onClick={() => navigate(`/editChild/${childUsername}`)}>Child Settings</li>
          <li onClick={() => navigate(`/adultChildUploadHistory/${childUsername}`)}>My Child's History</li>
          <li onClick={() => navigate('/adultQuizMain')}>Quiz</li>
        </ul>
      </div>

      {/* Sidebar Toggle Button */}
      <button 
        className={`adultSidebar-toggle-button ${isSidebarOpen ? 'hidden' : 'visible'}`} 
        onClick={toggleSidebarButton}>
        ☰
      </button>
    </div>
  );
};

export default AdultSidebar;
