export type NetworkMode = 'normal' | 'monitor';

export type ToolCategory =
  | 'reconnaissance'
  | 'scanning'
  | 'exploitation'
  | 'password'
  | 'wireless'
  | 'sniffing'
  | 'post'
  | 'forensics'
  | 'reporting';

export interface ToolParam {
  id: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'number';
  placeholder?: string;
  default?: string | boolean | number;
  options?: string[];
  required?: boolean;
  hint?: string;
}

export interface FollowUpAction {
  id: string;
  label: string;
  toolId: string;
  /** Maps a value from the parent result into a param of the follow-up tool */
  paramMapping?: Record<string, string>;
  description: string;
}

export interface KaliTool {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  icon: string;
  command: string;
  params: ToolParam[];
  /** Requires monitor mode interface */
  requiresMonitor?: boolean;
  followUps?: FollowUpAction[];
  /** estimated runtime in seconds for the simulation */
  estimatedRuntime?: number;
}

export interface ExecutionResult {
  id: string;
  toolId: string;
  toolName: string;
  command: string;
  params: Record<string, string | boolean | number>;
  output: string;
  summary: string;
  timestamp: number;
  durationMs: number;
  success: boolean;
  artifacts?: string[];
  /** Parsed targets that follow-up tools can consume */
  parsedTargets?: string[];
}

export interface ExecutionState {
  running: boolean;
  progress: number;
  currentToolId: string | null;
}
