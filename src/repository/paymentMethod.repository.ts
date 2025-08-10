export const getPaymentMethodTotals = async (prisma: any, userId: string, topN: number) => {
  return prisma.expense.groupBy({
    by: ["paymentMethodId"],
    where: { userId },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: topN
  });
};

export const getPaymentMethodsByIds = async (prisma: any, ids: number[]) => {
  return prisma.paymentMethod.findMany({
    where: { id: { in: ids } }
  });
};

export const findPaymentMethodByName = (prisma: any, name: string) => {
  return prisma.paymentMethod.findUnique({ where: { name } });
};

export const createPaymentMethod = (prisma: any, data: any) => {
  return prisma.paymentMethod.create({ data });
};
