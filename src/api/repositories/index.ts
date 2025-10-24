import { AuthRepositoryImpl } from "./implementations/auth-repository-impl";
import { SportRepositoryImpl } from "./implementations/sport-repository-impl";
import { SpotRepositoryImpl } from "./implementations/spot-repository-impl";
import { UserRepositoryImpl } from "./implementations/user-repository-impl";
import { IAuthRepository } from "./interfaces/i-auth-repository";
import { ISportRepository } from "./interfaces/i-sport-repository";
import { ISpotRepository } from "./interfaces/i-spot-repository";
import { IUserRepository } from "./interfaces/i-user-repository";

export const userRepository: IUserRepository = new UserRepositoryImpl();
export const authRepository: IAuthRepository = new AuthRepositoryImpl();
export const spotRepository: ISpotRepository = new SpotRepositoryImpl();
export const sportRepository: ISportRepository = new SportRepositoryImpl();
