import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const navIconMap = {
    "Tổng quan": "⌂",
    "Người dùng": "👥",
    "Kỳ học": "📚",
    "Kỳ học của tôi": "📚",
    "Thông báo": "🔔",
};

export default function Sidebar({ title, subtitle, items }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-brand-badge">L</div>
                <div>
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
            </div>

            <nav className="sidebar-nav" aria-label="Điều hướng chính">
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/admin" || item.path === "/teacher" || item.path === "/student"}
                        className={({ isActive }) =>
                            isActive ? "sidebar-link active" : "sidebar-link"
                        }
                    >
                        <span className="sidebar-link-icon" aria-hidden="true">
                            {item.icon || navIconMap[item.label] || "•"}
                        </span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* <div className="sidebar-footer-card">
                <span>PTIT LMS</span>
                <strong>Không gian học tập số</strong>
            </div> */}
        </aside>
    );
}
