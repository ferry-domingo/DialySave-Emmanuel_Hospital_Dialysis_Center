import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production.");
  }
  return secret || "dialysave-secret";
};

export const generateTemporaryPassword = (lastName, birthdate) => {
  const date = new Date(birthdate);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const normalizedLastName = String(lastName || "")
    .replace(/\s+/g, "")
    .trim();
  const formattedLastName =
    normalizedLastName.charAt(0).toUpperCase() +
    normalizedLastName.slice(1).toLowerCase();

  return `${formattedLastName}${month}${day}${year}`;
};

export const createAuthToken = (payload, expiresIn = "8h") => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

export const verifyAuthToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
