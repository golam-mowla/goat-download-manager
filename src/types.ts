export interface ChunkProgress {
  id: number;
  start: number;
  end: number;
  downloaded: number;
  total: number;
  percent: number;
}

export type TaskStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "interrupted"
  | "completed"
  | "error"
  | "cancelled";

export interface DownloadTask {
  id: string;
  url: string;
  filename: string;
  title?: string;
  customFilename?: string;
  save_path: string;
  saveFolder?: string;
  total_bytes: number;
  downloaded_bytes: number;
  percent: number;
  speed_bytes_per_sec: number;
  speed_formatted: string;
  speed?: string;
  eta_seconds: number;
  eta_formatted: string;
  eta?: string;
  progressText?: string;
  status: TaskStatus;
  category: "all" | "video" | "audio" | "docs" | "compressed" | "programs" | string;
  connections: number;
  is_resumable: boolean;
  error?: string | null;
  created_at: number;
  createdAt?: number;
  completed_at?: number | null;
  chunks?: ChunkProgress[];
  speedHistory?: { time: string; speedKb: number }[];
  thumbnail?: string;
  container?: string;
  qualityLabel?: string;
  options?: any;
}

export interface DownloadProgress {
  percent: number;
  text?: string;
  speed?: string;
  eta?: string;
  status?: string;
}

// Media Engine (yt-dlp) types
export interface MediaStream {
  id: string;
  label: string;
  height?: number;
  fps?: number;
  ext?: string;
  vcodec?: string;
  acodec?: string;
  filesize?: string | number;
  hasAudio?: boolean;
}

export interface SubtitleTrack {
  code: string;
  name: string;
  isAuto: boolean;
}

export interface MediaInfo {
  id?: string;
  title: string;
  uploader?: string;
  duration?: number;
  thumbnail?: string;
  videoStreams: MediaStream[];
  audioStreams: MediaStream[];
  subtitles: SubtitleTrack[];
}

export type DownloadMode = "video" | "audio" | "subtitles";

export type ContainerFormat =
  | "Video (Generic)"
  | "MP4 (Video)"
  | "WEBM (Video)"
  | "MKV (Video)"
  | "MOV (Video)"
  | "AVI (Video)"
  | "Audio (Generic)"
  | "MP3 (Audio)"
  | "M4A (Audio)"
  | "OPUS (Audio)"
  | "FLAC (Audio)"
  | "WAV (Audio)"
  | "OGG (Audio)";

export const ALL_CONTAINERS: ContainerFormat[] = [
  "Video (Generic)",
  "MP4 (Video)",
  "WEBM (Video)",
  "MKV (Video)",
  "MOV (Video)",
  "AVI (Video)",
  "Audio (Generic)",
  "MP3 (Audio)",
  "M4A (Audio)",
  "OPUS (Audio)",
  "FLAC (Audio)",
  "WAV (Audio)",
  "OGG (Audio)",
];

export interface MediaDownloadOptions {
  taskId?: string;
  url: string;
  saveFolder: string;
  customFilename?: string;
  downloadMode: DownloadMode;
  container: ContainerFormat;
  videoStreamId: string;
  audioStreamId: string;
  audioBitrate: string;
  enableSubtitles: boolean;
  subtitleLang: string;
  subtitleFormat: "srt" | "vtt" | "ass" | "lrc" | "any";
  subtitleSaveMode: "separate" | "embed" | "both";
  enableClip: boolean;
  startTime: string;
  endTime: string;
  preciseCut: boolean;
  [key: string]: any;
}

export type DownloadOptions = MediaDownloadOptions;

export interface ToolVersionInfo {
  name: string;
  installedVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  isUpdating?: boolean;
}
