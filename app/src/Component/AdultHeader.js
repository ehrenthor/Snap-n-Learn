import React from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './AdultHeader.css';  // Create this CSS file

const AdultHeader = () => {
  const navigate = useNavigate();
  const username = Cookies.get("username")

  return (
    <div className="adultHeader">
      <span className="adultHeader-title">
        SnapnLearn
      </span>
      <span className="adultHeader-profile" onClick={() => navigate("/adultProfile")}>
        👤 <span className="adultHeader-profile-username">{username || "Account"}</span>
      </span>
    </div>
  );
};

export default AdultHeader;