"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Bell,
  Settings,
  LogOut,
  User,
  Camera,
  Save,
  Stethoscope,
  ArrowLeft,
  Heart,
  CreditCard
} from "lucide-react"
import styles from "./edit.module.css"

type TabId = "personal" | "medical" | "security" | "subscription"

const tabs = [
  { id: "personal" as TabId, icon: <User size={20} />, label: "Edit Personal" },
  { id: "medical" as TabId, icon: <Heart size={20} />, label: "Medical Info" },
  { id: "security" as TabId, icon: <Settings size={20} />, label: "Security Settings" },
  { id: "subscription" as TabId, icon: <CreditCard size={20} />, label: "Subscription" },
]

export default function EditProfilePage() {
  const router = useRouter()
  const [profileImage, setProfileImage] = useState("https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg?w=740")
  const [activeTab, setActiveTab] = useState<TabId>("personal")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    zipCode: "",
    city: "",
    state: "",
    country: "",
    bio: "",
    gender: "",
    age: "",
    profilePic: "",
    blood_group: "",
    weight: "",
    height: "",
    allergies: "",
    medical_conditions: "",
    medications: "",
    surgeries: "",
    family_medical_history: "",
    emergency_contact: ""
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  // Check authentication first
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth")
        return
      }
      setIsAuthenticated(true)
      setAuthLoading(false)
    }

    checkAuth()
  }, [router])

  // Fetch initial user data
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`http://localhost:5000/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch profile data")
        }

        const data = await response.json()
        const nameParts = data.name?.trim().split(" ") || []
        const lastName = nameParts.pop() || ""
        const firstName = nameParts.join(" ")
        setFormData({
          firstName,
          lastName,
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          zipCode: data.zip_code || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          bio: data.bio || "",
          gender: data.gender || "",
          age: data.age || "",
          profilePic: data.profile_pic || "",
          blood_group: data.blood_group || "",
          weight: data.weight || "",
          height: data.height || "",
          allergies: data.allergies || "",
          medical_conditions: data.medical_conditions || "",
          medications: data.medications || "",
          surgeries: data.surgeries || "",
          family_medical_history: data.family_medical_history || "",
          emergency_contact: data.emergency_contact || ""
        })
        setProfileImage(data.profile_pic || "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg?w=740")
      } catch (error) {
        console.error("Error fetching profile data:", error)
        setError("Failed to load profile data")
      }
    }

    fetchProfileData()
  }, [isAuthenticated])

  // Handle Image Upload to Cloudinary
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "symptoseek_profile")

      const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dslepn2og"}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
      )

      if (!res.ok) {
        throw new Error("Image upload failed")
      }

      const data = await res.json()
      if (data.secure_url) {
        setProfileImage(data.secure_url)
        setFormData(prev => ({ ...prev, profilePic: data.secure_url }))
      }
    } catch (error) {
      console.error("Image upload failed:", error)
      setError("Failed to upload image")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name in passwordData) {
      setPasswordData({ ...passwordData, [name]: value })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const data = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        bio: formData.bio,
        gender: formData.gender,
        age: formData.age,
        phone: formData.phone,
        address: formData.address,
        zip_code: formData.zipCode,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        profile_pic: formData.profilePic,
        blood_group: formData.blood_group,
        height: formData.height,
        weight: formData.weight,
        emergency_contact: formData.emergency_contact,
        allergies: formData.allergies,
        medical_conditions: formData.medical_conditions,
        medications: formData.medications,
        surgeries: formData.surgeries,
        family_medical_history: formData.family_medical_history
      }

      const response = await fetch(`http://localhost:5000/api/auth/profile/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update profile")
      }

      const updatedUser = await response.json()
      console.log("Profile updated successfully:", updatedUser)

      // Redirect to profile page with success message
      router.push("/profile?updated=true")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setError(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async () => {
    setPasswordError("")
    setPasswordSuccess("")

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Please fill in all password fields.")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.")
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("New password must be different from current password.")
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`http://localhost:5000/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = "Failed to change password"
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          // If response is HTML (like error page), extract meaningful message
          if (responseText.includes("<!DOCTYPE")) {
            errorMessage = "Server error occurred. Please try again later."
          } else {
            errorMessage = responseText || errorMessage
          }
        }
        throw new Error(errorMessage)
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        // If successful response but not JSON, treat as success
        result = { message: "Password changed successfully" }
      }

      console.log("Password changed successfully:", result)

      // Reset password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

      setPasswordSuccess("Password changed successfully! A confirmation email has been sent.")

      // Clear success message after 5 seconds
      setTimeout(() => {
        setPasswordSuccess("")
      }, 5000)

    } catch (error: any) {
      console.error("Error changing password:", error)
      setPasswordError(error.message || "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/auth"
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f9fafb'
        }}>
          <div style={{
            padding: '2rem',
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            Loading...
          </div>
        </div>
    )
  }

  // Don't render the page if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <Link href="/" className={styles.mainLogo}>
            <div className={styles.logoIcon}>
              <Stethoscope size={24} />
            </div>
            <span>SymptoSeek</span>
          </Link>

          <nav>
            <Link href="/dashboard" className={styles.navItem}>
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
            <Link href="/reports" className={styles.navItem}>
              <FileText size={20} />
              Reports
            </Link>
            <Link href="/appointments" className={styles.navItem}>
              <Calendar size={20} />
              Appointments
            </Link>
            <Link href="/reminders" className={styles.navItem}>
              <Bell size={20} />
              Reminders
            </Link>
            <Link href="/profile" className={`${styles.navItem} ${styles.active}`}>
              <User size={20} />
              Profile
            </Link>
          </nav>

          <div className={styles.bottomNav}>
            <Link href="/settings" className={styles.navItem}>
              <Settings size={20} />
              Settings
            </Link>
            <button className={styles.navItem} onClick={handleLogout}>
              <LogOut size={20} />
              Log out
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.header}>
            <Link href="/profile" className={styles.backButton}>
              <ArrowLeft size={20} />
              Back to Profile
            </Link>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.tabs}>
            {tabs.map((tab, index) => (
                <button
                    key={index}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
            ))}
          </div>

          <form className={styles.editForm} onSubmit={handleSubmit}>
            {activeTab === "personal" && (
                <>
                  <div className={styles.imageSection}>
                    <div className={styles.imageWrapper}>
                      <Image
                          src={profileImage}
                          alt="Profile"
                          width={120}
                          height={120}
                          className={styles.profileImage}
                      />
                      <label className={styles.uploadButton}>
                        <Camera size={20} />
                        {isLoading ? "Uploading..." : "Change Photo"}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={styles.fileInput}
                            disabled={isLoading}
                        />
                      </label>
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h2>Personal Information</h2>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>First Name</label>
                        <input
                            id="firstName"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Enter first name"
                            disabled={isLoading}
                            required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Last Name</label>
                        <input
                            id="lastName"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Enter last name"
                            disabled={isLoading}
                            required
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Phone Number</label>
                      <input
                          id="phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                          disabled={isLoading}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="bio">Bio</label>
                      <textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          placeholder="Enter your bio"
                          className={styles.textarea}
                          disabled={isLoading}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="gender">Gender</label>
                        <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            disabled={isLoading}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="age">Age</label>
                        <input
                            id="age"
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="Enter age"
                            disabled={isLoading}
                            min="1"
                            max="120"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h2>Address Information</h2>

                    <div className={styles.formGroup}>
                      <label>Address</label>
                      <input
                          id="address"
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter street address"
                          disabled={isLoading}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>ZIP Code</label>
                        <input
                            id="zipCode"
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleChange}
                            placeholder="Enter ZIP code"
                            disabled={isLoading}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>City</label>
                        <input
                            id="city"
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Enter city"
                            disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>State</label>
                        <input
                            id="state"
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="Enter state"
                            disabled={isLoading}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Country</label>
                        <input
                            id="country"
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="Enter country"
                            disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </>
            )}

            {activeTab === "medical" && (
                <div className={styles.formSection}>
                  <h2>Medical Details</h2>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Blood Type</label>
                      <select
                          name="blood_group"
                          value={formData.blood_group}
                          onChange={handleChange}
                          disabled={isLoading}
                      >
                        <option value="">Select...</option>
                        {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Height (cm)</label>
                      <input
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          placeholder="Enter height"
                          disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Weight (kg)</label>
                      <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="Enter weight"
                          disabled={isLoading}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Emergency Contact</label>
                      <input
                          type="tel"
                          name="emergency_contact"
                          value={formData.emergency_contact}
                          onChange={handleChange}
                          placeholder="Enter emergency contact"
                          disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Allergies</label>
                    <textarea
                        name="allergies"
                        rows={3}
                        value={formData.allergies}
                        onChange={handleChange}
                        placeholder="List any allergies"
                        disabled={isLoading}
                        className={styles.textarea}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Medical Conditions</label>
                    <textarea
                        name="medical_conditions"
                        rows={3}
                        value={formData.medical_conditions}
                        onChange={handleChange}
                        placeholder="Enter any medical conditions"
                        disabled={isLoading}
                        className={styles.textarea}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Medications</label>
                    <textarea
                        name="medications"
                        rows={2}
                        value={formData.medications}
                        onChange={handleChange}
                        placeholder="List current medications"
                        disabled={isLoading}
                        className={styles.textarea}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Surgeries</label>
                    <textarea
                        name="surgeries"
                        rows={2}
                        value={formData.surgeries}
                        onChange={handleChange}
                        placeholder="List past surgeries"
                        disabled={isLoading}
                        className={styles.textarea}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Family Medical History</label>
                    <textarea
                        name="family_medical_history"
                        rows={3}
                        value={formData.family_medical_history}
                        onChange={handleChange}
                        placeholder="Enter family medical history"
                        disabled={isLoading}
                        className={styles.textarea}
                    />
                  </div>
                </div>
            )}


            {activeTab === "security" && (
                <div className={styles.formSection}>
                  <h2>Security Settings</h2>

                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        disabled
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Current Password</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter current password"
                        required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        minLength={6}
                        required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Confirm New Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                        minLength={6}
                        required
                    />
                  </div>

                  {passwordError && (
                      <div className={styles.errorMessage}>
                        {passwordError}
                      </div>
                  )}

                  {passwordSuccess && (
                      <div className={styles.successMessage}>
                        {passwordSuccess}
                      </div>
                  )}
                </div>
            )}

            {activeTab === "subscription" && (
                <div className={styles.formSection}>
                  <h2>Subscription Details</h2>
                  <p className={styles.comingSoon}>Subscription management coming soon...</p>
                </div>
            )}

            <div className={styles.actions}>
              {activeTab !== "security" && (
                  <Link href="/profile" className={`${styles.button} ${styles.secondaryButton}`} passHref>
                    Cancel
                  </Link>
              )}
              {activeTab !== "security" && (
                  <button
                      type="submit"
                      className={`${styles.button} ${styles.primaryButton}`}
                      disabled={isLoading}
                  >
                    {isLoading ? (
                        "Updating..."
                    ) : (
                        <>
                          <Save size={16} />
                          Update
                        </>
                    )}
                  </button>
              )}
              {activeTab === "security" && (
                  <Link href="/profile" className={`${styles.button} ${styles.secondaryButton}`} passHref>
                    Cancel
                  </Link>
              )}
              {activeTab === "security" && (
                  <button
                      type="button"
                      className={`${styles.button} ${styles.primaryButton}`}
                      onClick={handlePasswordChange}
                      disabled={isLoading}
                  >
                    {isLoading ? (
                        "Changing..."
                    ) : (
                        <>
                          <Save size={16} />
                          Change Password
                        </>
                    )}
                  </button>
              )}
            </div>
          </form>
        </main>
      </div>
  )
}