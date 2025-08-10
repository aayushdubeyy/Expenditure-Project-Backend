export const createCreditCard = (prisma: any, data: any) => {
  return prisma.creditCard.create({ data });
};
export const findCreditCardById = (prisma: any, creditCardId: number) => {
  return prisma.creditCard.findUnique({ where: { id: creditCardId } });
};

export const getMonthlySpentOnCreditCard = (
  prisma: any,
  creditCardId: number,
  monthStart: Date
) => {
  return prisma.expense.aggregate({
    where: {
      creditCardId,
      date: { gte: monthStart }
    },
    _sum: { amount: true }
  });
};
