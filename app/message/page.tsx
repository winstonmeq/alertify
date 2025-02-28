"use client"; // Remove this line if using Pages Router
import { useState, ChangeEvent } from "react";

export default function MessengerPage() {
  const [message, setMessage] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>("");

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleRecipientChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRecipientId(e.target.value);
  };

  const handleSendMessage = async () => {
    if (message.trim() === "" || recipientId.trim() === "") {
      alert("Please enter a message and recipient ID!");
      return;
    }

    try {
      const response = await fetch("/api/send-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, recipientId }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Message sent successfully!");
        setMessage("");
      } else {
        alert(`Failed to send message: ${data.error}`);
      }
    } catch (error) {
      alert("An error occurred while sending the message.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>
        Send a Message to Messenger
      </h1>
      <input
        type="text"
        value={recipientId}
        onChange={handleRecipientChange}
        placeholder="Enter recipient PSID..."
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
      <input
        type="text"
        value={message}
        onChange={handleInputChange}
        placeholder="Type your message..."
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
      <button
        onClick={handleSendMessage}
        style={{
          padding: "10px 20px",
          width: "100%",
          backgroundColor: "#0078FF",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Send to Messenger
      </button>
    </div>
  );
}
