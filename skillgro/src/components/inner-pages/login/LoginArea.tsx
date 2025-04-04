import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setToken } from "../../../redux/features/AuthSlice";

// Define user data type based on your schema
interface UserData {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

// Define props for LoginForm
interface LoginFormProps {
  onLoginSuccess: (userData: UserData, token: string) => void;
  setError: Dispatch<SetStateAction<string>>;
}

// LoginForm Component
const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, setError }) => {
  const [credentials, setCredentials] = useState<{ email: string; password: string }>({
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState<string>("");
  const [showOtp, setShowOtp] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (data.status === "PENDING") {
        setShowOtp(true);
        setUserId(data.data.userId); // Assuming backend returns userId
        setError("Please check your email for an OTP");
      } else if (data.token) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/verifyOTP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await response.json();
      if (data.status === "VERIFIED") {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An error occurred verifying OTP. Please try again.");
    }
  };

  return (
    <>
      {!showOtp ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit}>
          <div className="form-group">
            <label>Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              required
              className="form-control"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Verify OTP
          </button>
        </form>
      )}
    </>
  );
};

// LoginArea Component
const LoginArea: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");

  // Define social login provider type
  type SocialProvider = "google" | "facebook" | "github" | "linkedin";

  // Social login handlers
  const handleSocialLogin = (provider: SocialProvider): void => {
    const baseUrl = "http://localhost:3000/auth";
    const providers: Record<SocialProvider, string> = {
      google: `${baseUrl}/google`,
      facebook: `${baseUrl}/facebook`,
      github: `${baseUrl}/github`,
      linkedin: `${baseUrl}/linkedin`,
    };

    const url = providers[provider];
    if (url) {
      window.location.href = url;
    } else {
      setError(`Unsupported login provider: ${provider}`);
    }
  };

  // Handle token from URL after social login redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const errorMsg = urlParams.get("error");

    if (token) {
      fetch("http://localhost:3000/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((userData: UserData) => {
          dispatch(setToken({ token, user: userData })); // Updated to match new AuthSlice
          const redirectPath = userData.role === "admin" ? "/admin/dashboard" : "/profile";
          navigate(redirectPath);
        })
        .catch(() => setError("Failed to fetch user data"));
    } else if (errorMsg) {
      setError(`Login failed: ${errorMsg}`);
    }
  }, [dispatch, navigate]);

  // Handle successful login from LoginForm
  const handleLoginSuccess = (userData: UserData, token: string): void => {
    dispatch(setToken({ token, user: userData })); // Updated to match new AuthSlice
    // localStorage.setItem("token", token); // Redundant since handled in AuthSlice
    const redirectPath = userData.role === "admin" ? "/admin/dashboard" : "/profile";
    navigate(redirectPath);
  };

  return (
    <section className="login-area section-py-120">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-8">
            <div className="login-wrap">
              <h2 className="title">Welcome Back!</h2>
              <p>
                Hey there! Ready to log in? Choose your preferred method below and get back in action!
              </p>
              {error && <p className="text-danger">{error}</p>}
              <div className="account__social">
                <button className="account__social-btn" onClick={() => handleSocialLogin("google")}>
                  <img src="/assets/img/icons/google.svg" alt="Google" />
                  Continue with Google
                </button>
              </div>
              <div className="account__social m-1">
                <button className="account__social-btn" onClick={() => handleSocialLogin("facebook")}>
                  <img src="/assets/img/icons/facebook.svg" alt="Facebook" />
                  Continue with Facebook
                </button>
              </div>
              <div className="account__social m-1">
                <button className="account__social-btn" onClick={() => handleSocialLogin("github")}>
                  <img
                    src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                    alt="GitHub"
                    width={30}
                    height={30}
                  />
                  Continue with GitHub
                </button>
              </div>
              <div className="account__social m-1">
                <button className="account__social-btn" onClick={() => handleSocialLogin("linkedin")}>
                  <img
                    src="https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg"
                    alt="LinkedIn"
                    width={30}
                    height={30}
                  />
                  Continue with LinkedIn
                </button>
              </div>
              <div className="account__divider">
                <span>or</span>
              </div>
              <LoginForm onLoginSuccess={handleLoginSuccess} setError={setError} />
              <div className="account__switch">
                <p>
                  Don’t have an account? <Link to="/registration">Sign Up</Link>
                </p>
                <p className="m-4">
                  Use your face instead! <Link to="/face-login">Face Login</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginArea;