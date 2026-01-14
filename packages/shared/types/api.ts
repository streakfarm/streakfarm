export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiMeta {
  timestamp: string;
  request_id?: string;
  page?: number;
  per_page?: number;
  total?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Request types
export interface LoginRequest {
  init_data: string;
}

export interface CheckinRequest {
  telegram_id: number;
}

export interface OpenBoxRequest {
  box_id: string;
}

export interface CompleteTaskRequest {
  task_id: string;
  verification_data?: any;
}

export interface ConnectWalletRequest {
  wallet_address: string;
  proof: any;
}
