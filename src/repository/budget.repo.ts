export const findBudgetByCategory = (prisma: any, userId: string, categoryId: number) => {
  return prisma.budget.findFirst({
    where: { userId, categoryId }
  });
};

export const getMonthlySpentForCategory = (
  prisma: any,
  userId: string,
  categoryId: number,
  monthStart: Date
) => {
  return prisma.expense.aggregate({
    where: {
      userId,
      categoryId,
      date: { gte: monthStart }
    },
    _sum: { amount: true }
  });
};
