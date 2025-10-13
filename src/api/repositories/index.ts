import { AuthRepositoryImpl } from "./implementations/auth-repository-impl";
import { UserRepositoryImpl } from "./implementations/user-repository-impl";
import { IAuthRepository } from "./interfaces/i-auth-repository";
import { IUserRepository } from "./interfaces/i-user-repository";

export const userRepository: IUserRepository = new UserRepositoryImpl();
export const authRepository: IAuthRepository = new AuthRepositoryImpl();
