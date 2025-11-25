import React from 'react';

const LoginWithGoogle = () => {
  const handleLogin = () => {
    window.location.href = "http://localhost:5000/api/login";
  };

  return (
   <div className="login-container">
  <button className="gmail-login-btn" onClick={handleLogin}>
    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
    Login with Google
  </button>
</div>

  );
};

export default LoginWithGoogle;
