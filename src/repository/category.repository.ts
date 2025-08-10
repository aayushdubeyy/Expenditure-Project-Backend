export const getCategoryTotals = async (prisma: any, userId: string, topN: number) => {
  return prisma.expense.groupBy({
    by: ["categoryId"],
    where: { userId },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: topN
  });
};

export const getCategoriesByIds = async (prisma: any, categoryIds: number[]) => {
  return prisma.category.findMany({
    where: { id: { in: categoryIds } }
  });
};

export const findCategoryByName = (prisma: any, name: string) => {
  return prisma.category.findUnique({ where: { name } });
};

export const createCategory = (prisma: any, data: any) => {
  return prisma.category.create({ data });
};
