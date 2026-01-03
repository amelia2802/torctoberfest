// Client-side storage utilities using Google Sheets (via Apps Script)
// Fallback to localStorage if VITE_GOOGLE_SCRIPT_URL is not set

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

export interface Book {
  id?: string;
  title: string;
  author: string;
  coverUrl?: string;
  dateRead?: string;
  rating?: number;
  notes?: string;
  addedBy: string;
  createdAt?: string;
}

export interface StudyGuide {
  id?: string;
  title: string;
  bookTitle: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
}

export interface VotingOption {
  id?: string;
  bookTitle: string;
  author: string;
  suggestedBy: string;
  votes: number;
  createdAt?: string;
}

const STORAGE_KEYS = {
  BOOKS: 'bookclub_books',
  GUIDES: 'bookclub_guides',
  VOTES: 'bookclub_votes',
  CURRENT_USER: 'bookclub_user',
};

// Helper for Google Sheets API
async function callSheetsAPI(action: string, data?: any) {
  if (!SCRIPT_URL) {
    console.warn('⚠️ Google Script URL not set. Using local fallback.');
    return null;
  }

  try {
    if (data) {
      // POST request
      // We don't set Content-Type to avoid preflight (OPTIONS) request which Apps Script doesn't handle.
      // We pass data as a blob or string.
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({ action, ...data })
      });
      return { status: 'success' };
    } else {
      // GET request
      const response = await fetch(`${SCRIPT_URL}?action=${action}`, {
        redirect: 'follow'
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result && result.status === 'error') {
        throw new Error(result.message);
      }
      return result;
    }
  } catch (error) {
    console.error(`❌ Sheets API Error (${action}):`, error);
    return null;
  }
}

// Local Fallback Helpers
function getLocal(key: string) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}
function setLocal(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Books
export const getBooks = async (): Promise<Book[]> => {
  const remoteData = await callSheetsAPI('getBooks');
  if (remoteData) {
    return remoteData.map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      coverUrl: b.cover_url,
      dateRead: b.date_read,
      rating: Number(b.rating),
      notes: b.notes,
      addedBy: b.added_by,
      createdAt: b.created_at,
    }));
  }
  return getLocal(STORAGE_KEYS.BOOKS);
};

export const saveBook = async (book: Book): Promise<void> => {
  const bookData = {
    title: book.title,
    author: book.author,
    cover_url: book.coverUrl || '',
    date_read: book.dateRead || '',
    rating: book.rating || 0,
    notes: book.notes || '',
    added_by: book.addedBy,
  };

  const remoteResult = await callSheetsAPI('saveBook', { row: bookData });

  // Sync to local for offline/immediate use
  const books = getLocal(STORAGE_KEYS.BOOKS);
  books.unshift({ ...book, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() });
  setLocal(STORAGE_KEYS.BOOKS, books);
};

export const deleteBook = async (id: string): Promise<void> => {
  await callSheetsAPI('deleteBook', { id });
  const books = getLocal(STORAGE_KEYS.BOOKS).filter((b: any) => b.id !== id);
  setLocal(STORAGE_KEYS.BOOKS, books);
};

export const deleteStudyGuide = async (id: string): Promise<void> => {
  await callSheetsAPI('deleteGuide', { id });
  const guides = getLocal(STORAGE_KEYS.GUIDES).filter((g: any) => g.id !== id);
  setLocal(STORAGE_KEYS.GUIDES, guides);
};

export const deleteStudyGuideFile = async (fileUrl: string): Promise<void> => {
  // Since we don't have a real file system or Supabase storage anymore,
  // we'll just ignore this or implement it if the ID can be extracted.
  console.warn('deleteStudyGuideFile: File deletion not implemented for Sheets.');
};

// Study Guides
export const getStudyGuides = async (): Promise<StudyGuide[]> => {
  const remoteData = await callSheetsAPI('getGuides');
  if (remoteData) {
    return remoteData.map((g: any) => ({
      id: g.id,
      title: g.title,
      bookTitle: g.book_title,
      fileUrl: g.file_url,
      fileName: g.file_name,
      fileSize: Number(g.file_size),
      uploadedAt: g.uploaded_at,
    }));
  }
  return getLocal(STORAGE_KEYS.GUIDES);
};

export const uploadStudyGuideFile = async (file: File): Promise<string> => {
  // Mock file upload as Sheets doesn't store files directly
  console.log('📤 Note: File storage not implemented for Sheets. Using mock URL.');
  return URL.createObjectURL(file); // Temporary blob URL
};

export const saveStudyGuide = async (guide: StudyGuide): Promise<void> => {
  const guideData = {
    title: guide.title,
    book_title: guide.bookTitle,
    file_url: guide.fileUrl || '',
    file_name: guide.fileName || '',
    file_size: guide.fileSize || 0,
  };

  await callSheetsAPI('saveGuide', { row: guideData });

  const guides = getLocal(STORAGE_KEYS.GUIDES);
  guides.unshift({ ...guide, id: Math.random().toString(36).substr(2, 9), uploadedAt: new Date().toISOString() });
  setLocal(STORAGE_KEYS.GUIDES, guides);
};

// Voting
export const getVotingOptions = async (): Promise<VotingOption[]> => {
  const remoteData = await callSheetsAPI('getVotes');
  if (remoteData) {
    return remoteData.map((o: any) => ({
      id: o.id,
      bookTitle: o.book_title,
      author: o.author,
      suggestedBy: o.suggested_by,
      votes: Number(o.votes),
      createdAt: o.created_at,
    }));
  }
  return getLocal(STORAGE_KEYS.VOTES);
};

export const saveVotingOption = async (option: VotingOption): Promise<void> => {
  const optionData = {
    book_title: option.bookTitle,
    author: option.author,
    suggested_by: option.suggestedBy,
    votes: option.votes || 0,
  };

  await callSheetsAPI('saveVote', { row: optionData });

  const votes = getLocal(STORAGE_KEYS.VOTES);
  votes.push({ ...option, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() });
  setLocal(STORAGE_KEYS.VOTES, votes);
};

export const voteForOption = async (id: string): Promise<void> => {
  await callSheetsAPI('vote', { id });

  const votes = getLocal(STORAGE_KEYS.VOTES);
  const index = votes.findIndex((v: any) => v.id === id);
  if (index !== -1) {
    votes[index].votes = (votes[index].votes || 0) + 1;
    setLocal(STORAGE_KEYS.VOTES, votes);
  }
};

export const clearVotingOptions = async (): Promise<void> => {
  await callSheetsAPI('clearVotes');
  setLocal(STORAGE_KEYS.VOTES, []);
};

// User
export const getCurrentUser = (): string => {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'Book Club Member';
};

export const setCurrentUser = (username: string): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
};
