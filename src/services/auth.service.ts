import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";
import * as userRepo from "../repository/user.repository";

export const register = async (prisma: any, input: any) => {
  const { name, email, password } = input;
  const existingUser = await userRepo.findUserByEmail(prisma, email);
  if (existingUser) {
    return { success: false, message: "User already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepo.createUser(prisma, {
    name,
    email,
    password: hashedPassword,
  });

  const token = generateToken({ id: user.id, email: user.email });
  return {
    success: true,
    message: "Registration successful",
    token,
    user: { id: user.id, email: user.email },
  };
};

export const login = async (prisma: any, input: any) => {
  const { email, password } = input;
  const user = await userRepo.findUserByEmail(prisma, email);
  if (!user) {
    return { success: false, message: "User not found" };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return { success: false, message: "Invalid password" };
  }

  const token = generateToken({ id: user.id, email: user.email });
  return {
    success: true,
    message: "Login successful",
    token,
    user: { id: user.id, email: user.email },
  };
};
