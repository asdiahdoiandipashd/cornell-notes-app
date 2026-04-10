import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  calculateNextReviewAt,
  getInitialNextReviewAt,
  isReviewDue,
  type ReviewRecord,
} from "@/services/reviewService";

export type Subject = {
  id: string;
  name: string;
  colorIndex: number;
  createdAt: number;
};

export type CornellNote = {
  id: string;
  title: string;
  subjectId: string;
  cues: string;
  notes: string;
  summary: string;
  createdAt: number;
  updatedAt: number;
  reviewCount: number;
  nextReviewAt: number | null;
  lastReviewedAt: number | null;
  reviewHistory: ReviewRecord[];
};

type NotesContextType = {
  notes: CornellNote[];
  subjects: Subject[];
  addNote: (note: Omit<CornellNote, "id" | "createdAt" | "updatedAt" | "reviewCount" | "nextReviewAt" | "lastReviewedAt" | "reviewHistory">) => CornellNote;
  updateNote: (id: string, updates: Partial<CornellNote>) => void;
  deleteNote: (id: string) => void;
  completeReview: (id: string) => void;
  addSubject: (name: string) => Subject;
  deleteSubject: (id: string) => void;
  getSubjectById: (id: string) => Subject | undefined;
  getNotesForSubject: (subjectId: string) => CornellNote[];
  isLoading: boolean;
};

const NotesContext = createContext<NotesContextType | null>(null);

const NOTES_KEY = "@cornell_notes_v1";
const SUBJECTS_KEY = "@cornell_subjects_v1";

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "1", name: "数学", colorIndex: 0, createdAt: Date.now() },
  { id: "2", name: "物理", colorIndex: 1, createdAt: Date.now() },
  { id: "3", name: "历史", colorIndex: 2, createdAt: Date.now() },
];

const now = Date.now();
const DEFAULT_NOTES: CornellNote[] = [
  {
    id: "demo1",
    title: "牛顿第二定律",
    subjectId: "2",
    cues: "F = ma 是什么？\n什么是惯性？\n力的单位是什么？",
    notes: "牛顿第二定律：物体的加速度与其所受合力成正比，与质量成反比。\n\n• F = ma（力 = 质量 × 加速度）\n• 力的单位：牛顿 (N)\n• 1N = 1kg·m/s²\n• 方向：力的方向即加速度方向",
    summary: "牛顿第二定律 F=ma 揭示了力、质量和加速度之间的定量关系。力越大加速度越大，质量越大加速度越小。",
    createdAt: now - 86400000,
    updatedAt: now - 86400000,
    reviewCount: 0,
    nextReviewAt: getInitialNextReviewAt(now - 86400000),
    lastReviewedAt: null,
    reviewHistory: [],
  },
];

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function migrateNote(note: Record<string, unknown>): CornellNote {
  const n = note as CornellNote;
  return {
    ...n,
    reviewCount: n.reviewCount ?? 0,
    nextReviewAt: n.nextReviewAt ?? (n.createdAt ? getInitialNextReviewAt(n.createdAt as number) : null),
    lastReviewedAt: n.lastReviewedAt ?? null,
    reviewHistory: n.reviewHistory ?? [],
  };
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<CornellNote[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [notesData, subjectsData] = await Promise.all([
        AsyncStorage.getItem(NOTES_KEY),
        AsyncStorage.getItem(SUBJECTS_KEY),
      ]);
      const loadedNotes = notesData
        ? (JSON.parse(notesData) as Record<string, unknown>[]).map(migrateNote)
        : DEFAULT_NOTES;
      const loadedSubjects = subjectsData ? JSON.parse(subjectsData) : DEFAULT_SUBJECTS;
      setNotes(loadedNotes);
      setSubjects(loadedSubjects);
    } catch (e) {
      setNotes(DEFAULT_NOTES);
      setSubjects(DEFAULT_SUBJECTS);
    } finally {
      setIsLoading(false);
    }
  }

  function updateAndPersistNotes(updater: (prev: CornellNote[]) => CornellNote[]) {
    setNotes((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next));
      return next;
    });
  }

  function updateAndPersistSubjects(updater: (prev: Subject[]) => Subject[]) {
    setSubjects((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(SUBJECTS_KEY, JSON.stringify(next));
      return next;
    });
  }

  const addNote = useCallback(
    (noteData: Omit<CornellNote, "id" | "createdAt" | "updatedAt" | "reviewCount" | "nextReviewAt" | "lastReviewedAt" | "reviewHistory">): CornellNote => {
      const createdAt = Date.now();
      const newNote: CornellNote = {
        ...noteData,
        id: generateId(),
        createdAt,
        updatedAt: createdAt,
        reviewCount: 0,
        nextReviewAt: getInitialNextReviewAt(createdAt),
        lastReviewedAt: null,
        reviewHistory: [],
      };
      updateAndPersistNotes((prev) => [newNote, ...prev]);
      return newNote;
    },
    []
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<CornellNote>) => {
      updateAndPersistNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        )
      );
    },
    []
  );

  const deleteNote = useCallback(
    (id: string) => {
      updateAndPersistNotes((prev) => prev.filter((n) => n.id !== id));
    },
    []
  );

  const completeReview = useCallback(
    (id: string) => {
      updateAndPersistNotes((prev) =>
        prev.map((n) => {
          if (n.id !== id) return n;
          if (!isReviewDue(n.reviewCount, n.nextReviewAt)) return n;
          const newCount = n.reviewCount + 1;
          const reviewedAt = Date.now();
          const newHistory: ReviewRecord = { reviewedAt, stage: n.reviewCount };
          return {
            ...n,
            reviewCount: newCount,
            lastReviewedAt: reviewedAt,
            nextReviewAt: newCount >= 6 ? null : calculateNextReviewAt(newCount, reviewedAt),
            reviewHistory: [...n.reviewHistory, newHistory],
            updatedAt: reviewedAt,
          };
        })
      );
    },
    []
  );

  const addSubject = useCallback(
    (name: string): Subject => {
      const newSubject: Subject = {
        id: generateId(),
        name,
        colorIndex: 0,
        createdAt: Date.now(),
      };
      updateAndPersistSubjects((prev) => {
        newSubject.colorIndex = prev.length % 8;
        return [...prev, newSubject];
      });
      return newSubject;
    },
    []
  );

  const deleteSubject = useCallback(
    (id: string) => {
      updateAndPersistSubjects((prev) => prev.filter((s) => s.id !== id));
      updateAndPersistNotes((prev) => prev.filter((n) => n.subjectId !== id));
    },
    []
  );

  const getSubjectById = useCallback(
    (id: string) => subjects.find((s) => s.id === id),
    [subjects]
  );

  const getNotesForSubject = useCallback(
    (subjectId: string) => notes.filter((n) => n.subjectId === subjectId),
    [notes]
  );

  return (
    <NotesContext.Provider
      value={{
        notes,
        subjects,
        addNote,
        updateNote,
        deleteNote,
        completeReview,
        addSubject,
        deleteSubject,
        getSubjectById,
        getNotesForSubject,
        isLoading,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within NotesProvider");
  return ctx;
}
