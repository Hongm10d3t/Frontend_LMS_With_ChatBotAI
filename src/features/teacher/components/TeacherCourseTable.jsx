import { Link } from "react-router-dom";
import {
    formatCourseStatus,
    getCourseStatusClass,
} from "../teacher.helpers";
import "./TeacherCourseTable.css";

export default function TeacherCourseTable({ courses, termId }) {
    if (!courses.length) {
        return (
            <div className="teacher-empty-card">
                <h3>Chưa có lớp học nào</h3>
                <p>Không tìm thấy lớp học phần trong kỳ học này.</p>
            </div>
        );
    }

    return (
        <div className="teacher-table-wrapper">
            <table className="teacher-table">
                <thead>
                    <tr>
                        <th>Mã học phần</th>
                        <th>Tên học phần</th>
                        <th>Mô tả</th>
                        <th>Trạng thái</th>
                        <th>Chi tiết</th>
                    </tr>
                </thead>

                <tbody>
                    {courses.map((course) => (
                        <tr key={course._id}>
                            <td>{course.code || "--"}</td>
                            <td>
                                <strong>{course.name || "--"}</strong>
                            </td>
                            <td>{course.description || "--"}</td>
                            <td>
                                <span className={getCourseStatusClass(course.status)}>
                                    {formatCourseStatus(course.status)}
                                </span>
                            </td>
                            <td>
                                <Link
                                    className="teacher-inline-link"
                                    to={`/teacher/terms/${termId}/courses/${course._id}/students`}
                                >
                                    Chi tiết
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}