// redux/features/courseSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Course {
  _id: string;
  titre: string;
  description: string;
  image: string;
  contenu: string[]; // Array of URLs for course materials
  price: number;
  category: string;
  instructors: string;
  rating: number;
  skill_level: string;
  price_type: string;
  language: string;
  popular: string;
  createdAt: string;
}

interface CourseState {
  courses: Course[];
}

const initialState: CourseState = {
  courses: [],
};

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    setCourses: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload;
    },
  },
});

export const { setCourses } = courseSlice.actions;
export const selectCourses = (state: { course: CourseState }) => state.course.courses;
export default courseSlice.reducer;
