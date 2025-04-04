// InstructorProfileContent.tsx
import React from "react";

interface User {
  name: string;
  email: string;
  role: string;
  completedModules: { moduleId: string; moduleName: string }[];
  // Add any other fields based on what you expect from the API
}

const InstructorProfileContent = ({ user, style }: { user: User, style: boolean }) => {
  return (
    <div className={`profile-content ${style ? "styled" : ""}`}>
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>

      <h3>Completed Modules:</h3>
      <ul>
        {user.completedModules.map((module) => (
          <li key={module.moduleId}>{module.moduleName}</li>
        ))}
      </ul>
    </div>
  );
};

export default InstructorProfileContent;
