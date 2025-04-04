import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCourses } from '../../../redux/features/courseSlice';
import UseCourses from '../../../hooks/UseCourses'; // Si tu as ce hook
import { Course } from '../../../types'; // Si tu as besoin d'importer le type Course

const CourseArea: React.FC = () => {
  const coursesFromRedux = useSelector(selectCourses); // Récupérer les cours depuis Redux
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Appeler UseCourses pour récupérer les cours (si nécessaire)
  const coursesFromHook = UseCourses();

  useEffect(() => {
    // Si les cours viennent de UseCourses, tu pourrais les stocker dans Redux
    if (coursesFromHook && coursesFromHook.length > 0) {
      // Dispatch les cours dans Redux si nécessaire
      // dispatch(setCourses(coursesFromHook)); // Si tu veux stocker les données dans Redux
    }

    // Assurer que le tableau des cours est bien récupéré et que les données sont valides
    if (!coursesFromRedux || coursesFromRedux.length === 0) {
      setErrorMessage('No courses available. Check backend or Redux state.');
    } else {
      setErrorMessage(null);
    }

    setIsLoading(false);
  }, [coursesFromHook, coursesFromRedux]); // Mise à jour lorsque les données de Hook ou Redux changent

  // Si en cours de chargement, afficher "Loading..."
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Si une erreur se produit, afficher le message d'erreur
  if (errorMessage) {
    return <div className="alert alert-danger">{errorMessage}</div>;
  }

  // Si aucun cours n'est disponible
  if (coursesFromRedux.length === 0) {
    return <div>No courses available. Check backend or Redux state.</div>;
  }

  return (
    <div className="course-list">
      {coursesFromRedux.map((course: Course) => (
        <div key={course.idCours} className="course-item">
          <h3>{course.titre}</h3>
          <p>{course.description}</p>
          {course.image && <img src={course.image} alt={course.titre} />}
          <p><strong>Price:</strong> ${course.price}</p>
        </div>
      ))}
    </div>
  );
};

export default CourseArea;
