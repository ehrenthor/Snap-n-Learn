import React, { useState, useEffect } from 'react';
import './ChildProfilePage.css';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../Component/ChildSidebar';
import Header from '../../Component/ChildHeader';
import Swal from "sweetalert2";
import Cookies from 'js-cookie';
const apiUrl = process.env.REACT_APP_API_URL;
const ChildProfilePage = () => {
  const [userData, setUserData] = useState({
    profilePic: '',
    username: Cookies.get("username") || '',
    newUsername: '',
    firstName: '',
    lastName: '',
    dob: '',
  });

  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

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
          // profilePic: data.username,
        }));
      } else {
        Swal.fire("Error", data.error, "error");
        navigate('/childHomepage');
      }
    } catch (error) {
      console.error("Profile fetch failed:", error);
      Swal.fire("Oops...", "Failed to get profile. Try again!", "error");
      navigate('/childHomepage');
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  const [isUpdated, setIsUpdated] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setUserData((prevData) => {
      const userData = { ...prevData, [name]: value };
      setIsUpdated(true);
      return userData;
    })};

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setIsUpdated(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // if ((!userData.oldPassword && userData.newPassword) || (userData.oldPassword && !userData.newPassword)) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Update Fail",
    //     text: `Please fill in these fields to change your password (Old Password, New Password, Confirmed passwors)!`,
    //     confirmButtonText: "OK",
    //   })
    // }

    try {
      const response = await fetch(`${apiUrl}/users/updateChildProfile`, {
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

  const isFormValid = userData.username && userData.newUsername && userData.firstName && userData.lastName && userData.dob;

  return (
    <div className="childProfilepage-profile-container">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        toggleSidebarButton={toggleSidebar}
      />
      <div className={`childProfilepage-profile-content ${isSidebarOpen ? 'childProfilepage-shifted' : 'childProfilepage-full'}`}>
        <div className="childProfilepage-profile-info">
          <div className="childProfilepage-profile-picture">
            <img 
              src={selectedImage || userData?.profilePic || 'default-avatar.png'} 
              alt="Profile" 
            />
            <label className="edit-icon">
              <input
                type="file"
                accept="image/*"
                name="profilePic"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              ✏️
            </label>
          </div>
          <div className="childProfilepage-form-group">
            <label>Username:</label>
            <input
              type="text"
              name="newUsername"
              value={userData.newUsername}
              onChange={handleInputChange}
            />
          </div>
          <div className="childProfilepage-form-group">
            <label>First Name:</label>
            <input
              type="text"
              name="firstName"
              value={userData.firstName}
              onChange={handleInputChange}
            />
          </div>
          <div className="childProfilepage-form-group">
            <label>Last Name:</label>
            <input
              type="text"
              name="lastName"
              value={userData.lastName}
              onChange={handleInputChange}
            />
          </div>
          <div className="childProfilepage-form-group">
            <label>Date of Birth:</label>
            <input
              type="date"
              name="dob"
              value={userData.dob}
              onChange={handleInputChange}
            />
          </div>
          <div style={{display: "flex", gap: "10px"}}>
            <button 
              onClick={() => navigate(-1)} 
              className="childProfilepage-back-btn"
            >
              ← Back
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={!isUpdated || !isFormValid}
              className={`childProfilepage-update-btn ${
                isUpdated ? 'active' : 'disabled'
              }`}>
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  )};

export default ChildProfilePage;