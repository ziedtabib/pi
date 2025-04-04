import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import jwt_decode from "jwt-decode";
import DashboardBannerTwo from "../../dashboard-common/DashboardBannerTwo";
import DashboardSidebarTwo from "../../dashboard-common/DashboardSidebarTwo";
import InstructorProfileContent from "../../instructor-dashboard/profile/InstructorProfileContent";
import { RootState } from "../../../redux/store"; // Adjust the import according to your folder structure

// Define the structure of the decoded token
interface DecodedToken {
  _id: string;
  email: string;
  role: string;
  completedModules: { moduleId: string; moduleName: string }[];
  googleId?: string;
  githubId?: string;
  level?: number;
  [key: string]: any; // Allow any other dynamic fields in the decoded token
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  completedModules: { moduleId: string; moduleName: string }[];
  googleId?: string;
  githubId?: string;
  level?: number;
  [key: string]: any; // Allow any other dynamic fields in the user data
}

const StudentProfileArea = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Get token from Redux store
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (token) {
      // Decode the token to get user information
      const decodedToken = jwt_decode<DecodedToken>(token);
      const userId = decodedToken._id;

      // Fetch user profile data using the decoded userId
      fetch(`http://localhost:3000/user/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setUser(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user profile:", err);
          setLoading(false);
        });
    }
  }, [token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <section className="dashboard__area section-pb-120">
      <div className="container">
        <DashboardBannerTwo />
        <div className="dashboard__inner-wrap">
          <div className="row">
            <DashboardSidebarTwo />
            {user && <InstructorProfileContent user={user} style={true} />}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentProfileArea;
