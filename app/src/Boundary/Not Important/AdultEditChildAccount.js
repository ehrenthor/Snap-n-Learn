import React, { useState, useEffect } from 'react';
import './AdultEditChildAccount.css';
import { useParams, useNavigate } from 'react-router-dom';
const apiUrl = process.env.REACT_APP_API_URL;

const AdultEditChildAccount = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    is_locked: false,
    can_upload_image: false,
    daily_session_limit: 0,
    complexity_level: 1
  });
  const [success, setSuccess] = useState(false);

  // Fetch child data when component mounts
  useEffect(() => {
    const fetchChildData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/users/children/${username}`);
        const result = await response.json();
        
        if (response.ok) {
          if (result) {
            const data = result;
            
            // Initialize form data with current values
            setFormData({
              is_locked: data.isLocked === 1 || data.isLocked === true,
              can_upload_image: data.canUploadImage === 1 || data.canUploadImage === true,
              daily_session_limit: data.dailySessionLimit || 0,
              complexity_level: data.complexityLevel || 1
            });
          } else {
            setError('Child account not found');
          }
        } else {
          setError(result.error || 'Error fetching child account details');
        }
      } catch (error) {
        setError('Error fetching child account details');
        console.error('Error fetching child data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchChildData();
    }
  }, [username]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value, 10) : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${apiUrl}/users/children/${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        // Show success message briefly before navigating
        setTimeout(() => {
          navigate(`/childaccount/${username}`);
        }, 2000);
      } else {
        setError(result.error || 'Error updating child account');
      }
    } catch (error) {
      setError('Error updating child account');
      console.error('Error updating child data:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/childaccount/${username}`);
  };

  if (loading) {
    return <div>Loading child account details...</div>;
  }

  return (
    <div className="edit-child-container">
      <h2>Edit Child Account: {username}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Child account updated successfully!</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="is_locked"
              checked={formData.is_locked}
              onChange={handleInputChange}
            />
            Account Locked
          </label>
        </div>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="can_upload_image"
              checked={formData.can_upload_image}
              onChange={handleInputChange}
            />
            Can Upload Images
          </label>
        </div>
        
        <div className="form-group">
          <label>
            Daily Session Limit (minutes):
            <input
              type="number"
              name="daily_session_limit"
              value={formData.daily_session_limit}
              onChange={handleInputChange}
              min="0"
              max="1440"
            />
          </label>
        </div>
        
        <div className="form-group">
          <label>
            Complexity Level:
            <select
              name="complexity_level"
              value={formData.complexityLevel}
              onChange={handleInputChange}
            >
              <option value={1}>Level 1 </option>
              <option value={2}>Level 2 </option>
              <option value={3}>Level 3 </option>
              <option value={4}>Level 4 </option>
            </select>
          </label>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="save-button">Save Changes</button>
          <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AdultEditChildAccount;
