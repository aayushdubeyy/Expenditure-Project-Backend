import moment from "moment";
import { Context } from "../../context";
import { requireAuth } from "../../middlewares/auth";
import { generateToken } from "../../utils/jwt";
import * as utils from "../../utils/response";
import * as typescriptTypes from "../interface";
import bcrypt from "bcrypt";
import { getSpendBreakdown } from "../../services/expenditure/spendBreakdown.service";
import { redisExpiryTime, redisKeys } from "../../redis/constants";
import {
  addToSortedSet,
  deleteKeysByPattern,
  getCache,
  getSortedSetRevRange,
  setCache,
  setTTL,
} from "../../utils/redis";

export default {
  Query: {
    getMonthlyExpenses: async (
      _: any,
      { filter }: typescriptTypes.ExpensesFilterInput,
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      const now = moment();
      const month = filter?.month || now.month() + 1;
      const year = filter?.year || now.year();

      const startDate = moment(`${year}-${month}-01`).startOf("month").toDate();
      const endDate = moment(startDate).endOf("month").toDate();

      const key =
        redisKeys.MONTHLY_EXPENSES +
        `${user?.id}:${year}:${month}:${filter?.paymentMethodId || "all"}`;
      let expenses = await getCache(key);
      if (!expenses) {
        const whereClause: any = {
          userId: authUser.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        };

        if (filter?.paymentMethodId) {
          whereClause.paymentMethodId = filter.paymentMethodId;
        }
        // Todo: Create repository folders for all the DB calls
        expenses = await prisma.expense.findMany({
          where: whereClause,
          orderBy: {
            date: "desc",
          },
          include: {
            category: true,
            paymentMethod: true,
            creditCard: true,
          },
        });
        await setCache(key, expenses, redisExpiryTime.SEVEN_DAYS);
      }

      return expenses.map((expense: any) => ({
        ...expense,
        date: moment(expense.date).format("YYYY-MM-DD"),
      }));
    },
    getSpendBreakdown: async (
      _: any,
      { filter }: { filter: { year: number } },
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      try {
        const key = redisKeys.SPEND_BREAKDOWN + `${user?.id}:${filter?.year}`;
        let cached = await getCache(key);
        cached = JSON.parse(cached);
        if (cached) return { success: true, message: "from cache", ...cached };

        const data = await getSpendBreakdown(authUser.id, filter?.year);
        await setCache(key, JSON.stringify(data), redisExpiryTime.SEVEN_DAYS);
        return {
          success: true,
          message: "Spend breakdown fetched successfully",
          ...data,
        };
      } catch (error) {
        console.error(error);
        // Todo: use a normal errorResponse
        return {
          success: false,
          message: "Failed to fetch spend breakdown",
          monthlyCategoryBreakdown: [],
          monthlyMethodBreakdown: [],
          yearlyCategoryBreakdown: [],
          yearlyMethodBreakdown: [],
        };
      }
    },
    getTopSpendingCategories: async (
      _: any,
      { topN }: { topN: number },
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      try {
        const key = redisKeys.TOP_CATEGORIES + `${user?.id}:${topN}`;
        const cached = await getSortedSetRevRange(key, 0, topN - 1);
        if (cached && cached.length > 0) {
          const topCategories = cached.map((entry) => {
            const [name, amount] = entry.split("::");
            return { name, amount: parseFloat(amount) };
          });
          return utils.successResponse(
            topCategories,
            "Top spending categories (from cache)"
          );
        }
        const categoryData = await prisma.expense.groupBy({
          by: ["categoryId"],
          where: { userId: user?.id },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
          take: topN,
        });

        const categoryIds = categoryData.map((c) => c.categoryId);

        const categories = await prisma.category.findMany({
          where: { id: { in: categoryIds } },
        });

        const nameMap = Object.fromEntries(
          categories.map((c) => [c.id, c.name])
        );

        const topCategories = categoryData.map((entry) => ({
          name: nameMap[entry.categoryId] || "Unknown",
          amount: entry._sum.amount || 0,
        }));
        for (const { name, amount } of topCategories) {
          await addToSortedSet(key, amount, `${name}::${amount}`);
        }
        await setTTL(key, redisExpiryTime.SEVEN_DAYS);
        return utils.successResponse(
          topCategories,
          "Top spending categories fetched successfully"
        );
      } catch (error) {}
    },
    getTopSpendingPaymentMethods: async (
      _: any,
      { topN }: { topN: number },
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      const key = redisKeys.TOP_PAYMENT_METHODS + `${user?.id}:${topN}`;

      try {
        const cached = await getSortedSetRevRange(key, 0, topN - 1);
        if (cached.length > 0) {
          const topMethods = cached.map((entry) => {
            const [name, amount] = entry.split("::");
            return { name, amount: parseFloat(amount) };
          });

          return utils.successResponse(
            topMethods,
            "Top spending payment methods (from cache)"
          );
        }

        const methodData = await prisma.expense.groupBy({
          by: ["paymentMethodId"],
          where: { userId: user?.id },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
          take: topN,
        });

        const methodIds = methodData.map((entry) => entry.paymentMethodId);

        const methods = await prisma.paymentMethod.findMany({
          where: { id: { in: methodIds } },
        });

        const nameMap = Object.fromEntries(methods.map((m) => [m.id, m.name]));

        const topMethods = methodData.map((entry) => {
          const name = nameMap[entry.paymentMethodId] || "Unknown";
          const amount = entry._sum.amount || 0;
          return { name, amount };
        });

        for (const { name, amount } of topMethods) {
          await addToSortedSet(key, amount, `${name}::${amount}`);
        }

        return utils.successResponse(
          topMethods,
          "Top spending payment methods (from DB)"
        );
      } catch (error) {
        console.error(error);
        return utils.errorResponse(
          "Failed to fetch top spending payment methods"
        );
      }
    },
  },
  Mutation: {
    AddCreditCard: async (
      _: any,
      { input }: typescriptTypes.AddCreditCardInput,
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      const { name, limit, billCycleDay } = input;
      const newCard = await prisma.creditCard.create({
        data: {
          userId: authUser.id,
          name,
          limit,
          billCycleDay,
        },
      });
      return utils.successResponse(newCard, "Credit card added successfully");
    },
    AddExpense: async (
      _: any,
      { input }: typescriptTypes.AddExpenseInput,
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      console.log("Adding expense for user:", authUser.id);
      const {
        title,
        amount,
        categoryId,
        paymentMethodId,
        creditCardId,
        date,
        notes,
      } = input;
      const newExpense = await prisma.expense.create({
        data: {
          userId: authUser.id,
          title,
          amount,
          categoryId,
          paymentMethodId,
          creditCardId,
          date: new Date(date),
          notes,
        },
      });
      await deleteKeysByPattern(redisKeys.MONTHLY_EXPENSES + `${user?.id}*`);
      await deleteKeysByPattern(redisKeys.SPEND_BREAKDOWN + `${authUser.id}*`);
      await deleteKeysByPattern(redisKeys.TOP_CATEGORIES + `${user?.id}*`);
      await deleteKeysByPattern(redisKeys.TOP_PAYMENT_METHODS + `${user?.id}*`);
      return utils.successResponse(newExpense, "Expense added successfully");
    },
    register: async (
      _: any,
      { input }: typescriptTypes.RegisterInput,
      { prisma }: Context
    ) => {
      const { name, email, password } = input;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return utils.loginErrorResponse("User already exists");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });
      const token = generateToken({ id: user.id, email: user.email });
      return utils.loginSuccessResponse(token, {
        id: user.id,
        email: user.email,
      });
    },
    login: async (
      _: any,
      { input }: typescriptTypes.LoginInput,
      { prisma }: Context
    ) => {
      const { email, password } = input;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return utils.loginErrorResponse("User not found");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return utils.loginErrorResponse("Invalid password");
      }
      const token = generateToken({ id: user.id, email: user.email });
      return utils.loginSuccessResponse(token, {
        id: user.id,
        email: user.email,
      });
    },
    AddCategory: async (
      _: any,
      { input }: typescriptTypes.AddCategoryInput,
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      const { name } = input;

      const existing = await prisma.category.findUnique({ where: { name } });
      if (existing) {
        return utils.errorResponse("Category already exists");
      }

      const newCategory = await prisma.category.create({
        data: {
          name,
        },
      });
      return utils.successResponse(newCategory, "Category added successfully");
    },

    AddPaymentMethod: async (
      _: any,
      { input }: typescriptTypes.AddPaymentMethodInput,
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      const { name } = input;

      const existing = await prisma.paymentMethod.findUnique({
        where: { name },
      });
      if (existing) {
        return utils.errorResponse("Payment method already exists");
      }

      const newMethod = await prisma.paymentMethod.create({
        data: {
          name,
        },
      });
      return utils.successResponse(
        newMethod,
        "Payment method added successfully"
      );
    },
  },
};
