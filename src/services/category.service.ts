import { getSortedSetRevRange, addToSortedSet, setTTL } from "../utils/redis";
import { redisKeys, redisExpiryTime } from "../redis/constants";
import * as categoryRepo from "../repository/category.repository";
import { successResponse } from "../utils/response";
import { PrismaClient } from "../../generated/prisma";

export const getTopSpendingCategories = async (
  prisma: PrismaClient,
  userId: string,
  topN: number
) => {
  const cacheKey = `${redisKeys.TOP_CATEGORIES}${userId}:${topN}`;

  const cached = await getSortedSetRevRange(cacheKey, 0, topN - 1);
  if (cached && cached.length > 0) {
    const topCategories = cached.map((entry) => {
      const [name, amount] = entry.split("::");
      return { name, amount: parseFloat(amount) };
    });
    return topCategories;
  }

  const categoryData = await categoryRepo.getCategoryTotals(
    prisma,
    userId,
    topN
  );
  const categoryIds = categoryData.map((c: any) => c.categoryId);

  const categories = await categoryRepo.getCategoriesByIds(prisma, categoryIds);
  const nameMap = Object.fromEntries(
    categories.map((c: any) => [c.id, c.name])
  );

  const topCategories = categoryData.map((entry: any) => ({
    name: nameMap[entry.categoryId] || "Unknown",
    amount: entry._sum.amount || 0,
  }));

  for (const { name, amount } of topCategories) {
    await addToSortedSet(cacheKey, amount, `${name}::${amount}`);
  }
  await setTTL(cacheKey, redisExpiryTime.SEVEN_DAYS);

  return successResponse(topCategories, "Top spending categories fetched successfully");
};

export const addCategory = async (prisma: PrismaClient, name: string) => {
  const existing = await categoryRepo.findCategoryByName(prisma, name);
  if (existing) {
    return { success: false, message: "Category already exists" };
  }

  const newCategory = await categoryRepo.createCategory(prisma, { name });
  return successResponse(newCategory, "Category added successfully");
};
