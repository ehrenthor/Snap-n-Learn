import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AdultViewChildAccountPage from './AdultViewChildAccountPage';
const apiUrl = process.env.REACT_APP_API_URL;

const ChildAccount = () => {
  const { username } = useParams();  // Get username from the URL
  const [childData, setChildData] = useState(null);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // UseEffect hook to fetch child data when username changes
  useEffect(() => {
    const fetchChildData = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/children/${username}`,{
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        const result = await response.json();

        if (response.ok) {
          if (result) {
            setChildData(result);
          } else {
            setError('Child account not found');
          }
        } else {
          setError(result.error || 'Error fetching child account details');
        }
      } catch (error) {
        setError('Error fetching child account details');
        console.error('Error fetching child data:', error);
      }
    };

    fetchChildData();
  }, [username]);

  return (
    <AdultViewChildAccountPage
      childData={childData}
      error={error}
      isSidebarOpen={isSidebarOpen}
      toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
      username={username}
    />
  );
};

export default ChildAccount;
