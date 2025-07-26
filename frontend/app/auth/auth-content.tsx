"use client"

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { useState, useEffect } from "react"
import axios from "axios"
import { useGoogleLogin } from "@react-oauth/google"
import Image from "next/image"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser, faLock, faEnvelope, faTimes } from "@fortawesome/free-solid-svg-icons"
import { faGoogle, faMicrosoft, faTwitter } from "@fortawesome/free-brands-svg-icons"
import styles from "./auth.module.css"
import { useRouter } from 'next/navigation'

config.autoAddCss = false

export default function AuthContent() {
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("") // for sign-up form
  const [loading, setLoading] = useState(false) // to manage loading state
  const [error, setError] = useState("") // to display error messages
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [otp, setOtp] = useState("")
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotOtp, setForgotOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [signupOtpTimer, setSignupOtpTimer] = useState(60)
  const [forgotOtpTimer, setForgotOtpTimer] = useState(60)
  const [showForgotOtpField, setShowForgotOtpField] = useState(false)
  const [signupTimerActive, setSignupTimerActive] = useState(false)
  const [forgotTimerActive, setForgotTimerActive] = useState(false)
  const [signupEmail, setSignupEmail] = useState("") // Store email for OTP verification
  const router = useRouter()
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorModalMessage, setErrorModalMessage] = useState("")

  // Timer effect for signup OTP
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (signupTimerActive && signupOtpTimer > 0) {
      interval = setInterval(() => {
        setSignupOtpTimer(prev => prev - 1)
      }, 1000)
    } else if (signupOtpTimer === 0) {
      setSignupTimerActive(false)
    }
    return () => clearInterval(interval)
  }, [signupTimerActive, signupOtpTimer])

  // Timer effect for forgot password OTP
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (forgotTimerActive && forgotOtpTimer > 0) {
      interval = setInterval(() => {
        setForgotOtpTimer(prev => prev - 1)
      }, 1000)
    } else if (forgotOtpTimer === 0) {
      setForgotTimerActive(false)
    }
    return () => clearInterval(interval)
  }, [forgotTimerActive, forgotOtpTimer])

  const handleSignUpClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsSignUpMode(true)
    setError("") // clear error when switching modes
  }

  const handleSignInClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsSignUpMode(false)
    setError("") // clear error when switching modes
  }

  const showErrorPopup = (message: string) => {
    setErrorModalMessage(message)
    setShowErrorModal(true)
    setError("") // Clear inline error
  }

  const closeErrorModal = () => {
    setShowErrorModal(false)
    setErrorModalMessage("")
  }

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log(tokenResponse)
      localStorage.setItem("token", tokenResponse.access_token)
      console.log(localStorage.getItem("token"))
      router.push("/dashboard")
      // Handle successful login here
    },
    onError: (error) => {
      console.error("Login Failed:", error)
      setError("Google login failed. Please try again.")
    },
  })

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Basic form validation for Sign In
    if (!email || !password) {
      setError("Please fill in both email and password.")
      return
    }

    setLoading(true)
    setError("") // Clear previous errors

    try {
      const result = await axios.post<{
        token: string,
        user: {
          id: string,
          name: string,
          email: string,
          profile_pic: string
        }
      }>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
        email,
        password,
      })

      if (result.status === 200) {
        console.log("Login successful")
        console.log(result.data.user.id)
        localStorage.setItem("id", result.data.user.id);
        localStorage.setItem("token", result.data.token);
        router.push("/dashboard")
      } else {
        setError("Login failed. Please check your credentials.")
      }
    } catch (err: any) {
      console.error("Login failed:", err)

      // Handle specific error cases
      if (err.response?.status === 404) {
        showErrorPopup("User doesn't exist. Please check your email or sign up.")
      } else if (err.response?.status === 401) {
        const errorMessage = err.response?.data?.message?.toLowerCase() || ""

        if (errorMessage.includes("email")) {
          showErrorPopup("Incorrect email address. Please try again.")
        } else if (errorMessage.includes("password")) {
          showErrorPopup("Incorrect password. Please try again.")
        } else {
          showErrorPopup("Incorrect credentials. Please check your email and password.")
        }
      } else if (err.response?.data?.message) {
        showErrorPopup(err.response.data.message)
      } else {
        showErrorPopup("An error occurred. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Basic form validation for Sign Up
    if (!name || !email || !password) {
      setError("Please fill in all fields.")
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    // Password strength validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    setLoading(true)
    setError("") // Clear previous errors

    try {
      const result = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/signup`, {
        name,
        email,
        password,
      })

      if (result.status === 201) {
        console.log("Sign-up successful")
        setSignupEmail(email) // Store email for OTP verification
        setShowOtpModal(true)
        setSignupOtpTimer(600) // 10 minutes = 600 seconds
        setSignupTimerActive(true)
        setLoading(false)
      } else {
        setError("Sign-up failed. Please try again.")
      }
    } catch (err: any) {
      console.error("Sign-up failed:", err)

      // Handle specific error cases
      if (err.response?.status === 409 || err.response?.status === 400) {
        const errorMessage = err.response?.data?.message?.toLowerCase() || ""

        if (errorMessage.includes("email") && (errorMessage.includes("exist") || errorMessage.includes("already") || errorMessage.includes("taken"))) {
          showErrorPopup("User already exists with this email. Please try logging in or use a different email.")
        } else if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
          showErrorPopup("User already exists with this email. Please try logging in or use a different email.")
        } else {
          showErrorPopup(err.response.data.message || "Sign-up failed. Please try again.")
        }
      } else if (err.response?.data?.message) {
        showErrorPopup(err.response.data.message)
      } else {
        showErrorPopup("An error occurred. Please try again later.")
      }
    } finally {
      if (!showOtpModal) {
        setLoading(false)
      }
    }
  }

  const handleOtpVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!otp) {
      setError("Please enter the OTP.")
      return
    }

    if (otp.length !== 6) {
      setError("OTP must be 6 digits long.")
      return
    }

    setOtpLoading(true)
    setError("")

    try {
      const result = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/verify-email`, {
        email: signupEmail,
        otp: otp,
      })

      if (result.status === 200) {
        console.log("Email verification successful")
        setShowOtpModal(false)
        alert("Email verified successfully! You can now log in.")
        // Reset form and switch to sign in mode
        setIsSignUpMode(false)
        setEmail("")
        setPassword("")
        setName("")
        setOtp("")
        setSignupEmail("")
      }
    } catch (err: any) {
      console.error("OTP verification failed:", err)

      // Handle specific OTP error cases
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message?.toLowerCase() || ""

        if (errorMessage.includes("expired")) {
          setError("OTP has expired. Please request a new one.")
        } else if (errorMessage.includes("invalid") || errorMessage.includes("incorrect")) {
          setError("Invalid OTP. Please check and try again.")
        } else if (errorMessage.includes("attempts")) {
          setError("Too many failed attempts. Please request a new OTP.")
        } else {
          setError(err.response.data.message || "Invalid OTP. Please try again.")
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Invalid OTP. Please try again.")
      }
    } finally {
      setOtpLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!forgotEmail) {
      setError("Please enter your email address.")
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotEmail)) {
      setError("Please enter a valid email address.")
      return
    }

    setForgotPasswordLoading(true)
    setError("")

    try {
      const result = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/forgot-password`, {
        email: forgotEmail,
      })

      if (result.status === 200) {
        // Show OTP field and start timer
        setShowForgotOtpField(true)
        setForgotOtpTimer(900) // 15 minutes = 900 seconds
        setForgotTimerActive(true)
        console.log("Password reset code sent successfully")
      }
    } catch (err: any) {
      console.error("Forgot password failed:", err)
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        setError("User not found. Please check your email address.")
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message?.toLowerCase() || ""
        
        if (errorMessage.includes("verify") || errorMessage.includes("email first")) {
          setError("Please verify your email first before resetting password.")
        } else {
          setError(err.response.data.message || "Please enter a valid email address.")
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Failed to send reset code. Please try again.")
      }
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleForgotOtpVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!forgotOtp) {
      setError("Please enter the OTP.")
      return
    }

    if (forgotOtp.length !== 6) {
      setError("Reset code must be 6 digits long.")
      return
    }

    setOtpLoading(true)
    setError("")

    try {
      const result = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/verify-reset-token`, {
        email: forgotEmail,
        resetToken: forgotOtp,
      })

      if (result.status === 200) {
        // On successful verification, show reset password modal
        setShowForgotPasswordModal(false)
        setShowResetPasswordModal(true)
        setForgotTimerActive(false)
        console.log("Reset token verified successfully")
      }
    } catch (err: any) {
      console.error("OTP verification failed:", err)
      
      // Handle specific error cases
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message?.toLowerCase() || ""
        
        if (errorMessage.includes("expired")) {
          setError("Reset code has expired. Please request a new one.")
        } else if (errorMessage.includes("invalid") || errorMessage.includes("token")) {
          setError("Invalid reset code. Please check and try again.")
        } else {
          setError(err.response.data.message || "Invalid reset code. Please try again.")
        }
      } else if (err.response?.status === 404) {
        setError("User not found. Please check your email address.")
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Invalid reset code. Please try again.")
      }
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    setResetPasswordLoading(true)
    setError("")

    try {
      const result = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/reset-password`, {
        email: forgotEmail,
        resetToken: forgotOtp,
        newPassword: newPassword,
      })

      if (result.status === 200) {
        // On successful reset
        alert("Password reset successfully! Please login with your new password.")
        setShowResetPasswordModal(false)
        // Reset all states
        setForgotEmail("")
        setForgotOtp("")
        setNewPassword("")
        setConfirmPassword("")
        setShowForgotOtpField(false)
        setForgotTimerActive(false)
        console.log("Password reset successful")
      }
    } catch (err: any) {
      console.error("Password reset failed:", err)
      
      // Handle specific error cases
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message?.toLowerCase() || ""
        
        if (errorMessage.includes("expired") || errorMessage.includes("token")) {
          setError("Reset code has expired or is invalid. Please request a new reset code.")
        } else if (errorMessage.includes("password") && errorMessage.includes("6")) {
          setError("Password must be at least 6 characters long.")
        } else if (errorMessage.includes("verify") || errorMessage.includes("email")) {
          setError("Please verify your email first.")
        } else {
          setError(err.response.data.message || "Failed to reset password. Please try again.")
        }
      } else if (err.response?.status === 404) {
        setError("User not found. Please check your email address.")
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Failed to reset password. Please try again.")
      }
    } finally {
      setResetPasswordLoading(false)
    }
  }

  const closeOtpModal = () => {
    setShowOtpModal(false)
    setOtp("")
    setError("")
    setSignupTimerActive(false)
    setSignupOtpTimer(600) // Reset to 10 minutes
  }

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false)
    setForgotEmail("")
    setForgotOtp("")
    setShowForgotOtpField(false)
    setForgotTimerActive(false)
    setForgotOtpTimer(60)
    setError("")
  }

  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false)
    setNewPassword("")
    setConfirmPassword("")
    setError("")
  }

  const handleResendSignupOtp = async () => {
    try {
      setError("") // Clear any existing errors

      const result = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/resend-otp`, {
        email: signupEmail,
      })

      if (result.status === 200) {
        setSignupOtpTimer(600) // Reset to 10 minutes
        setSignupTimerActive(true)
        console.log("Signup OTP resent successfully")
        // Show success message briefly
        const successMessage = "OTP sent successfully! Check your email."
        setError("")
        // You could add a success state here if needed
      }
    } catch (err: any) {
      console.error("Failed to resend OTP:", err)

      // Handle resend OTP errors
      if (err.response?.status === 429) {
        setError("Too many requests. Please wait before requesting another OTP.")
      } else if (err.response?.status === 404) {
        setError("Email not found. Please check your email address.")
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Failed to resend OTP. Please try again.")
      }
    }
  }

  const handleResendForgotOtp = () => {
    setForgotOtpTimer(900) // 15 minutes = 900 seconds
    setForgotTimerActive(true)
    
    // Make API call to resend reset code
    handleForgotPassword({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)
  }

  return (
      <>
        <div className={`${styles.container} ${isSignUpMode ? styles.signUpMode : ""}`}>
          <div className={styles.formsContainer}>
            <div className={styles.signinSignup}>
              {/* Sign-in Form */}
              <form className={`${styles.formWrapper} ${styles.signInForm}`} onSubmit={handleLogin}>
                <h2 className={styles.title}>Sign in</h2>
                <div className={styles.inputField}>
                  <i>
                    <FontAwesomeIcon icon={faEnvelope} />
                  </i>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className={styles.inputField}>
                  <i>
                    <FontAwesomeIcon icon={faLock} />
                  </i>
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className={styles.forgotPassword}>
                  <button
                      type="button"
                      className={styles.forgotPasswordLink}
                      onClick={() => setShowForgotPasswordModal(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input type="submit" value={loading ? "Logging in..." : "Login"} className={styles.btn} disabled={loading} />
                <p className={styles.socialText}>Or Sign in with social platforms</p>
                <div className={styles.socialMedia}>
                  <a href="#" className={styles.socialIcon} onClick={(e) => {
                    e.preventDefault()
                    login()
                  }}>
                    <FontAwesomeIcon icon={faGoogle} />
                  </a>
                  <a href="#" className={styles.socialIcon}>
                    <FontAwesomeIcon icon={faMicrosoft} />
                  </a>
                  <a href="#" className={styles.socialIcon}>
                    <FontAwesomeIcon icon={faTwitter} />
                  </a>
                </div>
              </form>

              {/* Sign-up Form */}
              <form className={`${styles.formWrapper} ${styles.signUpForm}`} onSubmit={handleSignUp}>
                <h2 className={styles.title}>Sign up</h2>
                <div className={styles.inputField}>
                  <i>
                    <FontAwesomeIcon icon={faUser} />
                  </i>
                  <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className={styles.inputField}>
                  <i>
                    <FontAwesomeIcon icon={faEnvelope} />
                  </i>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className={styles.inputField}>
                  <i>
                    <FontAwesomeIcon icon={faLock} />
                  </i>
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <input type="submit" value={loading ? "Signing up..." : "Sign up"} className={styles.btn} disabled={loading} />
                <p className={styles.socialText}>Or Sign up with social platforms</p>
                <div className={styles.socialMedia}>
                  <a href="#" className={styles.socialIcon} onClick={(e) => {
                    e.preventDefault()
                    login()
                  }}>
                    <FontAwesomeIcon icon={faGoogle} />
                  </a>
                  <a href="#" className={styles.socialIcon}>
                    <FontAwesomeIcon icon={faMicrosoft} />
                  </a>
                  <a href="#" className={styles.socialIcon}>
                    <FontAwesomeIcon icon={faTwitter} />
                  </a>
                </div>
              </form>
            </div>
          </div>

          {/* Panels */}
          <div className={styles.panelsContainer}>
            <div className={`${styles.panel} ${styles.leftPanel}`}>
              <div className={styles.content}>
                <h3>New here?</h3>
                <p>Join SymptoSeek to access personalized health insights and connect with our AI-powered symptom analysis.</p>
                <button className={`${styles.btn} ${styles.transparent}`} onClick={handleSignUpClick}>
                  Sign up
                </button>
              </div>
              <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/log-k7snnCr50CZaS0nowddBS8zQWSl4Dd.svg"
                  className={styles.image}
                  alt="Sign In illustration"
                  width={400}
                  height={400}
                  priority
              />
            </div>
            <div className={`${styles.panel} ${styles.rightPanel}`}>
              <div className={styles.content}>
                <h3>One of us?</h3>
                <p>Welcome back! Sign in to continue your health journey with SymptoSeek.</p>
                <button className={`${styles.btn} ${styles.transparent}`} onClick={handleSignInClick}>
                  Sign in
                </button>
              </div>
              <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/register-0OxCKpnMUkcjl19rsUa9ymhgx8h2dU.svg"
                  className={styles.image}
                  alt="Sign Up illustration"
                  width={400}
                  height={400}
                  priority
              />
            </div>
          </div>
        </div>

        {/* OTP Verification Modal */}
        {showOtpModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <button className={styles.closeButton} onClick={closeOtpModal}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div className={styles.modalContent}>
                  <h2 className={styles.modalTitle}>Verify Your Email</h2>
                  <p className={styles.modalDescription}>
                    We've sent a verification code to <strong>{signupEmail}</strong>. Please enter the code below to complete your registration.
                  </p>
                  <div className={styles.timerDisplay}>
                    Time remaining: {Math.floor(signupOtpTimer / 60)}:{(signupOtpTimer % 60).toString().padStart(2, '0')}
                  </div>
                  <form onSubmit={handleOtpVerification}>
                    <div className={styles.inputField}>
                      <i>
                        <FontAwesomeIcon icon={faLock} />
                      </i>
                      <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                      />
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                    <input
                        type="submit"
                        value={otpLoading ? "Verifying..." : "Verify OTP"}
                        className={styles.btn}
                        disabled={otpLoading}
                    />
                  </form>
                  <div className={styles.resendSection}>
                    <p>Didn't receive the code?</p>
                    <button
                        type="button"
                        className={styles.resendButton}
                        onClick={handleResendSignupOtp}
                        disabled={signupTimerActive}
                    >
                      {signupTimerActive ? `Resend in ${signupOtpTimer}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <button className={styles.closeButton} onClick={closeForgotPasswordModal}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div className={styles.modalContent}>
                  <h2 className={styles.modalTitle}>Reset Password</h2>
                  <p className={styles.modalDescription}>
                    Enter your email address and we'll send you an OTP to reset your password.
                  </p>
                  {!showForgotOtpField ? (
                      <form onSubmit={handleForgotPassword}>
                        <div className={styles.inputField}>
                          <i>
                            <FontAwesomeIcon icon={faEnvelope} />
                          </i>
                          <input
                              type="email"
                              placeholder="Enter your email"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                          />
                        </div>
                        {error && <p className={styles.error}>{error}</p>}
                        <input
                            type="submit"
                            value={forgotPasswordLoading ? "Sending..." : "Send OTP"}
                            className={styles.btn}
                            disabled={forgotPasswordLoading}
                        />
                      </form>
                  ) : (
                      <form onSubmit={handleForgotOtpVerification}>
                        <div className={styles.inputField}>
                          <i>
                            <FontAwesomeIcon icon={faEnvelope} />
                          </i>
                          <input
                              type="email"
                              placeholder="Enter your email"
                              value={forgotEmail}
                              disabled
                          />
                        </div>
                        <div className={styles.timerDisplay}>
                          Code expires in: {Math.floor(forgotOtpTimer / 60)}:{(forgotOtpTimer % 60).toString().padStart(2, '0')}
                        </div>
                        <div className={styles.inputField}>
                          <i>
                            <FontAwesomeIcon icon={faLock} />
                          </i>
                          <input
                              type="text"
                              placeholder="Enter OTP"
                              value={forgotOtp}
                              onChange={(e) => setForgotOtp(e.target.value)}
                              maxLength={6}
                          />
                        </div>
                        {error && <p className={styles.error}>{error}</p>}
                        <input
                            type="submit"
                            value={otpLoading ? "Verifying..." : "Verify OTP"}
                            className={styles.btn}
                            disabled={otpLoading}
                        />
                        <div className={styles.resendSection}>
                          <p>Didn't receive the code?</p>
                          <button
                              type="button"
                              className={styles.resendButton}
                              onClick={handleResendForgotOtp}
                              disabled={forgotTimerActive}
                          >
                            {forgotTimerActive ? `Resend in ${forgotOtpTimer}s` : "Resend OTP"}
                          </button>
                        </div>
                      </form>
                  )}
                </div>
              </div>
            </div>
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <button className={styles.closeButton} onClick={closeResetPasswordModal}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div className={styles.modalContent}>
                  <h2 className={styles.modalTitle}>Set New Password</h2>
                  <p className={styles.modalDescription}>
                    Enter your new password below.
                  </p>
                  <form onSubmit={handleResetPassword}>
                    <div className={styles.inputField}>
                      <i>
                        <FontAwesomeIcon icon={faLock} />
                      </i>
                      <input
                          type="password"
                          placeholder="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className={styles.inputField}>
                      <i>
                        <FontAwesomeIcon icon={faLock} />
                      </i>
                      <input
                          type="password"
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                    <input
                        type="submit"
                        value={resetPasswordLoading ? "Resetting..." : "Reset Password"}
                        className={styles.btn}
                        disabled={resetPasswordLoading}
                    />
                  </form>
                </div>
              </div>
            </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <button className={styles.closeButton} onClick={closeErrorModal}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div className={styles.modalContent}>
                  <h2 className={styles.modalTitle}>Authentication Error</h2>
                  <p className={styles.modalDescription}>
                    {errorModalMessage}
                  </p>
                  <button
                      type="button"
                      className={styles.btn}
                      onClick={closeErrorModal}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
        )}
      </>
  )
}