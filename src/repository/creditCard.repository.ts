export const createCreditCard = (prisma: any, data: any) => {
  return prisma.creditCard.create({ data });
};