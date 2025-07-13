export const requireAuth = (user: any) => {
  if (!user) {
    throw new Error("Authentication required");
    // dont use throw new Error("Authentication required") in production, use a custom error handler
  }
  return user;
};
