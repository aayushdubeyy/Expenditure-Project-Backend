import moment from "moment";
import * as expenseRepo from "../repository/expense.repository";
import { deleteKeysByPattern, getCache, setCache } from "../utils/redis";
import { redisKeys, redisExpiryTime } from "../redis/constants";
import { successResponse } from "../utils/response";
import { PrismaClient } from "../../generated/prisma";

export const getMonthlyExpenses = async (
  prisma: PrismaClient,
  userId: string,
  filter:
    | { month?: number; year?: number; paymentMethodId?: number }
    | undefined
) => {
  const now = moment();
  const month = filter?.month || now.month() + 1;
  const year = filter?.year || now.year();

  const startDate = moment(`${year}-${month}-01`).startOf("month").toDate();
  const endDate = moment(startDate).endOf("month").toDate();

  const cacheKey = `${redisKeys.MONTHLY_EXPENSES}${userId}:${year}:${month}:${
    filter?.paymentMethodId || "all"
  }`;
  let expenses = await getCache(cacheKey);

  if (!expenses) {
    expenses = await expenseRepo.findMonthlyExpenses(
      prisma,
      userId,
      startDate,
      endDate,
      filter?.paymentMethodId
    );
    await setCache(cacheKey, expenses, redisExpiryTime.SEVEN_DAYS);
  }
  const resp = expenses.map((expense: any) => ({
    ...expense,
    date: moment(expense.date).format("YYYY-MM-DD"),
  }));
  return successResponse(resp, "Monthly expenses fetched successfully");
};

export const addExpense = async (prisma: PrismaClient, userId: string, input: any) => {
  const newExpense = await expenseRepo.createExpense(prisma, {
    userId,
    title: input.title,
    amount: input.amount,
    categoryId: input.categoryId,
    paymentMethodId: input.paymentMethodId,
    creditCardId: input.creditCardId,
    date: new Date(input.date),
    notes: input.notes,
  });

  await Promise.all([
    deleteKeysByPattern(`${redisKeys.MONTHLY_EXPENSES}${userId}*`),
    deleteKeysByPattern(`${redisKeys.SPEND_BREAKDOWN}${userId}*`),
    deleteKeysByPattern(`${redisKeys.TOP_CATEGORIES}${userId}*`),
    deleteKeysByPattern(`${redisKeys.TOP_PAYMENT_METHODS}${userId}*`),
  ]);

  return successResponse(newExpense, "Expense added successfully");
};
