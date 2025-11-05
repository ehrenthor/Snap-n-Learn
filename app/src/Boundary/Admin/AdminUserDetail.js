import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminUserDetail.css';

const apiUrl = process.env.REACT_APP_API_URL;

const AdminUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/userDetails/${userId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
        setErrorMessage(`Failed to load user: ${error.message}`);
      }
    };

    fetchUser();
  }, [userId]);

  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleToggleSuspend = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/users/users/${userId}/suspend`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          suspend: !user.user.isDeleted,
          userType: user.userType.isDeleted ? capitalizeFirst(user.userType.userType) : capitalizeFirst(user.userType)
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      navigate("/viewUsers");

    } catch (error) {
      console.error("Failed to toggle suspension:", error);
      if (error.message !== 'Expected error message for known issues') {
        setErrorMessage("Failed to update user status.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p className="adminUserDetail-error">{error}</p>;
  if (!user || !user.user) return <p className="adminUserDetail-loading">Loading user details...</p>;

  return (
    <div className="adminUserDetail-container">
      <div className="adminUserDetail-content">
        <button
          className="adminUserDetail-backButton"
          onClick={() => navigate("/viewUsers")}
        >
          ← Dashboard
        </button>

        <h2 className="adminUserDetail-title">User Profile</h2>

        <div className="adminUserDetail-infoGrid">
          <div className="adminUserDetail-infoCard">
            <h3>User Information</h3>
            <p><strong>Username:</strong> {user.user.username}</p>
            <p><strong>User Type:</strong> {user.userType.isDeleted ? capitalizeFirst(user.userType.userType) : capitalizeFirst(user.userType)}</p>
            <p><strong>Account Created:</strong> {new Date(user.user.createdAt).toLocaleString()}</p>
            <p><strong>Account Suspended:</strong> {user.user.isDeleted ? "Yes" : "No"}</p>
            <p><strong>Password:</strong> ••••••••</p>

            <button
              className={`adminUserDetail-suspendButton ${user.user.isDeleted ? 'unsuspend' : 'suspend'}`}
              onClick={handleToggleSuspend}
              disabled={loading}
            >
              {loading ? 'Processing...' : (user.user.isDeleted ? 'Unsuspend' : 'Suspend')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;