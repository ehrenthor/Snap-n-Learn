import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ChildUploadHistoryPage.css";

const apiUrl = process.env.REACT_APP_API_URL;

const ChildUploadHistoryPage = () => {
  const navigate = useNavigate();
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState([]);

  useEffect(() => {
    const fetchChatList = async () => {
      try {
        const response = await fetch(`${apiUrl}/chat/chats`, {
          method: "GET",
          credentials: "include",
        });
  
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
  
        const data = await response.json();
  
        const activeChats = Array.isArray(data.chats)
          ? data.chats.filter((chat) => chat.status !== "deleted")
          : [];
  
        setChatList(activeChats);
      } catch (error) {
        console.error("Error fetching chat list:", error);
        setErrorMessage(`Failed to load chat history: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    fetchChatList();
  }, []);
  

  const handleBack = () => navigate(-1);

  const toggleBookmark = async (chatId, isCurrentlyBookmarked) => {
    try {
      const newBookmarkState = isCurrentlyBookmarked ? 0 : 1;
      const response = await fetch(`${apiUrl}/chat/bookmark/${chatId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBookmarked: newBookmarkState }),
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      setChatList((prevList) =>
        prevList.map((chat) =>
          chat.chatId === chatId ? { ...chat, isBookmarked: newBookmarkState } : chat
        )
      );
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const deleteChats = async (chatIds) => {
    try {
      for (const chatId of chatIds) {
        const response = await fetch(`${apiUrl}/chat/${chatId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete chatId ${chatId}`);
        }
      }

      setChatList((prevList) => prevList.filter((chat) => !chatIds.includes(chat.chatId)));
    } catch (error) {
      console.error("Error deleting chats:", error);
      alert("Something went wrong while deleting chats.");
    }
  };

  const toggleDeleteMode = async () => {
    if (deleteMode && selectedForDelete.length > 0) {
      const confirmed = window.confirm("Are you sure you want to delete the selected items?");
      if (confirmed) {
        await deleteChats(selectedForDelete);
        setSelectedForDelete([]);
      }
    }
    setDeleteMode((prev) => !prev);
  };

  const cancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedForDelete([]);
  };

  const handleSelectItem = (chatId) => {
    if (!deleteMode) {
      navigate(`/childUploadHistory/${chatId}`);
    } else {
      setSelectedForDelete((prev) =>
        prev.includes(chatId)
          ? prev.filter((id) => id !== chatId)
          : [...prev, chatId]
      );
    }
  };

  return (
    <div className="childUploadHistory-container">
      <button onClick={handleBack} className="childUploadHistory-back-button">
        ⬅️ Back to Fun Zone
      </button>
      <div className="childUploadHistory-content">
        <h1 className="childUploadHistory-title">📜 Your Upload History</h1>

        {loading && <p className="childUploadHistory-loading">Loading...</p>}
        {errorMessage && <div className="childUploadHistory-error">{errorMessage}</div>}

        <ul className="childUploadHistory-list">
          {chatList.length > 0 ? (
            chatList.map(({ chatId, uploadedAt, imageUrl, isBookmarked }) => (
              <li
                key={chatId}
                className={`childUploadHistory-item ${
                  selectedForDelete.includes(chatId) ? "selected-for-delete" : ""
                }`}
                onClick={() => handleSelectItem(chatId)}
              >
                <div className="childUploadHistory-image-container">
                  <img
                    src={imageUrl || "/placeholder.jpg"}
                    alt="Uploaded Image"
                    className="childUploadHistory-image"
                  />
                  <span
                    className="childUploadHistory-heart"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(chatId, isBookmarked);
                    }}
                  >
                    {isBookmarked ? "❤️" : "🤍"}
                  </span>
                </div>
                <p>Uploaded At: {new Date(uploadedAt).toLocaleString()}</p>
              </li>
            ))
          ) : (
            !loading && <p className="childUploadHistory-no-history">Your creative gallery is empty – time to fill it! 🌈✨</p>
          )}
        </ul>

        {/* Delete Bin */}
        <div className="childUploadHistory-bin-container">
          {deleteMode && (
            <span className="childUploadHistory-cancel" onClick={cancelDeleteMode}>
              ❌
            </span>
          )}
          <span className="childUploadHistory-bin" onClick={toggleDeleteMode}>
            🗑️
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChildUploadHistoryPage;
