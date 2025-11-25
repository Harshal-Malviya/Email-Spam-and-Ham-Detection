import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import "./SearchBarHover.css";

export default function SearchBarHover({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(query);
    }
  };

  return (
    <div className="search-hover-container">
      <FaSearch className="search-hover-icon" />
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyPress}
      />
    </div>
  );
}
