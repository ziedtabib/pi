import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCourses } from '../redux/features/courseSlice';
import { Course } from '../types';

const BASE_URL = 'http://localhost:3000';

const UseCourses = (): Course[] => {
  const dispatch = useDispatch();

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/course`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const result = await response.json();
      console.log('Fetched courses:', result); // Vérifie la structure des données
  
      if (result.status === 'SUCCESS' && Array.isArray(result.data)) {
        dispatch(setCourses(result.data)); // Utilise uniquement `data`
        return result.data; // Retourne les cours récupérés
      } else {
        throw new Error('Invalid course data format');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      return []; // Retourne un tableau vide en cas d'erreur
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []); // Le hook s'exécute une fois au montage

  return []; // Tu peux retourner un tableau vide par défaut
};

export default UseCourses;
