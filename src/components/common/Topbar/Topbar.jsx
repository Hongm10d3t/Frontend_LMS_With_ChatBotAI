import { useLocation, useNavigate } from "react-router-dom";
import "./Topbar.css";

const roleLabelMap = {
    ADMIN: "Quản trị viên",
    TEACHER: "Giảng viên",
    STUDENT: "Sinh viên",
};

const rootPathMap = {
    ADMIN: "/admin",
    TEACHER: "/teacher",
    STUDENT: "/student",
};

export default function Topbar({ title, user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();

    const displayName = user?.fullName || user?.code || "Người dùng";
    const avatarLetter = displayName?.charAt(0)?.toUpperCase() || "U";
    const rootPath = rootPathMap[user?.role] || "/";
    const canGoBack = location.pathname !== rootPath && location.pathname !== "/login";

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate(rootPath);
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                {canGoBack && (
                    <button
                        type="button"
                        className="topbar-back-btn"
                        onClick={handleBack}
                        title="Quay lại trang trước"
                    >
                        ←
                    </button>
                )}

                <div className="topbar-title-block">
                    <span className="topbar-eyebrow">PTIT Learning Management System</span>
                    <h1>{title}</h1>
                    <p>Học tập, kiểm tra và trao đổi trong một không gian thống nhất.</p>
                </div>
            </div>

            <div className="topbar-user">
                <div className="topbar-avatar" aria-hidden="true">
                    {avatarLetter}
                </div>

                <div className="topbar-user-info">
                    <strong>{displayName}</strong>
                    <span>{roleLabelMap[user?.role] || user?.role || ""}</span>
                </div>

                <button className="logout-btn" onClick={onLogout} type="button">
                    Đăng xuất
                </button>
            </div>
        </header>
    );
}
