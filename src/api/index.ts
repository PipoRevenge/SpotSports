import { AuthRepositoryImpl } from "./repositories/implementations/auth-repository-impl";
import { UserRepositoryImpl } from "./repositories/implementations/user-repository-impl";
import { IAuthRepository } from "./repositories/interfaces/i-auth-repository";
import { IUserRepository } from "./repositories/interfaces/i-user-repository";

export const userRepository: IUserRepository = new UserRepositoryImpl();
export const authRepository: IAuthRepository = new AuthRepositoryImpl();
