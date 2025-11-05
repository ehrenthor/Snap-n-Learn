import React, { useEffect, useState } from 'react';
import './AdminViewUsers.css';
import { useNavigate } from 'react-router-dom';
import Cookies from "js-cookie";

const apiUrl = process.env.REACT_APP_API_URL;

const ViewUsers = () => {
  const [username] = useState(Cookies.get("username"));
  const [users, setUsers] = useState([]);
  const [error, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/users`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const data = await response.json();
        setUsers(data)
      } catch (error) {
        console.error("Error fetching users:", error);
        setErrorMessage(`Failed to load users: ${error.message}`);
      }
    };

    fetchUsers();
  }, []);

  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (!users) return <p>Loading users list...</p>;

  return (
    <div className="adminViewUsers-container">
      <div className="adminViewUsers-header">
        <button 
          className="adminViewUsers-backButton"
          onClick={() => navigate('/adminHomepage')}
        >
          ← Dashboard
        </button>
        <h2 className="adminViewUsers-title">User Directory</h2>
        {error && <p className="adminViewUsers-error">{error}</p>}
      </div>

      <ul className="adminViewUsers-list">
        {users.filter(user => {return user.username !== username}).map(user => (
          <li
          // key={user._id}
          key={user.userid}
          onClick={() => navigate(`/admin/view-user/${user.userid}`)}
          className={`adminViewUsers-listItem ${
            user.isDeleted ? 'adminViewUsers-listItem-deleted' : ''
          }`}
        >
          <span className="adminViewUsers-username">{user.username}</span>
          <div className="adminViewUsers-status">
            {user.isDeleted ? <span className="adminViewUsers-deletedTag">Deleted</span> : ""}
            <span className="adminViewUsers-userType">{capitalizeFirst(user.userType)}</span>
          </div>
        </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewUsers;