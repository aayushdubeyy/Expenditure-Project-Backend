import moment from "moment";
import { Context } from "../../context";
import { requireAuth } from "../../middlewares/auth";
import { generateToken } from "../../utils/jwt";
import * as utils from "../../utils/response";
import * as typescriptTypes from "../interface";
import bcrypt from "bcrypt";
import { getSpendBreakdown } from "../../services/expenditure/spendBreakdown.service";

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
      const expenses = await prisma.expense.findMany({
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
      return expenses.map((expense) => ({
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
        const data = await getSpendBreakdown(authUser.id, filter?.year);
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
