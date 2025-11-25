import React from "react";

const ChatInput = () => {
  return (
    <div style={{ display: "flex", padding: "10px" }}>
      <input
        type="text"
        placeholder="Reply"
        style={{ flexGrow: 1, borderRadius: "20px", padding: "10px" }}
      />
      <button style={{ marginLeft: "10px" }}>📤</button>
    </div>
  );
};

export default ChatInput;
