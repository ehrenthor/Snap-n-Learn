import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './AdminUserStatistics.css';

const apiUrl = process.env.REACT_APP_API_URL;

const UserStatistics = () => {
  const [stats, setStats] = useState(null);
  const [error, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userType = Cookies.get("userType");
    if (userType !== "Admin") {
      navigate("/admin");
      return;
    }

    const fetchStatistics = async () => {
      try {
        const response = await fetch(`${apiUrl}/admin/user-statistics`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const data = await response.json();
        setStats(data)
      } catch (error) {
        console.error("Error fetching statistics:", error);
        setErrorMessage(`Failed to load statistics: ${error.message}`);
      }
    };

    fetchStatistics();
  }, []);

  return (
    <div className="adminUserStatistics-container">
      <div className="adminUserStatistics-header">
        <button 
          className="adminUserStatistics-backButton"
          onClick={() => navigate('/adminHomepage')}
        >
          &larr; Dashboard
        </button>
        <div className="adminUserStatistics-headerContent">
          <h2 className="adminUserStatistics-title">Usage Analytics Dashboard</h2>
          {error && <p className="adminUserStatistics-error">{error}</p>}
        </div>
      </div>

      {!stats ? (
        <p className="adminUserStatistics-loading">Loading statistics...</p>
      ) : (
        <div className="adminUserStatistics-grid">
          <div className="adminUserStatistics-statCard adminUserStatistics-childaccounts">
            <h3>Total Child Accounts</h3>
            <p>{stats.childCount}</p>
            <div className="adminUserStatistics-cardAccent"></div>
          </div>

           <div className="adminUserStatistics-statCard adminUserStatistics-adultaccounts">
            <h3>Total Adult Accounts</h3>
            <p>{stats.adultCount}</p>
            <div className="adminUserStatistics-cardAccent"></div>
          </div>
          
          <div className="adminUserStatistics-statCard adminUserStatistics-uploads">
            <h3>Image Uploads</h3>
            <p>{stats.imageUploads}</p>
            <div className="adminUserStatistics-cardAccent"></div>
          </div>

          <div className="adminUserStatistics-statCard adminUserStatistics-explanations">
            <h3>Explanations Generated</h3>
            <p>{stats.explanationsGenerated}</p>
            <div className="adminUserStatistics-cardAccent"></div>
          </div>

          <div className="adminUserStatistics-statCard adminUserStatistics-quizzes">
            <h3>Quizzes Uploaded</h3>
            <p>{stats.quizzesUploaded}</p>
            <div className="adminUserStatistics-cardAccent"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatistics;