import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, push, set, Database, remove, update } from "firebase/database";
import { Assignment } from '../types';

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
  id?: string;
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
    // Read from config/classes/classData path
    const classDataRef = ref(studentDb, 'config/classes/classData');
    const snapshot = await get(classDataRef);

    if (snapshot.exists()) {
      const classData = snapshot.val();
      const students: Student[] = [];

      // Loop through each class (e.g., "1B", "2A", etc.)
      Object.keys(classData).forEach(className => {
        const studentList = classData[className];

        // Loop through each student in the class (0, 1, 2, 3...)
        Object.keys(studentList).forEach(index => {
          const studentName = studentList[index];
          students.push({
            id: `${className}-${index}`, // Unique ID: class-index (e.g., "1B-0")
            nama: studentName,
            kelas: className
          });
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

// Delete all scores for a specific student
export const deleteStudentScores = async (studentName: string, kelas: string): Promise<boolean> => {
  try {
    const scoresRef = ref(scoreDb, 'scores');
    const snapshot = await get(scoresRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const updates: Record<string, null> = {};

      Object.keys(data).forEach(key => {
        if (data[key].studentName === studentName && data[key].kelas === kelas) {
          updates[`scores/${key}`] = null;
        }
      });

      if (Object.keys(updates).length > 0) {
        const rootRef = ref(scoreDb);
        await update(rootRef, updates);
      }
    }

    return true;
  } catch (error) {
    console.error("Error deleting student scores:", error);
    return false;
  }
};

// Admin authentication
export const authenticateAdmin = (password: string): boolean => {
  return password === "admin123";
};

// ===== ASSIGNMENT FUNCTIONS =====

// Create a new assignment
export const createAssignment = async (assignment: Omit<Assignment, 'id'>): Promise<string | null> => {
  try {
    const assignmentsRef = ref(scoreDb, 'assignments');
    const newAssignmentRef = push(assignmentsRef);
    const assignmentId = newAssignmentRef.key;

    if (!assignmentId) return null;

    await set(newAssignmentRef, {
      ...assignment,
      id: assignmentId
    });

    return assignmentId;
  } catch (error) {
    console.error("Error creating assignment:", error);
    return null;
  }
};

// Load all assignments
export const loadAllAssignments = async (): Promise<Assignment[]> => {
  try {
    const assignmentsRef = ref(scoreDb, 'assignments');
    const snapshot = await get(assignmentsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const assignments: Assignment[] = [];

      Object.keys(data).forEach(key => {
        const raw = data[key];
        assignments.push({
          ...raw,
          assignedStudentIds: Array.isArray(raw.assignedStudentIds) ? raw.assignedStudentIds : [],
          completedBy: Array.isArray(raw.completedBy) ? raw.completedBy.filter((id: string) => id !== '__placeholder__') : []
        });
      });

      // Sort by creation date descending
      return assignments.sort((a, b) => b.createdAt - a.createdAt);
    }

    return [];
  } catch (error) {
    console.error("Error loading assignments:", error);
    return [];
  }
};

// Get pending assignments for a student
export const getPendingAssignments = async (studentId: string, kelas: string): Promise<Assignment[]> => {
  try {
    const assignments = await loadAllAssignments();

    // Filter assignments for this student's class that they haven't completed yet
    return assignments.filter(assignment =>
      assignment.kelas === kelas &&
      assignment.assignedStudentIds.includes(studentId) &&
      !assignment.completedBy.includes(studentId)
    );
  } catch (error) {
    console.error("Error getting pending assignments:", error);
    return [];
  }
};

// Mark assignment as completed by a student
export const completeAssignment = async (assignmentId: string, studentId: string): Promise<boolean> => {
  try {
    const assignmentRef = ref(scoreDb, `assignments/${assignmentId}`);
    const snapshot = await get(assignmentRef);

    if (snapshot.exists()) {
      const assignment = snapshot.val();
      const completedBy = assignment.completedBy || [];

      // Add student to completedBy array if not already there
      if (!completedBy.includes(studentId)) {
        completedBy.push(studentId);
        await update(assignmentRef, { completedBy });
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error completing assignment:", error);
    return false;
  }
};

// Delete an assignment
export const deleteAssignment = async (assignmentId: string): Promise<boolean> => {
  try {
    const assignmentRef = ref(scoreDb, `assignments/${assignmentId}`);
    await remove(assignmentRef);
    return true;
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return false;
  }
};

export { studentDb, scoreDb };
