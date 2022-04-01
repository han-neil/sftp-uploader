export interface PointLog {
  (text: string, type?:string): void
}
export interface ProgressBar {
  (description: string, bar_length:number): Function
}
export interface ProgressOpt {
  completed: number, 
  total: number
}

export interface SftpUploaderParm {
  dir: string
  url: string
  host: string
  port: string
  username: string
  password: string
  uploadFilter: Function
  deleteFilter: Function
  delay?: number
  previewPath?: string
}

export interface ConnectConfig {
  host: string
  port: string
  username: string
  password: string
}