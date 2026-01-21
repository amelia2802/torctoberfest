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
  isMember: boolean;
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
  isMember: boolean;
  votes: number;
  createdAt?: string;
}

export interface GenreVote {
  id: string; // The genre name will be the ID
  name: string;
  votes: number;
  icon?: string;
}

const STORAGE_KEYS = {
  BOOKS: 'bookclub_books',
  GUIDES: 'bookclub_guides',
  VOTES: 'bookclub_votes',
  GENRE_VOTES: 'bookclub_genre_votes',
  CURRENT_USER: 'bookclub_user',
};

// Helper for Google Sheets API
async function callSheetsAPI(action: string, data?: any) {
  if (!SCRIPT_URL) {
    console.warn(`⚠️ [Sheets API] VITE_GOOGLE_SCRIPT_URL is not set. Action '${action}' will use local fallback.`);
    return null;
  }

  try {
    // For reliability with Google Apps Script redirects and CORS, 
    // we use GET for ALL operations, including writes.
    // We encode the payload as a JSON string in the URL.
    const url = new URL(SCRIPT_URL);
    url.searchParams.set('action', action);
    if (data) {
      url.searchParams.set('payload', JSON.stringify({ action, ...data }));
    }
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      mode: 'cors'
    });

    if (!response.ok) {
      console.error(`❌ [Sheets API] HTTP Error: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result && result.status === 'error') {
      console.error(`❌ [Sheets API] Script Error:`, result.message);
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    console.error(`❌ [Sheets API] Error during '${action}':`, error);
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
      isMember: b.is_member === 'TRUE' || b.is_member === true,
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
    is_member: book.isMember,
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
      isMember: o.is_member === 'TRUE' || o.is_member === true,
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
    is_member: option.isMember,
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
  await callSheetsAPI('clearVotes', {}); // Force POST request
  setLocal(STORAGE_KEYS.VOTES, []);
};

// Genre Voting
const DEFAULT_GENRES = [
  "Action/Adventure",
  "Historical Fiction",
  "Drama / Literary Fiction",
  "Romance",
  "Sci-Fi",
  "Fantasy",
  "Mystery / Thriller",
  "Horror"
];

export const getGenreVotes = async (): Promise<GenreVote[]> => {
  const remoteData = await callSheetsAPI('getGenreVotes');
  const localVotes = getLocal(STORAGE_KEYS.GENRE_VOTES);

  // Create a map for quick lookup
  const votesMap = new Map<string, number>();

  // Use remote data if available, otherwise fallback to local
  const sourceData = (remoteData && Array.isArray(remoteData)) ? remoteData : localVotes;

  sourceData.forEach((g: any) => {
    votesMap.set(g.name || g.id, Number(g.votes || 0));
  });

  // Ensure all default genres are present
  return DEFAULT_GENRES.map(name => ({
    id: name,
    name,
    votes: votesMap.get(name) || 0
  }));
};

export const voteForGenre = async (genreName: string): Promise<void> => {
  const user = getCurrentUser();
  if (!user.email) throw new Error("Please set your profile email to vote");

  const result = await callSheetsAPI('voteGenre', {
    name: genreName,
    email: user.email
  });

  if (result && result.status === 'error') {
    throw new Error(result.message);
  }

  const votes = await getGenreVotes();
  const index = votes.findIndex(v => v.name === genreName);
  if (index !== -1) {
    votes[index].votes += 1;
    setLocal(STORAGE_KEYS.GENRE_VOTES, votes);
  } else {
    votes.push({ id: genreName, name: genreName, votes: 1 });
    setLocal(STORAGE_KEYS.GENRE_VOTES, votes);
  }
};

export const getUserVotedGenres = async (): Promise<string[]> => {
  const user = getCurrentUser();
  if (!user.email) return [];
  const remoteData = await callSheetsAPI('getUserHistory', { email: user.email });
  return Array.isArray(remoteData) ? remoteData : [];
};

export const resetGenreVotes = async (): Promise<void> => {
  await callSheetsAPI('resetGenreVotes', {});
  const genres = DEFAULT_GENRES.map(name => ({ id: name, name, votes: 0 }));
  setLocal(STORAGE_KEYS.GENRE_VOTES, genres);
};

// User
export interface UserProfile {
  name: string;
  email: string;
}

export const getCurrentUser = (): UserProfile => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!data) return { name: 'Book Club Member', email: '' };
  try {
    const profile = JSON.parse(data);
    // Handle old string format
    if (typeof profile === 'string') return { name: profile, email: '' };
    return profile;
  } catch {
    return { name: data, email: '' };
  }
};

export const setCurrentUser = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
};

export const syncProfile = async (profile: UserProfile): Promise<void> => {
  await callSheetsAPI('saveProfile', {
    row: {
      email: profile.email,
      name: profile.name,
      last_active: new Date().toISOString()
    }
  });
};

export const isAdmin = async (): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user.email) return false;

  // Master admin from env
  const masterAdmin = import.meta.env.VITE_ADMIN_EMAIL;
  if (masterAdmin && user.email.toLowerCase() === masterAdmin.toLowerCase()) return true;

  // Check remote admin list
  const admins = await callSheetsAPI('getAdmins');
  if (admins && Array.isArray(admins)) {
    return admins.some((admin: any) => admin.email && admin.email.toLowerCase() === user.email.toLowerCase());
  }

  return false;
};
