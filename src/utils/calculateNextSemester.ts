import { Level, Semester } from '../entities';

export const calculateNextSemester = (level: Level, semester: Semester) => {
  if (semester === Semester.FIRST) {
    return {
      level,
      semester: Semester.SECOND
    };
  }

  if (semester === Semester.SECOND) {
    const nextLevel = `${(Number.parseInt(level, 10) + 100).toString()}L`;
    if (nextLevel <= Level.FIVE_HUNDRED_LEVEL) {
      return {
        level: nextLevel,
        semester: Semester.FIRST
      };
    }

    return {
      level: 'Program Complete',
      semester: 'N/A'
    };
  }

  return {
    level: 'Invalid Semester',
    semester: 'N/A'
  };
};
