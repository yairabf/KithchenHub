export class ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;

  constructor(data?: T, message?: string) {
    this.success = true;
    this.data = data;
    this.message = message;
  }

  static success<T>(data?: T, message?: string): ApiResponse<T> {
    return new ApiResponse(data, message);
  }

  static error(error: string): ApiResponse<never> {
    return {
      success: false,
      error,
    };
  }
}
