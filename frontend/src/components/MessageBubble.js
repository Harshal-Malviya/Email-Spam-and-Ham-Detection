// MessageBubble.js
import React from "react";
import { motion } from "framer-motion";

export default function MessageBubble({ message, isSender }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isSender ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`message-bubble ${isSender ? "sender" : "receiver"}`}
    >
      {message}
    </motion.div>
  );
}
