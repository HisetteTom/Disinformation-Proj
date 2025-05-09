import { useState } from 'react';
import { register, login } from '../services/authService';

export default function AuthModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const userCredential = await login(email, password);
        setSuccess(`Logged in successfully as ${userCredential.email}`);
      } else {
        if (!username) {
          throw new Error('Username is required');
        }
        
        await register(email, password, username);
        setSuccess(`Account created successfully for ${email}! You are now logged in.`);

        // Short delay before closing to show the success message
        setTimeout(() => onClose(), 3000);
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{isLogin ? 'Login' : 'Sign Up'}</h2>
          <button onClick={onClose} className="rounded-full bg-gray-200 p-2 hover:bg-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-green-600">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label htmlFor="username" className="block font-medium text-gray-700">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
            className="text-blue-600 hover:underline"
            disabled={isLoading}
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}