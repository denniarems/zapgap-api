export interface LangFlowResponse {
  session_id: string;
  outputs: LangFlowResponseOutput[];
}

export interface LangFlowResponseOutput {
  inputs: Inputs;
  outputs: OutputOutput[];
}

export interface Inputs {
  input_value: string;
}

export interface OutputOutput {
  results: Results;
  artifacts: Artifacts;
  outputs: Outputs;
  logs: Logs;
  messages: MessageElement[];
  timedelta: null;
  duration: null;
  component_display_name: string;
  component_id: string;
  used_frozen_result: boolean;
}

export interface Artifacts {
  message: string;
  sender: string;
  sender_name: string;
  files: any[];
  type: string;
}

export interface Logs {
  message: any[];
}

export interface MessageElement {
  message: string;
  sender: string;
  sender_name: string;
  session_id: string;
  stream_url: null;
  component_id: string;
  files: any[];
  type: Type;
}

export enum Type {
  Text = "text",
}

export interface Outputs {
  message: OutputsMessage;
}

export interface OutputsMessage {
  message: string;
  type: Type;
}

export interface Results {
  message: DataClass;
}

export interface DataClass {
  text_key?: Type;
  data?: DataClass;
  default_value?: string;
  text: string;
  sender: string;
  sender_name: string;
  files: any[];
  session_id: string;
  timestamp: Date;
  flow_id: string;
  error: boolean;
  edit: boolean;
  properties: Properties;
  category: string;
  content_blocks: ContentBlock[];
  id?: string;
}

export interface ContentBlock {
  title: string;
  contents: ContentBlockContent[];
  allow_markdown: boolean;
  media_url: null;
}

export interface ContentBlockContent {
  type: string;
  duration: number;
  header: Header;
  text?: string;
  name?: string;
  tool_input?: ToolInput;
  output?: ContentOutput;
  error?: null;
}

export interface Header {
  title: string;
  icon: string;
}

export interface ContentOutput {
  meta: null;
  content: OutputContent[];
  isError: boolean;
}

export interface OutputContent {
  type: Type;
  text: string;
}

export interface ToolInput {
  search_phrase: string;
  limit: number;
}

export interface Properties {
  text_color: string;
  background_color: string;
  edited: boolean;
  source: Source;
  icon: string;
  allow_markdown: boolean;
  positive_feedback: null;
  state: string;
  targets: any[];
}

export interface Source {
  id: string;
  display_name: string;
  source: string;
}
