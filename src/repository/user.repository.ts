export const findUserByEmail = (prisma: any, email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const createUser = (prisma: any, data: any) => {
  return prisma.user.create({ data });
};
