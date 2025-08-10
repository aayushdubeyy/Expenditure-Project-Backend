import moment from "moment";
import * as expenseRepo from "../repository/expense.repository";
import { deleteKeysByPattern, getCache, setCache } from "../utils/redis";
import { redisKeys, redisExpiryTime } from "../redis/constants";
import * as budgetRepo from "../repository/budget.repo";
import { successResponse } from "../utils/response";
import { PrismaClient } from "../../generated/prisma";
import { kafkaProducer } from "../kafka";
import * as creditCardRepo from "../repository/creditCard.repository";
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
  // return successResponse(resp, "Monthly expenses fetched successfully");
  return resp;
};

export const addExpense = async (
  prisma: PrismaClient,
  userId: string,
  input: any
) => {
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
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const budget = await budgetRepo.findBudgetByCategory(
    prisma,
    userId,
    input.categoryId
  );

  if (budget) {
    const spent = await budgetRepo.getMonthlySpentForCategory(
      prisma,
      userId,
      input.categoryId,
      monthStart
    );
    if (spent?._sum?.amount && spent._sum.amount > budget.amount * 0.8) {
      await kafkaProducer.send({
        topic: "budget-alerts",
        messages: [
          {
            // key: userId,
            value: JSON.stringify({
              type: "budget-exceeded",
              userId,
              categoryId: input.categoryId,
              spent: spent._sum.amount,
              budget: budget.amount,
              message: `You have spent ${spent._sum.amount} in category ${input.categoryId} which exceeds 80% of your budget of ${budget.amount}.`,
            }),
          },
        ],
      });
    }
  }
  if (input.creditCardId) {
    const creditCard = await creditCardRepo.findCreditCardById(
      prisma,
      input.creditCardId
    );

    if (creditCard) {
      const usedLimit = await creditCardRepo.getMonthlySpentOnCreditCard(
        prisma,
        input.creditCardId,
        monthStart
      );

      if (
        usedLimit?._sum?.amount &&
        usedLimit._sum.amount >= creditCard.limit * 0.3
      ) {
        await kafkaProducer.send({
          topic: "alerts",
          messages: [
            {
              value: JSON.stringify({
                type: "creditCard",
                creditCardId: input.creditCardId,
                used: usedLimit._sum.amount,
                limit: creditCard.limit,
                message: `You've used ${usedLimit._sum.amount} of your credit card limit of ${creditCard.limit} which exceeds 30% and might affect your credit score.`,
              }),
            },
          ],
        });
      }
    }
  }
  await Promise.all([
    deleteKeysByPattern(`${redisKeys.MONTHLY_EXPENSES}${userId}*`),
    deleteKeysByPattern(`${redisKeys.SPEND_BREAKDOWN}${userId}*`),
    deleteKeysByPattern(`${redisKeys.TOP_CATEGORIES}${userId}*`),
    deleteKeysByPattern(`${redisKeys.TOP_PAYMENT_METHODS}${userId}*`),
  ]);

  return successResponse(newExpense, "Expense added successfully");
};
