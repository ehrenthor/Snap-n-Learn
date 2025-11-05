import React, { useState, useEffect } from 'react';
import './AdultProfilePage.css';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import Cookies from 'js-cookie';
const apiUrl = process.env.REACT_APP_API_URL;

const AdultProfilePage = () => {
  const [userData, setUserData] = useState({
    username: Cookies.get("username") || '',
    newUsername: '',
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);

  const getProfile = async () => {
    try {
      const username = userData.username;
      const response = await fetch(`${apiUrl}/users/getProfile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (response.ok) {
        setUserData((prevData) => ({
          ...prevData,
          newUsername: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          dob: data.dob ? new Date(data.dob).toLocaleDateString("en-CA") : "",
          email: data.email,
          // profilePic: data.username,
        }));
      } else {
        Swal.fire("Error", data.error, "error");
        navigate('/adultHomepage');
      }
    } catch (error) {
      console.error("Profile fetch failed:", error);
      Swal.fire("Oops...", "Failed to get profile. Try again!", "error");
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setUserData((prevData) => {
      const userData = { ...prevData, [name]: value };
      setIsUpdated(true);
      if (name === "newPassword" || name === "confirmPassword") {
        setPasswordMatch(userData.newPassword === userData.confirmPassword);
      }
      return userData;
    })};

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${apiUrl}/users/updateAdultProfile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...userData }),
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Update Successful",
          text: `Your profile has been updated!`,
          confirmButtonText: "OK",
        })
        Cookies.set("username", userData.newUsername)
        setUserData((prevData) => ({
          ...prevData,
          username: Cookies.get("username"),
        }));
      } else {
        Swal.fire("Error", data.error, "error");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      Swal.fire("Oops...", "Failed to upload updates. Try again!", "error");
      setIsUpdated(false);
    }};

  const isFormValid = userData.username && userData.newUsername && userData.firstName && userData.lastName && userData.dob && userData.email && passwordMatch;

  return (
    <div className="adultProfilepage-container">
      <div className="adultProfilepage-content">
        <button 
          onClick={() => navigate(-1)}
          className="adultProfilepage-back-button"
        >
          &larr; Back to Dashboard
        </button>

        <div className="adultProfilepage-card">
          <h2 className="adultProfilepage-title">Profile Settings</h2>
          
          <div className="adultProfilepage-form">
            <div className="adultProfilepage-form-group">
              <label>Username</label>
              <input
                type="text"
                name="newUsername"
                value={userData.newUsername}
                onChange={handleInputChange}
                className="adultProfilepage-input"
              />
            </div>

            <div className="adultProfilepage-form-row">
              <div className="adultProfilepage-form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={userData.firstName}
                  onChange={handleInputChange}
                  className="adultProfilepage-input"
                />
              </div>
              
              <div className="adultProfilepage-form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={userData.lastName}
                  onChange={handleInputChange}
                  className="adultProfilepage-input"
                />
              </div>
            </div>

            <div className="adultProfilepage-form-row">
              <div className="adultProfilepage-form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={userData.dob}
                  onChange={handleInputChange}
                  className="adultProfilepage-input"
                />
              </div>
              
              <div className="adultProfilepage-form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  className="adultProfilepage-input"
                />
              </div>
            </div>

            <div className="adultProfilepage-password-section">
              <h3 className="adultProfilepage-subtitle">Change Password</h3>
              
              <div className="adultProfilepage-form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={userData.oldPassword}
                  onChange={handleInputChange}
                  placeholder="Enter current password"
                  className="adultProfilepage-input"
                />
              </div>
              
              <div className="adultProfilepage-form-row">
                <div className="adultProfilepage-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={userData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className="adultProfilepage-input"
                  />
                </div>
                
                <div className="adultProfilepage-form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={userData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    className="adultProfilepage-input"
                  />
                </div>
              </div>
              
              {!passwordMatch && 
                <p className="adultProfilepage-error">
                  Passwords do not match!
                </p>}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isUpdated || !isFormValid}
              className="adultProfilepage-submit-button"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdultProfilePage;