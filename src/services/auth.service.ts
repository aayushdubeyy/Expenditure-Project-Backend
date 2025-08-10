import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";
import * as userRepo from "../repository/user.repository";
import { PrismaClient } from "../../generated/prisma";
import { loginErrorResponse, loginSuccessResponse } from "../utils/response";

export const register = async (prisma: PrismaClient, input: any) => {
  const { name, email, password } = input;
  const existingUser = await userRepo.findUserByEmail(prisma, email);
  if (existingUser) {
    return loginErrorResponse("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepo.createUser(prisma, {
    name,
    email,
    password: hashedPassword,
  });

  const token = generateToken({ id: user.id, email: user.email });
  return loginSuccessResponse(token, user, "Registration successful");
};

export const login = async (prisma: PrismaClient, input: any) => {
  const { email, password } = input;
  const user = await userRepo.findUserByEmail(prisma, email);
  if (!user) {
    return loginErrorResponse("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return loginErrorResponse("Invalid password");
  }

  const token = generateToken({ id: user.id, email: user.email });
  return loginSuccessResponse(token, user, "Login successful");
};
