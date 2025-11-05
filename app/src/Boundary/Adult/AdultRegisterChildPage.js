import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from '../../Component/AdultHeader';
import Swal from "sweetalert2";
import Cookies from 'js-cookie';
import "./AdultRegisterChildPage.css";
const apiUrl = process.env.REACT_APP_API_URL;

const AdultRegisterChildPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    dob: "",
    password: "defaultpassword",
    confirmPassword: "defaultpassword",
  });
  const adultUsername = Cookies.get("username");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/users/registerChild`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, adultUsername }),
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: "Child registration successful!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => navigate("/adultHomepage"));
      } else {
        Swal.fire({ title: "Error", text: data.error, icon: "error" });
      }
    } catch (error) {
      Swal.fire({ title: "Oops...", text: "Something went wrong!", icon: "error" });
    }
  };

  const isFormValid = formData.username && formData.firstName &&
    formData.lastName && formData.dob && formData.password;

  return (
    <div className="adultRegisterChild-container">
      <Header />
      
      <div className="adultRegisterChild-content">
        <button 
          onClick={() => navigate('/adultHomepage')}
          className="adultRegisterChild-back-button"
        >
          &larr; Back to Dashboard
        </button>

        <div className="adultRegisterChild-card">
          <h2 className="adultRegisterChild-title">Register New Child</h2>
          
          <form onSubmit={handleRegister} className="adultRegisterChild-form">
            <div className="adultRegisterChild-form-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                className="adultRegisterChild-input"
              />
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="adultRegisterChild-input"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="adultRegisterChild-input"
              />
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className="adultRegisterChild-input"
              />
            </div>

            <button 
              type="submit" 
              className="adultRegisterChild-submit-button"
              disabled={!isFormValid}
            >
              Register Child
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdultRegisterChildPage;