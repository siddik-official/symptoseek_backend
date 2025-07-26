"use client"

import Link from "next/link"
import {type ReactNode, useState, useEffect} from "react"
import { useRouter } from 'next/navigation';
import axios from "axios";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Bell,
  Settings,
  LogOut,
  User,
  Stethoscope,
  Download,
  Filter,
  Menu,
  Plus,
  X
} from "lucide-react"
import styles from "./reports.module.css"

interface NavItemProps {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}
interface User {
  _id?: string;
  profile_pic?: string;
  name?: string;
}

interface Report {
  _id: string
  title: string
  reportDate: string
  type: string
  status: string
  doctor?: string
  fileUrl: string
  user: string
  createdAt: string
  updatedAt: string
}

export default function ReportsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedType, setSelectedType] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newReport, setNewReport] = useState({
    title: "",
    type: "Laboratory",
    status: "Pending",
    reportDate: "",
    doctor: "",
    file: null as File | null
  })
  const [uploadLoading, setUploadLoading] = useState(false)
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth");
        return;
      }
      
      try {
        // Fetch user data
        const userResponse = await axios.get(`http://localhost:5000/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userResponse.data);

        // Fetch reports
        const reportsResponse = await axios.get(`http://localhost:5000/api/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Reports response:", reportsResponse.data);
        setReports(reportsResponse.data.data || []);
        
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          router.push("/auth");
        } else {
          setError("Failed to fetch data. Please try refreshing the page.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/auth");
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.file) {
      setError("Please select a file to upload");
      return;
    }

    setUploadLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("title", newReport.title);
      formData.append("type", newReport.type);
      formData.append("status", newReport.status);
      formData.append("reportDate", newReport.reportDate);
      formData.append("doctor", newReport.doctor);
      formData.append("reportFile", newReport.file);

      const response = await axios.post(
        "http://localhost:5000/api/reports",
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          } 
        }
      );

      setReports(prev => [response.data.data, ...prev]);
      setNewReport({
        title: "",
        type: "Laboratory",
        status: "Pending", 
        reportDate: "",
        doctor: "",
        file: null
      });
      setIsAddModalOpen(false);
      setError("");
    } catch (error: any) {
      console.error("Error adding report:", error);
      setError(error.response?.data?.message || "Failed to add report");
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadReport = async (reportId: string, fileName: string) => {
    const report = reports.find(r => r._id === reportId);
    if (report?.fileUrl) {
      window.open(report.fileUrl, '_blank');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesType = !selectedType || report.type === selectedType
    const matchesStatus = !selectedStatus || report.status === selectedStatus
    return matchesType && matchesStatus
  })

  const types = Array.from(new Set(reports.map(report => report.type)));
  const statuses = Array.from(new Set(reports.map(report => report.status)));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <div className={styles.loading}>Loading reports...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
      <div className={styles.container}>
        <button className={styles.menuButton} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu size={24} />
        </button>

        <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
          <Link href="/" className={styles.mainLogo}>
            <div className={styles.logoIcon}>
              <Stethoscope size={24} />
            </div>
            <span>SymptoSeek</span>
          </Link>

          <nav className={styles.navigation}>
            <Link href="/dashboard" className={styles.navItem}>
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
            <Link href="/reports" className={`${styles.navItem} ${styles.active}`}>
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
            <Link href="/profile" className={styles.navItem}>
              <User size={20} />
              Profile
            </Link>
          </nav>

          <div className={styles.bottomNav}>
            <Link href="/settings" className={styles.navItem}>
              <Settings size={20} />
              Settings
            </Link>
            <button onClick={handleLogout} className={styles.navItem}>
              <LogOut size={20} />
              Log out
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <h1>Medical Reports</h1>
              <button 
                className={styles.addReportBtn}
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={18} />
                <span>Add New Report</span>
              </button>
            </div>
            <div className={styles.headerFilters}>
              <div className={styles.filtersContainer}>
                <div className={styles.filterGroup}>
                  <label>
                    <FileText size={16} />
                    Filter by Type
                  </label>
                  <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className={styles.filterSelect}
                  >
                    <option value="">All Types</option>
                    {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.filterGroup}>
                  <label>
                    <Filter size={16} />
                    Filter by Status
                  </label>
                  <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className={styles.filterSelect}
                  >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.resultsInfo}>
                <span className={styles.resultsCount}>
                  {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} found
                </span>
              </div>
            </div>
          </div>

          <div className={styles.reports}>
            {filteredReports.map((report) => (
                <div key={report._id} className={styles.reportCard}>
                  <div className={styles.reportHeader}>
                    <h3>{report.title}</h3>
                    <span className={`${styles.status} ${styles[report.status.toLowerCase()]}`}>
                      {report.status}
                    </span>
                  </div>

                  <div className={styles.reportDetails}>
                    <div className={styles.detail}>
                      <FileText size={16} />
                      <span>Type: {report.type}</span>
                    </div>
                    <div className={styles.detail}>
                      <Calendar size={16} />
                      <span>Date: {formatDate(report.reportDate)}</span>
                    </div>
                    <div className={styles.detail}>
                      <User size={16} />
                      <span>Doctor: {report.doctor || 'N/A'}</span>
                    </div>
                  </div>

                  <button 
                    className={styles.downloadButton}
                    onClick={() => downloadReport(report._id, report.title)}
                  >
                    <Download size={16} />
                    View Report
                  </button>
                </div>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <div className={styles.emptyState}>
              <FileText size={48} />
              <h3>No Reports Found</h3>
              <p>Upload your medical reports to keep track of your health records.</p>
              <button 
                className={styles.addReportBtn}
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={18} />
                <span>Add Your First Report</span>
              </button>
            </div>
          )}

          {isAddModalOpen && (
            <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
              <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h2>Add New Report</h2>
                  <button
                    className={styles.closeButton}
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddReport}>
                  <div className={styles.modalContent}>
                    <div className={styles.formGroup}>
                      <label htmlFor="title">Report Title</label>
                      <input
                        id="title"
                        type="text"
                        value={newReport.title}
                        onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Blood Test Results"
                        required
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="type">Report Type</label>
                        <select
                          id="type"
                          value={newReport.type}
                          onChange={(e) => setNewReport(prev => ({ ...prev, type: e.target.value }))}
                          required
                        >
                          <option value="Laboratory">Laboratory</option>
                          <option value="Radiology">Radiology</option>
                          <option value="Check-up">Check-up</option>
                          <option value="Specialist">Specialist</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="status">Status</label>
                        <select
                          id="status"
                          value={newReport.status}
                          onChange={(e) => setNewReport(prev => ({ ...prev, status: e.target.value }))}
                          required
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="reportDate">Report Date</label>
                        <input
                          id="reportDate"
                          type="date"
                          value={newReport.reportDate}
                          onChange={(e) => setNewReport(prev => ({ ...prev, reportDate: e.target.value }))}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="doctor">Doctor Name</label>
                        <input
                          id="doctor"
                          type="text"
                          value={newReport.doctor}
                          onChange={(e) => setNewReport(prev => ({ ...prev, doctor: e.target.value }))}
                          placeholder="Dr. John Doe"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="file">Upload Report File</label>
                      <input
                        id="file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setNewReport(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                        required
                      />
                      <small>Supported formats: PDF, JPG, PNG (Max 10MB)</small>
                    </div>
                  </div>

                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setIsAddModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className={styles.saveButton}
                      disabled={uploadLoading}
                    >
                      {uploadLoading ? "Uploading..." : "Add Report"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
  )
}
