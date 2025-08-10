export const findMonthlyExpenses = async (
  prisma: any, // Or PrismaClient if you import types
  userId: string,
  startDate: Date,
  endDate: Date,
  paymentMethodId?: number
) => {
  const whereClause: Record<string, any> = {
    userId,
    date: { gte: startDate, lte: endDate }
  };

  if (paymentMethodId) {
    whereClause.paymentMethodId = paymentMethodId;
  }

  return prisma.expense.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
    include: {
      category: true,
      paymentMethod: true,
      creditCard: true
    }
  });
};

export const createExpense = (prisma: any, data: any) => {
  return prisma.expense.create({ data });
};