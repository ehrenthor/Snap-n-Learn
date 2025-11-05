import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2'; // Import SweetAlert2
import './AdultChildResetPasswordPage.css';
const apiUrl = process.env.REACT_APP_API_URL;

const ResetPasswordPage = () => {
  const { token } = useParams(); // Extract token from the URL
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Updated fetch URL to include the token in the route
      const response = await fetch(`${apiUrl}/token/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }), // Send only password in the body
      });

      // Log the response for debugging
      const data = await response.json();

      if (data.success) {
        // Use SweetAlert2 for success message
        Swal.fire({
          title: 'Success!',
          text: 'Password updated successfully!',
          icon: 'success',
          confirmButtonText: 'Okay'
        });
      } else {
        // Use SweetAlert2 for error message
        Swal.fire({
          title: 'Failed!',
          text: `Failed to reset password: ${data.message}`,
          icon: 'error',
          confirmButtonText: 'Try Again'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      // Use SweetAlert2 for error handling
      Swal.fire({
        title: 'Error!',
        text: 'An error occurred while resetting the password.',
        icon: 'error',
        confirmButtonText: 'Okay'
      });
    }
  };

  return (
    <div className="resetPassword-container">
      <form onSubmit={handleSubmit} className="resetPassword-form">
        <h2>Reset Password</h2>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Reset</button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
