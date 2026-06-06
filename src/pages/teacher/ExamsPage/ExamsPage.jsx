import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    createTeacherRandomExamApi,
    deleteTeacherExamApi,
    getTeacherExamsApi,
    getTeacherQuestionBanksApi,
    getTeacherCoursesApi
} from "../../../features/teacher/teacher.api";
import TeacherExamTable from "../../../features/teacher/components/TeacherExamTable";
import RandomExamFormModal from "../../../features/teacher/components/RandomExamFormModal";
import "./ExamsPage.css";

export default function TeacherExamsPage() {
    const { termId } = useParams();
    const { courseId } = useParams();

    const [courseName, setCourseName] = useState("");
    const [exams, setExams] = useState([]);
    const [questionBanks, setQuestionBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [openCreateModal, setOpenCreateModal] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [examsData, banksData, courseData] = await Promise.all([
                getTeacherExamsApi(courseId),
                getTeacherQuestionBanksApi(courseId),
                getTeacherCoursesApi(termId)
            ]);

            setExams(Array.isArray(examsData) ? examsData : []);
            const currentCourse = (Array.isArray(courseData) ? courseData : []).find(
                (course) => course._id === courseId
            );
            setCourseName(currentCourse?.name || "");
            setQuestionBanks(Array.isArray(banksData) ? banksData : []);
        } catch (error) {
            console.error(error);
            alert("Không tải được danh sách bài thi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const handleCreateExam = async (formData) => {
        try {
            setSubmitting(true);
            await createTeacherRandomExamApi(formData);
            setOpenCreateModal(false);
            await fetchData();
        } catch (error) {
            console.error(error);
            alert("Tạo đề thi thất bại. Bạn nhập sai hoặc thiếu thông tin");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteExam = async (exam) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa đề thi ${exam.title || exam.name}?`
        );
        if (!confirmed) return;

        try {
            await deleteTeacherExamApi(exam._id);
            await fetchData();
        } catch (error) {
            console.error(error);
            alert("Xóa đề thi thất bại.");
        }
    };

    return (
        <div className="teacher-page">
            <div className="teacher-page-header">
                <div>
                    {/* <span className="page-chip">Giảng viên / Bài thi</span> */}
                    <h2>{courseName || "Danh sách bài thi"}</h2>
                    <p>Quản lý kiểm tra</p>
                </div>

                <div className="teacher-header-actions">
                    <Link className="teacher-back-link" to={`/teacher/terms/${termId}/courses`}>
                        ← Quay lại danh sách học phần
                    </Link>
                    <button
                        className="teacher-primary-btn"
                        onClick={() => setOpenCreateModal(true)}
                        disabled={!questionBanks.length}
                    >
                        + Tạo đề ngẫu nhiên
                    </button>
                </div>
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

            {!questionBanks.length && !loading ? (
                <div className="teacher-warning-card">
                    Bạn cần tạo ít nhất một question bank trước khi tạo đề thi.
                </div>
            ) : null}

            {loading ? (
                <div className="teacher-loading-card">Đang tải danh sách bài thi...</div>
            ) : (
                <TeacherExamTable termId={termId} courseId={courseId} exams={exams} onDelete={handleDeleteExam} />
            )}

            <RandomExamFormModal
                open={openCreateModal}
                questionBanks={questionBanks}
                courseId={courseId}
                onClose={() => setOpenCreateModal(false)}
                onSubmit={handleCreateExam}
                isSubmitting={submitting}
            />
        </div>
    );
}