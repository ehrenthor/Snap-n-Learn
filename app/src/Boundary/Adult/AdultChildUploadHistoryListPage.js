import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdultChildUploadHistoryListPage.css";

const apiUrl = process.env.REACT_APP_API_URL;

const AdultChildUploadHistoryListPage = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUserAndChats = async () => {
      try {
        // Step 1: Fetch child details by username
        const userResponse = await fetch(`${apiUrl}/users/children/${username}`, {
          method: "GET",
          credentials: "include",
        });

        // Check if the response is okay
        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user details, Status: ${userResponse.status}`);
        }

        const userData = await userResponse.json();

        // Check if the user data contains the expected fields
        if (!userData || !userData.userid) {
          throw new Error("User ID not found in the response");
        }

        const { userid } = userData;

        // Step 2: Fetch chat list using retrieved userId for the child account
        const chatResponse = await fetch(`${apiUrl}/chat/userchats/${userid}`, {
          method: "GET",
          credentials: "include",
          headers: { "x-user-id": userid }, // Explicitly pass the child userId here
        });

        if (!chatResponse.ok) {
          throw new Error(`Failed to fetch chats, Status: ${chatResponse.status}`);
        }

        const chatData = await chatResponse.json();
        
        //set filter based on db deleted chat by child
        const activeChats = Array.isArray(chatData.chats)
          ? chatData.chats.filter((chat) => chat.status !== "deleted")
          : [];

        // Set the chat list if the response contains valid chat data
        setChatList(activeChats);
      } catch (error) {
        console.error("Error:", error);
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Call the fetch function only if the username is available
    if (username) {
      fetchUserAndChats();
    } else {
      setErrorMessage("Invalid child account.");
      setLoading(false);
    }
  }, [username]);

  const handleBack = () => navigate('/adultJoinChildSession');

  // Commented out the toggleBookmark function as requested
  // const toggleBookmark = async (chatId, isCurrentlyBookmarked) => {
  //   try {
  //     const newBookmarkState = isCurrentlyBookmarked ? 0 : 1;
  //     const response = await fetch(`${apiUrl}/chat/bookmark/${chatId}`, {
  //       method: "POST",
  //       credentials: "include",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ isBookmarked: newBookmarkState }),
  //     });

  //     if (!response.ok) throw new Error(`Failed to update bookmark`);

  //     // Update the chat list with the new bookmark state
  //     setChatList((prevList) =>
  //       prevList.map((chat) =>
  //         chat.chatId === chatId ? { ...chat, isBookmarked: newBookmarkState } : chat
  //       )
  //     );
  //   } catch (error) {
  //     console.error("Error toggling bookmark:", error);
  //   }
  // };

  return (
    <div className="adultChildUploadHistoryList-container">
      <button onClick={handleBack} className="adultChildUploadHistoryList-back-button">
        ← Back
      </button>
      <div className="adultChildUploadHistoryList-content">
        <h1 className="adultChildUploadHistoryList-title">📜 {username}'s Upload History</h1>

        {loading && <p className="adultChildUploadHistoryList-loading">Loading...</p>}
        {errorMessage && <div className="adultChildUploadHistoryList-error">{errorMessage}</div>}

        <ul className="adultChildUploadHistoryList-list">
          {chatList.length > 0 ? (
            chatList.map(({ chatId, uploadedAt, imageUrl, isBookmarked }) => (
              <li
                key={chatId}
                className="adultChildUploadHistoryList-item"
                onClick={() => navigate(`/adultChildUploadHistory/${username}/${chatId}`)} // Update navigation here
              >
                <div className="adultChildUploadHistoryList-image-container">
                  <img
                    src={imageUrl || "/placeholder.jpg"}
                    alt="Uploaded Image"
                    className="adultChildUploadHistoryList-image"
                  />
                  {/* Commented out the heart icon */}
                  {/* <span
                    className="adultChildUploadHistoryList-heart"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(chatId, isBookmarked);
                    }}
                  >
                    {isBookmarked ? "❤️" : "🤍"}
                  </span> */}
                </div>
                <p>Uploaded At: {new Date(uploadedAt).toLocaleString()}</p>
              </li>
            ))
          ) : (
            !loading && <p className="adultChildUploadHistoryList-no-history">No upload history found.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default AdultChildUploadHistoryListPage;
