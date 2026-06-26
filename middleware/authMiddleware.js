import jwt from "jsonwebtoken";
import responseError from "../helpers/responseError.js";

const authMiddleware = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return responseError(
        res,
        "No token provided",
        401
      );
    }

    const token =
      authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env
        .JWT_ACCESS_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    return responseError(
      res,
      "Invalid or expired token",
      401
    );
  }
};

export default authMiddleware;