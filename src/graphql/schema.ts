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
    userId: ID!
    name: String!
    limit: Float!
    billCycleDay: Int!
  }

  input AddExpenseInput {
    userId: ID!
    title: String!
    amount: Float!
    categoryId: Int!
    paymentMethodId: Int!
    creditCardId: String
    date: String!
    notes: String
  }
  type Query {
    hello: String!
  }
  type Mutation {
    register(input: RegisterInput!) : UserResponse!
  AddCreditCard(input: AddCreditCardInput!) : CreditCardResponse!
  AddExpense(input: AddExpenseInput!) : ExpenseResponse!
  }
`;

export default typeDefs;
