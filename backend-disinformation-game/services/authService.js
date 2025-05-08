export const updateUserUpgrades = async (money, upgrades) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch('http://localhost:3001/api/users/upgrades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          money,
          upgrades
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update upgrades');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating upgrades:', error);
      throw error;
    }
  };