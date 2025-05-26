import React, { useState, useEffect } from 'react';

function Leaderboard({ currentUserId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/users/leaderboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Could not load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-[#4DA6FF]/30 bg-gradient-to-r from-[#123C6D]/90 to-[#1a4b82]/90 p-6 text-white shadow-lg relative z-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="animate-pulse text-[#4DA6FF]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold">Leaderboard</h3>
        </div>
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4DA6FF] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#4DA6FF]/30 bg-gradient-to-r from-[#123C6D]/90 to-[#1a4b82]/90 p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="text-[#4DA6FF]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold">Leaderboard</h3>
        </div>
        <div className="text-center p-4 text-[#4DA6FF]/80">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#4DA6FF]/30 bg-gradient-to-r from-[#123C6D]/90 to-[#1a4b82]/90 p-6 text-white shadow-lg backdrop-blur-md">
      <div className="flex items-center space-x-3 mb-4">
        <div className="animate-pulse text-[#4DA6FF]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold">Top Moderators</h3>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#4DA6FF]/20 backdrop-blur-sm">
        <table className="min-w-full divide-y divide-[#4DA6FF]/20">
          <thead className="bg-[#123C6D]/80">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4DA6FF]">Rank</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4DA6FF]">User</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#4DA6FF]">Score</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#4DA6FF]">Games</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4DA6FF]/20">
            {leaderboard.length > 0 ? (
              leaderboard.map((user, index) => {
                const isCurrentUser = currentUserId && user.id === currentUserId;
                return (
                  <tr 
                    key={user.id} 
                    className={`${index % 2 === 0 ? "bg-[#0a1f38]/30" : "bg-[#123C6D]/50"} 
                      ${isCurrentUser ? "border-l-4 border-[#4DA6FF] bg-[#4DA6FF]/10" : ""}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <div className="flex items-center">
                        {index === 0 && (
                          <span className="mr-2 text-yellow-400">🥇</span>
                        )}
                        {index === 1 && (
                          <span className="mr-2 text-gray-300">🥈</span>
                        )}
                        {index === 2 && (
                          <span className="mr-2 text-amber-600">🥉</span>
                        )}
                        {index > 2 && (
                          <span className="mr-2 w-4 text-center">{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full bg-[#4DA6FF]/20 flex items-center justify-center mr-2">
                          <span className="text-xs">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="text-white">
                          {user.username}
                          {isCurrentUser && <span className="ml-2 text-[#4DA6FF] text-xs font-medium">(You)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-right font-bold text-[#4DA6FF]">
                      {user.score}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-right text-white/70">
                      {user.gamesPlayed}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="py-4 text-center text-white/70">
                  No scores recorded yet. Be the first to play!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaderboard;