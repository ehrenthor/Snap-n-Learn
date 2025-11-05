import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import './RegisterAdultPage.css';
import personIcon from "../../Assets/person.png";
import passwordIcon from "../../Assets/password.png";
import emailIcon from "../../Assets/email.png";
const apiUrl = process.env.REACT_APP_API_URL;


const RegisterAdultPage = () => {
  // const location = useLocation();  // Get location object
  // const userType = location.state?.userType || "Adult";  // Retrieve userType or default to "Adult"
  const userType = "Adult";
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
      // if (userType!=="Child") {
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
      // }

      const response = await fetch(`${apiUrl}/users/registerAdult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData }),
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: "Registration successful! You can now log in.",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          navigate("/");
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
    navigate(-1);  // This will navigate to the previous page
  };

  // Check if all fields are filled correctly
  // const isFormValid = formData.username && formData.firstName && 
  // formData.lastName && formData.dob && (userType === "Child" || (formData.email && formData.otp)) &&
  // formData.password && formData.confirmPassword && passwordMatch;
  const isFormValid = formData.username && formData.firstName &&
    formData.lastName && formData.dob && formData.email && formData.otp &&
    formData.password && formData.confirmPassword && passwordMatch;

  return (
    <div className="registerAdult-container">
      {/* Back Button */}
      <button 
        className="registerAdult-backButton" 
        onClick={handleReturn}
        aria-label="Go back"
      >
        <span className="registerAdult-backArrow"></span>
      </button>

      <h1 className="registerAdult-title">Registration</h1>
      
      <form onSubmit={handleRegister} className="registerAdult-form">
        {/* Username */}
        <div className="registerAdult-inputContainer">
          <img src={personIcon} className="registerAdult-inputIcon" alt="User"/>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="registerAdult-input"
          />
        </div>

        {/* First Name */}
        <div className="registerAdult-inputContainer">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="registerAdult-input"
          />
        </div>

        {/* Last Name */}
        <div className="registerAdult-inputContainer">
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="registerAdult-input"
          />
        </div>

        {/* Date of Birth */}
        <div className="registerAdult-inputContainer">
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
            className="registerAdult-input"
          />
        </div>

        {/* Email */}
        <div className="registerAdult-inputContainer">
          <img src={emailIcon} className="registerAdult-inputIcon" alt="Email"/>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="registerAdult-input"
          />
        </div>

        {/* Password */}
        <div className="registerAdult-inputContainer">
          <img src={passwordIcon} className="registerAdult-inputIcon" alt="Password"/>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="registerAdult-input"
          />
        </div>

        {/* Confirm Password */}
        <div className="registerAdult-inputContainer">
          <img src={passwordIcon} className="registerAdult-inputIcon" alt="Password"/>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="registerAdult-input"
          />
        </div>

        {!passwordMatch && 
          <p className="registerAdult-errorText">Passwords do not match!</p>}

        {/* OTP Section */}
        <div className="registerAdult-otpSection">
          <div className="registerAdult-inputContainer">
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={formData.otp}
              onChange={handleChange}
              required
              className="registerAdult-input"
            />
          </div>
          <button
            type="button"
            onClick={handleSendOTP}
            disabled={!canSendOtp}
            className="registerAdult-otpButton"
          >
            {canSendOtp ? "Send OTP" : `Resend (${timer}s)`}
          </button>
        </div>

        <button 
          type="submit" 
          className="registerAdult-submitButton" 
          disabled={!isFormValid}
        >
          Register
        </button>
      </form>
    </div>
  );
};
  

export default RegisterAdultPage;