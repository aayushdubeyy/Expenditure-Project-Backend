export function successResponse<T>(data: T, message?: string) {
  return { success: true, data, message };
}

export function errorResponse(message: string) {
  return { success: false, message };
}

export const loginSuccessResponse = (
  token: string,
  user: any,
  message?: string
) => {
  return {
    success: true,
    message: message || "Login successful",
    token,
    user,
  };
};

export const loginErrorResponse = (message: string) => {
  return {
    success: false,
    message,
    token: null,
    user: null,
  };
};
