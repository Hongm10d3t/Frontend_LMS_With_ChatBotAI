import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    createTeacherQuestionBankApi,
    deleteTeacherQuestionBankApi,
    getTeacherQuestionBanksApi,
    importTeacherQuestionBankCsvApi,
    getTeacherCoursesApi
} from "../../../features/teacher/teacher.api";
import TeacherQuestionBankTable from "../../../features/teacher/components/TeacherQuestionBankTable";
import QuestionBankFormModal from "../../../features/teacher/components/QuestionBankFormModal";
import ImportCsvModal from "../../../features/teacher/components/ImportCsvModal";
import "./QuestionBanksPage.css";

export default function TeacherQuestionBanksPage() {
    const { courseId } = useParams();
    const { termId } = useParams();

    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [courseName, setCourseName] = useState("");
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [openImportModal, setOpenImportModal] = useState(false);
    const [selectedBank, setSelectedBank] = useState(null);

    const fetchBanks = async () => {
        try {
            setLoading(true);
            const data = await getTeacherQuestionBanksApi(courseId);
            setBanks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            alert("Không tải được question bank.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanks();
    }, [courseId]);

    useEffect(() => {
        const fetchCourseName = async () => {
            try {
                const courses = await getTeacherCoursesApi(termId);
                const currentCourse = (Array.isArray(courses) ? courses : []).find(
                    (course) => course._id === courseId
                );
                setCourseName(currentCourse?.name || "");
            } catch (error) {
                console.error(error);
            }
        };

        fetchCourseName();
    }, [courseId, termId]);

    // const handleCreateBank = async (formData) => {
    //     try {
    //         setSubmitting(true);
    //         await createTeacherQuestionBankApi(courseId, formData);
    //         setOpenCreateModal(false);
    //         await fetchBanks();
    //     } catch (error) {
    //         console.error(error);
    //         alert("Tạo question bank thất bại.");
    //     } finally {
    //         setSubmitting(false);
    //     }
    // };
    const handleCreateBank = async (formData) => {
        try {
            setSubmitting(true);

            const result = await createTeacherQuestionBankApi(courseId, formData);

            if (result?.EC && result.EC !== 0) {
                alert(result?.EM || "Tạo question bank thất bại.");
                return;
            }

            setOpenCreateModal(false);
            await fetchBanks();

            alert(
                formData.file
                    ? "Tạo question bank và import CSV thành công."
                    : "Tạo question bank thành công."
            );
        } catch (error) {
            console.error(error);

            const message =
                error?.response?.data?.EM ||
                error?.response?.data?.message ||
                "Tạo question bank thất bại.";

            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBank = async (bank) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa question bank ${bank.title || bank.name}?`
        );
        if (!confirmed) return;

        try {
            await deleteTeacherQuestionBankApi(courseId, bank._id);
            await fetchBanks();
        } catch (error) {
            console.error(error);
            alert("Xóa question bank thất bại.");
        }
    };

    const handleOpenImport = (bank) => {
        setSelectedBank(bank);
        setOpenImportModal(true);
    };

    const handleImportCsv = async (file) => {
        try {
            setSubmitting(true);
            await importTeacherQuestionBankCsvApi(selectedBank._id, file);
            setOpenImportModal(false);
            setSelectedBank(null);
            await fetchBanks();
            alert("Import CSV thành công.");
        } catch (error) {
            console.error(error);
            alert("Import CSV thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="teacher-page">
            <div className="teacher-page-header">
                <div>
                    {/* <span className="page-chip">Giảng viên / Question bank</span> */}
                    <h2>{courseName || "Ngân hàng câu hỏi"}</h2>
                    <p>Quản lý ngân hàng câu hỏi</p>
                </div>

                <div className="teacher-header-actions">
                    <Link className="teacher-back-link" to={`/teacher/terms/${termId}/courses`}>
                        ← Quay lại danh sách học phần
                    </Link>
                    <button className="teacher-primary-btn" onClick={() => setOpenCreateModal(true)}>
                        + Tạo question bank
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

            {loading ? (
                <div className="teacher-loading-card">Đang tải question bank...</div>
            ) : (
                <TeacherQuestionBankTable
                    termId={termId}
                    courseId={courseId}
                    banks={banks}
                    onDelete={handleDeleteBank}
                    onImportCsv={handleOpenImport}
                />
            )}

            <QuestionBankFormModal
                open={openCreateModal}
                onClose={() => setOpenCreateModal(false)}
                onSubmit={handleCreateBank}
                isSubmitting={submitting}
            />

            <ImportCsvModal
                open={openImportModal}
                bankName={selectedBank?.title || selectedBank?.name}
                onClose={() => {
                    setOpenImportModal(false);
                    setSelectedBank(null);
                }}
                onSubmit={handleImportCsv}
                isSubmitting={submitting}
            />
        </div>
    );
}