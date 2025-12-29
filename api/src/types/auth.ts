export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  code: string;
  newPassword: string;
}

export interface VerifyCodeRequest {
  code: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  message: string;
  userId: number;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyCodeResponse {
  message: string;
}