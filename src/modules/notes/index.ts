export { notesApi } from './api/notesApi';
export { useAudioRecorder } from './hooks/useAudioRecorder';
export { NoteCreator } from './components/NoteCreator';
export { NoteCard } from './components/NoteCard';
export { NoteFilters } from './components/NoteFilters';
export { AudioPlayer } from './components/AudioPlayer';
export { NoteToolbar } from './components/NoteToolbar';
export { NoteEditor } from './components/NoteEditor';
export { NoteSidebar } from './components/NoteSidebar';
export type { SidebarView } from './components/NoteSidebar';

export type {
    NoteListItemDto,
    NoteDetailsDto,
    NoteStatus,
    NoteSourceType,
    NoteCategory
} from './types/notesTypes';