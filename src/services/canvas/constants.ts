export const ENDPOINTS = {
    ALL_COURSES: '/courses',  
    COURSE_FOLDER: (courseId: number) => `/courses/${courseId}/folders`,
    FOLDER_FILES: (folderId: number) => `/folders/${folderId}/files`,
}