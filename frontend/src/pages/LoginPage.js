import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLogIn } from "react-icons/fi";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post("http://localhost:3001/login", {
        username,
        password,
      });
      const { userId, username: returnedUsername } = response.data;
      sessionStorage.setItem("userId", userId);
      sessionStorage.setItem("username", returnedUsername);
      navigate("/");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-secondary rounded-3xl shadow-lg p-8 w-full max-w-md border border-pink-400">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Login</h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-white mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full p-3 rounded-lg bg-white text-gray-900 focus:outline-none"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-white mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-3 rounded-lg bg-white text-gray-900 focus:outline-none"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-pink-400 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-pink-500 transition"
          >
            <FiLogIn className="w-6 h-6" />
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;