export const requireAuth = (
  user: { id: string; email: string } | undefined
) => {
  if (!user) {
    throw new Error("Authentication required");
    // dont use throw new Error("Authentication required") in production, use a custom error handler
  }
  return user;
};
