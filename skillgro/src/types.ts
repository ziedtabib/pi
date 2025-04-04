export interface Reponse {
  _id?: number;
  texte: string;
  isCorrect: boolean;
  answernum: string; // "A", "B", "C", or "D"
  questionId?: number;
}

export interface Question {
  _id: string;
  contenu: string;
  score: number;
  correctAnswer: string;
  quiz: string;
  reponses: Reponse[]; // Remove | string[] to enforce populated objects
  selectedAnswer?: string;
}

export interface Quiz {
  _id: string;
  idQuiz?: string;
  titre: string;
  description?: string;
  questions: Question[];
  scores: string[];
  course: string;
}
  
  export interface Course {
    idCours?: number; // Assuming this from your Java backend
    titre: string;
    description: string;
    image?: string;
    contenu?: string[]; // PDF URLs
    price?: number;
    category?: string;
    instructors?: string;
    rating?: number;
    skill_level?: string;
    price_type?: string;
    language?: string;
    popular?: string;
    createdAt?: string; // ISO date string
  }
  
  export interface ScoreQuiz {
    idScoreQuiz?: number;
    quiz: Quiz;
    user: { id: number; nom: string }; // Simplified user
    score: number;
    isTimedOut: boolean;
  }