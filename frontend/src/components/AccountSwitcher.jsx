// AccountSwitcher.jsx
import React, { useState, useRef, useEffect } from "react";
import "./AccountSwitcher.css";
import { ChevronDown, Check } from "lucide-react";

const accounts = [
  {
    name: "Krish Kumar",
    email: "krishkumar20192bsf@gmail.com",
    image: "https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png",
  },
  {
    name: "Alt Account",
    email: "krish.alt@gmail.com",
    image: "https://www.gstatic.com/images/branding/product/1x/avatar_circle_red_512dp.png",
  },
];

const AccountSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(accounts[0]);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="account-wrapper" ref={ref}>
      <div className={`account-box ${open ? "active" : ""}`} onClick={() => setOpen(!open)}>
        <img src={selected.image} alt="profile" className="google-icon" />
        <div className="email-text">{selected.email}</div>
        <ChevronDown size={18} className={`arrow-icon ${open ? "rotate" : ""}`} />
      </div>

      {open && (
        <div className="account-dropdown">
          {accounts.map((acc, index) => (
            <div
              key={index}
              className={`account-option ${acc.email === selected.email ? "selected" : ""}`}
              onClick={() => {
                setSelected(acc);
                setOpen(false);
              }}
            >
              <img src={acc.image} alt="avatar" className="google-icon" />
              <div>
                <div className="acc-name">{acc.name}</div>
                <div className="acc-email">{acc.email}</div>
              </div>
              {acc.email === selected.email && <Check size={16} className="check-icon" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountSwitcher;
