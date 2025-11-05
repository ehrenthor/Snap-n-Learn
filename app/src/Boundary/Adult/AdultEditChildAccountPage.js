import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../Component/AdultSidebar';
import Header from '../../Component/AdultHeader';
import './AdultEditChildAccountPage.css';
import Swal from 'sweetalert2';

const apiUrl = process.env.REACT_APP_API_URL;

const AdultEditChildAccountPage = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { username } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    is_locked: false,
    can_upload_image: true,
    complexity_level: 1
  });
  const [success, setSuccess] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchChildData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/users/children/${username}`);
        const result = await response.json();
        
        if (response.ok) {
          setFormData({
            is_locked: Boolean(result.isLocked),
            can_upload_image: Boolean(result.canUploadImage),
           // daily_session_limit: result.dailySessionLimit != null ? result.dailySessionLimit : 0,
            complexity_level: result.complexityLevel != null ? result.complexityLevel : 1
          });
        } else {
          setError(result.error || 'Error fetching child account details');
        }
      } catch (error) {
        setError('Error fetching child account details');
      } finally {
        setLoading(false);
      }
    };

    username && fetchChildData();
  }, [username]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value, 10)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/users/children/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate(`/adultJoinChildSession`), 2000);
      } else {
        setError((await response.json()).error || 'Error updating child account');
      }
    } catch (error) {
      setError('Error updating child account');
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the child account!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });
  
    if (result.isConfirmed) {
      try {
        const response = await fetch(`${apiUrl}/users/deleteChild`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({username})
        });
        
        if (response.ok) {
          await Swal.fire(
            'Deleted!',
            'Child account has been deleted.',
            'success'
          );
          navigate('/adultHomepage');
        } else {
          throw new Error('Failed to delete account');
        }
      } catch (error) {
        Swal.fire(
          'Error!',
          error.message || 'Could not delete account',
          'error'
        );
      }
    }
  };

  if (loading) return <div className="editChildAccount-loading">Loading...</div>;

  return (
    <div className="editChildAccount-page">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        toggleSidebarButton={toggleSidebar}
      />
      <div className={`editChildAccount-main ${isSidebarOpen ? 'editChildAccount-shifted' : ''}`}>
        <Header />
        <div className="editChildAccount-container">
          <h2 className="editChildAccount-title">Edit {username}'s Account</h2>
          
          {error && <div className="editChildAccount-error">{error}</div>}
          {success && <div className="editChildAccount-success">Settings updated successfully!</div>}
          
          <form onSubmit={handleSubmit} className="editChildAccount-form">
            <div className="editChildAccount-formGroup">
              <label className="editChildAccount-label">
                <input
                  type="checkbox"
                  name="is_locked"
                  checked={formData.is_locked}
                  onChange={handleInputChange}
                  className="editChildAccount-checkbox"
                />
                Lock Account
              </label>
            </div>
            
            <div className="editChildAccount-formGroup">
              <label className="editChildAccount-label">
                <input
                  type="checkbox"
                  name="can_upload_image"
                  checked={formData.can_upload_image}
                  onChange={handleInputChange}
                  className="editChildAccount-checkbox"
                />
                Allow Image Uploads
              </label>
            </div>
            
            <div className="editChildAccount-formGroup">
              <label className="editChildAccount-label">
                Complexity Level:
                <select
                  name="complexity_level"
                  value={formData.complexity_level}
                  onChange={handleInputChange}
                  className="editChildAccount-select"
                >
                  {[1, 2, 3].map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
              </label>
            </div>
              <h3>
                Level 1 - Simple sentence of the objects (Box labels - object name)
              </h3>
              <h3>  
                Level 2 - Simple description of the objects (Box labels - object & adjectives)
              </h3>
              <h3>  
                Level 3 - Description with adjectives of the objects (Box labels - short sentences)
              </h3>
            <div className="editChildAccount-actions">
              <button type="submit" className="editChildAccount-save">Save Changes</button>
              <button 
                type="button" 
                className="editChildAccount-delete"
                onClick={handleDelete}
              >
                Delete Account
              </button>
              <button 
                type="button" 
                className="editChildAccount-cancel"
                onClick={() => navigate('/adultJoinChildSession')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdultEditChildAccountPage;