import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTeacherCourseStudentsApi } from "../../../features/teacher/teacher.api";
import TeacherStudentTable from "../../../features/teacher/components/TeacherStudentTable";
import "./StudentsPage.css";

export default function TeacherStudentsPage() {
    const { courseId } = useParams();
    const { termId } = useParams();

    const [course, setCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const result = await getTeacherCourseStudentsApi(courseId);
                setCourse(result.course || null);
                setStudents(Array.isArray(result.students) ? result.students : []);
            } catch (error) {
                console.error(error);
                alert("Không tải được danh sách sinh viên.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [courseId]);

    return (
        <div className="teacher-page">
            <div className="teacher-page-header">
                <div>
                    {/* <span className="page-chip">Giảng viên / Sinh viên trong lớp</span> */}
                    <h2>{course?.name || "Danh sách sinh viên"}</h2>
                    <p>Xem danh sách sinh viên đang học trong học phần này.</p>
                </div>

                <Link className="teacher-back-link" to={`/teacher/terms/${termId}/courses`}>
                    ← Quay lại danh sách học phần
                </Link>
            </div>

            <div>
                <Link
                    className="teacher-inline-link"
                    to={`/teacher/terms/${termId}/courses/${courseId}/students`}
                >
                    Danh sách sinh viên
                </Link>

                <Link
                    className="teacher-inline-link"
                    to={`/teacher/terms/${termId}/courses/${courseId}/materials`}
                >
                    Quản lý tài liệu
                </Link>

                <Link
                    className="teacher-inline-link"
                    to={`/teacher/terms/${termId}/courses/${courseId}/question-banks`}
                >
                    Quản lý ngân hàng câu hỏi
                </Link>

                <Link
                    className="teacher-inline-link"
                    to={`/teacher/terms/${termId}/courses/${courseId}/exams`}
                >
                    Quản lý bài kiểm tra
                </Link>

                <Link
                    className="teacher-inline-link"
                    to={`/teacher/terms/${termId}/courses/${courseId}/chat`}
                >
                    Chat lớp học
                </Link>
            </div>

            {loading ? (
                <div className="teacher-loading-card">Đang tải danh sách sinh viên...</div>
            ) : (
                // <TeacherStudentTable students={students} />
                <TeacherStudentTable students={students} courseId={courseId} termId={termId} />
            )}
        </div>
    );
}