import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import './RegisterAdminPage.css'; 
import personIcon from "../../Assets/person.png";
import passwordIcon from "../../Assets/password.png";
import emailIcon from "../../Assets/email.png";
const apiUrl = process.env.REACT_APP_API_URL;

const RegisterAdminPage = () => {
  const userType = "Admin";  
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    dob: "",
    password: "",
    confirmPassword: "", 
    email: "",
    otp: "",
  });

  const [passwordMatch, setPasswordMatch] = useState(true);
  const [canSendOtp, setCanSendOtp] = useState(true);
  const [timer, setTimer] = useState(30);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value };

      // Check if passwords match whenever password or confirmPassword changes
      if (name === "password" || name === "confirmPassword") {
        setPasswordMatch(updatedData.password === updatedData.confirmPassword);
      }

      return updatedData;
    });
  };

  useEffect(() => {
  }, [formData]);

  // Function to handle sending OTP
  const handleSendOTP = async () => {
    if (!formData.username || !formData.firstName || !formData.lastName || !formData.dob || !formData.email || !formData.password || !formData.confirmPassword) {
      Swal.fire("Error", "Please fill in all fields before requesting OTP.", "error");
      return;
    }

    if (!passwordMatch) {
      Swal.fire("Error", "Passwords do not match.", "error");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/otp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.username, userType, email: formData.email }),
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire("OTP Sent", "Check your email for the OTP code.", "success");
        setCanSendOtp(false);
        startOtpTimer();
      } else {
        Swal.fire("Error", data.error, "error");
      }
    } catch (error) {
      console.error("OTP send error:", error);
      Swal.fire("Oops...", "Failed to send OTP. Try again!", "error");
    }
  };

  // Function to start the 30-second timer
  const startOtpTimer = () => {
    let countdown = 30;
    setTimer(countdown);
    const interval = setInterval(() => {
      countdown -= 1;
      setTimer(countdown);
      if (countdown === 0) {
        setCanSendOtp(true);
        clearInterval(interval);
      }
    }, 1000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      // First verify OTP
      const verifyResponse = await fetch(`${apiUrl}/otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) {
        Swal.fire("Error", verifyData.error || "OTP verification failed", "error");
        return;
      }

      const response = await fetch(`${apiUrl}/users/registerAdmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userType }),
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: "Registration successful! You can now log in.",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          navigate("/adminHomepage"); 
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.error,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      Swal.fire({
        title: "Oops...",
        text: "Something went wrong. Try again!",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleReturn = () => {
    navigate("/adminHomepage"); // This will navigate to the previous page
  };

  const isFormValid = formData.username && formData.firstName &&
    formData.lastName && formData.dob && formData.email && formData.otp &&
    formData.password && formData.confirmPassword && passwordMatch;

  return (
    <div className="registerAdmin-container">
      <div className="registerAdmin-form-container">
        <button 
          className="registerAdmin-return-button" 
          onClick={handleReturn}
          aria-label="Go back"
        >
          <span className="registerAdult-backArrow"></span>
        </button>
        <h2 className="registerAdmin-title">Register as an Admin</h2>
        <form onSubmit={handleRegister} className="registerAdmin-form">

          <div className="registerAdmin-input-container">
            <img src={personIcon} className="registerAdmin-input-icon" alt="User Icon"/>
            <input
              type="text"
              name="username"
              placeholder="Enter Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="registerAdmin-input"
            />
          </div>
          <div className="registerAdmin-input-container">
            <input
              type="text"
              name="firstName"
              placeholder="Enter First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="registerAdmin-input"
            />
          </div>
          <div className="registerAdmin-input-container">
            <input
              type="text"
              name="lastName"
              placeholder="Enter Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="registerAdmin-input"
            />
          </div>
          <div className="registerAdmin-input-container">
            <input
              type="date"
              name="dob"
              placeholder="Enter Date of Birth"
              value={formData.dob}
              onChange={handleChange}
              required
              className="registerAdmin-input"
            />
          </div>
          <div className="registerAdmin-input-container">
            <img src={emailIcon} className="registerAdmin-input-icon" alt="Email Icon"/>
            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="registerAdmin-input"
            />
          </div>

          <div className="registerAdmin-input-container">
            <img src={passwordIcon} className="registerAdmin-input-icon" alt="Lock Icon"/>
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="registerAdmin-input"
            />
          </div>
          <div className="registerAdmin-input-container">
            <img src={passwordIcon} className="registerAdmin-input-icon" alt="Lock Icon"/>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="registerAdmin-input"
            />
          </div>
          {!passwordMatch &&
            <p
              style={{
                color: "red",
                marginTop: "-10px"
              }}>
              Passwords do not match!
            </p>}

          <div className="registerAdmin-otp-section">
            <div className="registerAdmin-input-container">
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                value={formData.otp}
                onChange={handleChange}
                required
                className="registerAdmin-input"
              />
            </div>
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={!canSendOtp}
              className="registerAdmin-otp-button">
              {canSendOtp ? "Send OTP" : `Resend OTP (${timer}s)`}
            </button>
          </div>

          <button type="submit" className="registerAdmin-button" disabled={!isFormValid}>
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterAdminPage;