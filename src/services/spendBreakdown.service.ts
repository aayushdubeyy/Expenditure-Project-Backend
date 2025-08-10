
import { PrismaClient } from "../../generated/prisma";

export const getSpendBreakdown = async (prisma: PrismaClient, userId: string, year: number) => {
  const monthlyCategoryBreakdown: any[] = [];
  const monthlyMethodBreakdown: any[] = [];

  for (let month = 1; month <= 12; month++) {
    const start = new Date(`${year}-${month}-01`);
    const end =
      month === 12
        ? new Date(`${year + 1}-01-01`)
        : new Date(`${year}-${month + 1}-01`);
    const monthlyExpenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
      include: {
        category: true,
        paymentMethod: true,
      },
    });

    const totalMonthly = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const catMap: Record<string, number> = {};
    const methodMap: Record<string, number> = {};

    monthlyExpenses.forEach((e) => {
      catMap[e.category.name] = (catMap[e.category.name] || 0) + e.amount;
      methodMap[e.paymentMethod.name] =
        (methodMap[e.paymentMethod.name] || 0) + e.amount;
    });

    for (const categoryName in catMap) {
      monthlyCategoryBreakdown.push({
        month,
        categoryName,
        percent: (catMap[categoryName] / totalMonthly) * 100,
      });
    }

    for (const methodName in methodMap) {
      monthlyMethodBreakdown.push({
        month,
        methodName,
        percent: (methodMap[methodName] / totalMonthly) * 100,
      });
    }
  }

  const yearlyExpenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
    include: {
      category: true,
      paymentMethod: true,
    },
  });

  const totalYearly = yearlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const yearlyCategoryBreakdown: any[] = [];
  const yearlyMethodBreakdown: any[] = [];

  const catYearMap: Record<string, number> = {};
  const methodYearMap: Record<string, number> = {};

  yearlyExpenses.forEach((e) => {
    catYearMap[e.category.name] = (catYearMap[e.category.name] || 0) + e.amount;
    methodYearMap[e.paymentMethod.name] =
      (methodYearMap[e.paymentMethod.name] || 0) + e.amount;
  });

  for (const categoryName in catYearMap) {
    yearlyCategoryBreakdown.push({
      categoryName,
      percent: (catYearMap[categoryName] / totalYearly) * 100,
    });
  }

  for (const methodName in methodYearMap) {
    yearlyMethodBreakdown.push({
      methodName,
      percent: (methodYearMap[methodName] / totalYearly) * 100,
    });
  }

  return {
    monthlyCategoryBreakdown,
    monthlyMethodBreakdown,
    yearlyCategoryBreakdown,
    yearlyMethodBreakdown,
  };
};
