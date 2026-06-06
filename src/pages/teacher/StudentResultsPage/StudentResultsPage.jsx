import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    getTeacherCourseStudentsApi,
    getTeacherStudentExamResultsApi,
} from "../../../features/teacher/teacher.api";

export default function TeacherStudentResultsPage() {
    const { termId,courseId, studentId } = useParams();

    const [results, setResults] = useState([]);
    const [studentName, setStudentName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const [resultsData, studentData] = await Promise.all([
                    getTeacherStudentExamResultsApi(courseId, studentId),
                    getTeacherCourseStudentsApi(courseId),
                ]);

                const selectedStudent = (Array.isArray(studentData?.students) ? studentData.students : []).find(
                    (student) => student._id === studentId
                );

                setStudentName(selectedStudent?.fullName || selectedStudent?.code || "");

                const data = resultsData;
                setResults(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error(error);
                alert("Không tải được kết quả học tập của sinh viên.");
                setStudentName("");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [courseId, studentId]);

    return (
        <div className="teacher-page">
            <div className="teacher-page-header">
                <div>
                    {/* <span className="page-chip">Giảng viên / Kết quả học tập</span> */}
                    <h2>Kết quả học tập của {studentName || "sinh viên"}</h2>
                    <p>Danh sách các đề sinh viên này đã làm trong học phần.</p>
                </div>

                <Link className="teacher-back-link" to={`/teacher/terms/${termId}/courses/${courseId}/students`}>
                    ← Quay lại danh sách sinh viên
                </Link>
            </div>

            {loading ? (
                <div className="teacher-loading-card">Đang tải kết quả học tập...</div>
            ) : results.length ? (
                <div className="teacher-table-wrapper">
                    <table className="teacher-table">
                        <thead>
                            <tr>
                                <th>Đề thi</th>
                                <th>Số lần làm</th>
                                <th>Điểm cao nhất</th>
                                <th>Điểm gần nhất</th>
                                <th>Trạng thái gần nhất</th>
                                <th>Lần nộp gần nhất</th>
                                <th>Kết quả</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((item) => (
                                <tr key={item.examId}>
                                    <td><strong>{item.title}</strong></td>
                                    <td>{item.attemptCount}</td>
                                    <td>{item.bestScore}</td>
                                    <td>{item.latestScore}</td>
                                    <td>{item.latestStatus}</td>
                                    <td>
                                        {item.latestSubmittedAt
                                            ? new Date(item.latestSubmittedAt).toLocaleString("vi-VN")
                                            : "--"}
                                    </td>
                                    <td>
                                        <Link
                                            className="teacher-inline-link"
                                            to={`/teacher/terms/${termId}/courses/${courseId}/students/${studentId}/results/${item.examId}`}
                                        >
                                            Xem các lần làm
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="teacher-empty-card">
                    <h3>Chưa có dữ liệu</h3>
                    <p>Sinh viên này chưa làm đề nào trong học phần này.</p>
                </div>
            )}
        </div>
    );
}