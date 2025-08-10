import { gql } from "apollo-server";

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }
  type CreditCard {
    id: ID!
    name: String!
    limit: Float!
    billCycleDay: Int!
  }
  type Expense {
    id: ID!
    title: String!
    amount: Float!
    date: String!
  }
  type GetExpenseOutput {
    success: Boolean!
    data: [Expense!]!
    message: String
  }
  type UserResponse {
    success: Boolean!
    message: String
    data: User
  }

  type CreditCardResponse {
    success: Boolean!
    message: String
    data: CreditCard
  }

  type ExpenseResponse {
    success: Boolean!
    message: String
    data: Expense
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }
  input AddCreditCardInput {
    # userId: ID!
    name: String!
    limit: Float!
    billCycleDay: Int!
  }

  input AddExpenseInput {
    # userId: ID!
    title: String!
    amount: Float!
    categoryId: Int!
    paymentMethodId: Int!
    creditCardId: String
    date: String!
    notes: String
  }
  input ExpensesFilterInput {
    month: Int
    year: Int
    paymentMethodId: Int
  }
  type TopSpendingCategory {
  name: String!
  amount: Float!
}
  type Query {
    getMonthlyExpenses(filter: ExpensesFilterInput): [Expense!]!
    getSpendBreakdown(filter: YearFilterInput!): SpendBreakdownResponse!
    getTopSpendingCategories(topN: Int!): [TopSpendingCategory!]!
    getTopSpendingPaymentMethods(topN: Int!): [TopSpendingCategory!]!
  }
  input LoginInput {
    email: String!
    password: String!
  }

  type AuthResponse {
    success: Boolean!
    message: String
    token: String
    user: User
  }
  input AddCategoryInput {
    name: String!
  }

  input AddPaymentMethodInput {
    name: String!
  }
  type Category {
    id: ID!
    name: String!
  }

  type PaymentMethod {
    id: ID!
    name: String!
  }

  type CategoryResponse {
    success: Boolean!
    message: String
    data: Category
  }

  type PaymentMethodResponse {
    success: Boolean!
    message: String
    data: PaymentMethod
  }
  input YearFilterInput {
    year: Int!
  }
  type CategorySpend {
    month: Int
    categoryName: String!
    percent: Float!
  }
  type MethodSpend {
    month: Int
    methodName: String!
    percent: Float!
  }
  type YearlyCategorySpend {
    categoryName: String!
    percent: Float!
  }
  type YearlyMethodSpend {
    methodName: String!
    percent: Float!
  }
  type SpendBreakdownResponse {
    success: Boolean!
    message: String
    monthlyCategoryBreakdown: [CategorySpend!]!
    monthlyMethodBreakdown: [MethodSpend!]!
    yearlyCategoryBreakdown: [YearlyCategorySpend!]!
    yearlyMethodBreakdown: [YearlyMethodSpend!]!
  }
  type Mutation {
    register(input: RegisterInput!): AuthResponse!
    login(input: LoginInput!): AuthResponse!
    AddCreditCard(input: AddCreditCardInput!): CreditCardResponse!
    AddExpense(input: AddExpenseInput!): ExpenseResponse!
    AddCategory(input: AddCategoryInput!): CategoryResponse!
    AddPaymentMethod(input: AddPaymentMethodInput!): PaymentMethodResponse!
  }
`;

export default typeDefs;
