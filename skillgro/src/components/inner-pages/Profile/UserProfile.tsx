import { useState, useEffect } from "react";

// Define the types for the user data
interface CompletedModule {
  moduleId: string; // Assuming it's a string representation of an ObjectId
  moduleName: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  level?: number;
  completedModules: CompletedModule[];
}

const UserProfile = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState<User | null>(null);
  const [newModule, setNewModule] = useState<string>("");

  // Fetch the user data
  useEffect(() => {
    fetch(`http://localhost:3000/user/${userId}`)
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Error fetching user:", err));
  }, [userId]);

  const handleProgressUpdate = () => {
    fetch(`http://localhost:3000/user/${userId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: newModule,
        moduleName: `Module ${newModule}`,
      }),
    })
      .then((res) => res.json())
      .then((updatedUser) => setUser(updatedUser))
      .catch((err) => console.error("Error updating progress:", err));
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h2>User Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Level: {user.level}</p>

      <h3>Completed Modules</h3>
      <ul>
        {user.completedModules.map((mod) => (
          <li key={mod.moduleId}>{mod.moduleName}</li>
        ))}
      </ul>

      <input
        type="text"
        placeholder="Enter Module ID"
        value={newModule}
        onChange={(e) => setNewModule(e.target.value)}
      />
      <button onClick={handleProgressUpdate}>Add Module</button>
    </div>
  );
};

export default UserProfile;
