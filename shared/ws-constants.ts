export const WS_ACTION = {
  CHECK_AUTH_STATUS: 'check_auth_status',
  INITIATE_AUTH: 'initiate_auth',
  SUBMIT_AUTH_CODE: 'submit_auth_code',
  CANCEL_AUTH: 'cancel_auth',
  REAUTHENTICATE: 'reauthenticate',
  LOGOUT: 'logout',
  SEND_CHAT_MESSAGE: 'send_chat_message',
  QUEUE_MESSAGE: 'queue_message',
  SUBMIT_STORY: 'submit_story',
  GET_MODEL: 'get_model',
  SET_MODEL: 'set_model',
  INTERRUPT_AGENT: 'interrupt_agent',
  SEND_GROUP_MESSAGE: 'send_group_message',
} as const;


export const WS_EVENT = {
  AUTH_STATUS: 'auth_status',
  AUTH_URL_GENERATED: 'auth_url_generated',
  AUTH_DEVICE_CODE: 'auth_device_code',
  AUTH_MANUAL_TOKEN: 'auth_manual_token',
  AUTH_SUCCESS: 'auth_success',
  LOGOUT_OUTPUT: 'logout_output',
  LOGOUT_SUCCESS: 'logout_success',
  ERROR: 'error',
  MESSAGE: 'message',
  STREAM_START: 'stream_start',
  STREAM_CHUNK: 'stream_chunk',
  STREAM_END: 'stream_end',
  MODEL_UPDATED: 'model_updated',
  REASONING_START: 'reasoning_start',
  REASONING_CHUNK: 'reasoning_chunk',
  REASONING_END: 'reasoning_end',
  THINKING_STEP: 'thinking_step',
  TOOL_CALL: 'tool_call',
  FILE_CREATED: 'file_created',
  ACTIVITY_SNAPSHOT: 'activity_snapshot',
  ACTIVITY_APPENDED: 'activity_appended',
  ACTIVITY_UPDATED: 'activity_updated',
  PLAYGROUND_CHANGED: 'playground_changed',
  QUEUE_UPDATED: 'queue_updated',
  AGENT_MODE_UPDATED: 'agent_mode_updated',
  GROUP_AGENTS_UPDATED: 'group_agents_updated',
  GROUP_AGENT_STREAM_START: 'group_agent_stream_start',
  GROUP_AGENT_STREAM_CHUNK: 'group_agent_stream_chunk',
  GROUP_AGENT_STREAM_END: 'group_agent_stream_end',
  GROUP_AGENT_MESSAGE: 'group_agent_message',
} as const;


export const AUTH_STATUS = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
} as const;

export const ERROR_CODE = {
  NEED_AUTH: 'NEED_AUTH',
  AGENT_BUSY: 'AGENT_BUSY',
  BLOCKED: 'BLOCKED',
} as const;

export const WS_CLOSE = {
  ANOTHER_SESSION_ACTIVE: 4000,
  UNAUTHORIZED: 4001,
  SESSION_TAKEN_OVER: 4002,
} as const;
