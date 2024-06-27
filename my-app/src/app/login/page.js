import React from "react";

const Login = () => {
  return (
    <div className="h-screen flex justify-center items-center">
      <form className="flex flex-col gap-3 w-60">
        <input
          className="border border-gray-500 rounded-lg p-2 bg-gray-800"
          id="username"
          placeholder="Username"
          name="scramble_username"
        />
        <input
          className="border border-gray-500 rounded-lg p-2 bg-gray-800"
          id="password"
          placeholder="Password"
          name="scramble_password"
        />
        <button
          className="bg-gray-500 rounded-xl p-2 w-1/2 m-auto"
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default Login;
