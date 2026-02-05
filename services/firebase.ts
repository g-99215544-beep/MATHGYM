import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, push, set, Database } from "firebase/database";

// Firebase config for student data (kehadiran-murid)
const studentDbConfig = {
  apiKey: "AIzaSyDbCgDz2vK2BZUpwM3iDWJcPQSptVcNkv4",
  authDomain: "kehadiran-murid-6ece0.firebaseapp.com",
  databaseURL: "https://kehadiran-murid-6ece0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kehadiran-murid-6ece0",
  storageBucket: "kehadiran-murid-6ece0.firebasestorage.app",
  messagingSenderId: "223849234784",
  appId: "1:223849234784:web:e1471ded7ea17ba60bde05",
  measurementId: "G-4DY138HKTW"
};

// Firebase config for score recording (mathgym)
const scoreDbConfig = {
  apiKey: "AIzaSyDwKhHV-dnFltmr1rXgLVlS9Zps0DvQpjg",
  authDomain: "mathgym-2266a.firebaseapp.com",
  databaseURL: "https://mathgym-2266a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mathgym-2266a",
  storageBucket: "mathgym-2266a.firebasestorage.app",
  messagingSenderId: "1089969116974",
  appId: "1:1089969116974:web:fe5e9dbd60e9e93f890cbf",
  measurementId: "G-EMLNYDD0RR"
};

// Initialize Firebase apps
const studentApp = initializeApp(studentDbConfig, "studentDB");
const scoreApp = initializeApp(scoreDbConfig, "scoreDB");

// Get database instances
const studentDb: Database = getDatabase(studentApp);
const scoreDb: Database = getDatabase(scoreApp);

// Types
export interface Student {
  id: string;
  nama: string;
  kelas: string;
}

export interface ScoreRecord {
  studentId: string;
  studentName: string;
  kelas: string;
  tahun: number;
  operation: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  percentage: number;
  timestamp: number;
  details?: any;
}

// Load students from Firebase
export const loadStudents = async (): Promise<Student[]> => {
  try {
    const studentsRef = ref(studentDb, 'students');
    const snapshot = await get(studentsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const students: Student[] = [];

      Object.keys(data).forEach(key => {
        students.push({
          id: key,
          nama: data[key].nama || data[key].name || 'Unknown',
          kelas: data[key].kelas || data[key].class || 'Unknown'
        });
      });

      return students;
    }

    return [];
  } catch (error) {
    console.error("Error loading students:", error);
    return [];
  }
};

// Get classes from students
export const getClasses = (students: Student[]): string[] => {
  const classes = new Set<string>();
  students.forEach(student => classes.add(student.kelas));
  return Array.from(classes).sort();
};

// Get students by class
export const getStudentsByClass = (students: Student[], kelas: string): Student[] => {
  return students.filter(student => student.kelas === kelas);
};

// Save score to Firebase
export const saveScore = async (scoreRecord: ScoreRecord): Promise<boolean> => {
  try {
    const scoresRef = ref(scoreDb, 'scores');
    const newScoreRef = push(scoresRef);
    await set(newScoreRef, scoreRecord);
    return true;
  } catch (error) {
    console.error("Error saving score:", error);
    return false;
  }
};

// Load all scores for admin dashboard
export const loadAllScores = async (): Promise<ScoreRecord[]> => {
  try {
    const scoresRef = ref(scoreDb, 'scores');
    const snapshot = await get(scoresRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const scores: ScoreRecord[] = [];

      Object.keys(data).forEach(key => {
        scores.push({
          ...data[key],
          id: key
        });
      });

      // Sort by timestamp descending
      return scores.sort((a, b) => b.timestamp - a.timestamp);
    }

    return [];
  } catch (error) {
    console.error("Error loading scores:", error);
    return [];
  }
};

// Admin authentication
export const authenticateAdmin = (password: string): boolean => {
  return password === "admin123";
};

export { studentDb, scoreDb };
