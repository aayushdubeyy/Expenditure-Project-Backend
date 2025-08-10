import { getSortedSetRevRange, addToSortedSet, setTTL } from "../utils/redis";
import { redisKeys, redisExpiryTime } from "../redis/constants";
import * as paymentRepo from "../repository/paymentMethod.repository";
import { errorResponse, successResponse } from "../utils/response";
import { PrismaClient } from "../../generated/prisma";

export const getTopSpendingPaymentMethods = async (
  prisma: PrismaClient,
  userId: string,
  topN: number
) => {
  const cacheKey = `${redisKeys.TOP_PAYMENT_METHODS}${userId}:${topN}`;

  const cached = await getSortedSetRevRange(cacheKey, 0, topN - 1);
  if (cached && cached.length > 0) {
    const topMethods = cached.map(entry => {
      const [name, amount] = entry.split("::");
      return { name, amount: parseFloat(amount) };
    });
    return successResponse(topMethods, "Top spending payment methods (from cache)");
  }

  const methodData = await paymentRepo.getPaymentMethodTotals(prisma, userId, topN);
  const methodIds = methodData.map((entry: any) => entry.paymentMethodId);

  const methods = await paymentRepo.getPaymentMethodsByIds(prisma, methodIds);
  const nameMap = Object.fromEntries(methods.map((m: any) => [m.id, m.name]));

  const topMethods = methodData.map((entry: any) => ({
    name: nameMap[entry.paymentMethodId] || "Unknown",
    amount: entry._sum.amount || 0
  }));

  for (const { name, amount } of topMethods) {
    await addToSortedSet(cacheKey, amount, `${name}::${amount}`);
  }
  await setTTL(cacheKey, redisExpiryTime.SEVEN_DAYS);

  return successResponse(topMethods, "Top spending payment methods fetched successfully");
};

export const addPaymentMethod = async (prisma: PrismaClient, name: string) => {
  const existing = await paymentRepo.findPaymentMethodByName(prisma, name);
  if (existing) {
    return errorResponse("Payment method already exists");
  }

  const newMethod = await paymentRepo.createPaymentMethod(prisma, { name });
  return successResponse(newMethod, "Payment method added successfully");
};
