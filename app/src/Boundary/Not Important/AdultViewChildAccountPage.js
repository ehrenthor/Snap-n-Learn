import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Sidebar from '../../Component/AdultSidebar';
import Header from '../../Component/AdultHeader';
import './AdultViewChildAccountPage.css';
import Cookies from 'js-cookie';
const apiUrl = process.env.REACT_APP_API_URL;
const AdultViewChildAccountPage = ({ childData, error, isSidebarOpen, toggleSidebar, username }) => {
    const navigate = useNavigate();

    const handleRequestReset = async () => {
        try {
            const response = await fetch(`${apiUrl}/token/request-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            const data = await response.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Reset Link Sent!',
                    text: 'The password reset link has been sent to the registered email.',
                    confirmButtonColor: '#3085d6',
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Reset Failed',
                    text: data.message || 'Could not process the reset request.',
                    confirmButtonColor: '#d33',
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Network Error',
                text: 'Failed to connect to the server. Please try again later.',
                confirmButtonColor: '#d33',
            });
        }
    };

    const handleJoinChildSession = async () => {
        Cookies.set("Child Username", childData.username);
        navigate(`/adultJoinChildSession`);
    };

    return (
        <div className="childAccount-page">
            <Sidebar 
                isSidebarOpen={isSidebarOpen} 
                toggleSidebar={toggleSidebar} 
                toggleSidebarButton={toggleSidebar}
            />
            <div className={`childAccount-main-content ${isSidebarOpen ? 'childAccount-shifted' : 'childAccount-full'}`}>
                <Header />
                <h2>Child Account Details</h2>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                {childData ? (
                    <div>
                        <p><strong>Username:</strong> {childData.username}</p>
                        <p><strong>Account Locked:</strong> {childData.isLocked ? 'Yes' : 'No'}</p>
                        <p><strong>Can Upload Images:</strong> {childData.canUploadImage ? 'Yes' : 'No'}</p>
                        <p><strong>Daily Session Limit:</strong> {childData.dailySessionLimit} minutes</p>
                        <p><strong>Complexity Level:</strong> {childData.complexityLevel}</p>
                        <p><strong>Last Seen:</strong> {new Date(childData.lastSeen).toLocaleString()}</p>
                    </div>
                ) : (
                    <p>Loading child account details...</p>
                )}

                <div style={{display: "flex", gap: "10px"}}>
                    <button 
                        onClick={() => navigate('/adultManageChildAccount')} 
                        className="childAccount-back-btn"
                        >
                        ← Back
                    </button>
                    <button onClick={() => navigate(`/editChild/${username}`)} className="childAccount-edit-child-button">
                        Edit Child Account
                    </button>
                    <button onClick={handleRequestReset} className="childAccount-reset-password-button">
                        Request Password Reset
                    </button>
                    <button onClick={handleJoinChildSession} className="childAccount-join-child-session-button">
                        Join Child Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdultViewChildAccountPage;
