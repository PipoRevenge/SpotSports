import { AuthRepositoryImpl } from "./implementations/auth-repository-impl";
import { ReviewRepositoryImpl } from "./implementations/review-repository-impl";
import { SportRepositoryImpl } from "./implementations/sport-repository-impl";
import { SpotRepositoryImpl } from "./implementations/spot-repository-impl";
import { UserRepositoryImpl } from "./implementations/user-repository-impl";
import { IAuthRepository } from "./interfaces/i-auth-repository";
import { IReviewRepository } from "./interfaces/i-review-repository";
import { ISportRepository } from "./interfaces/i-sport-repository";
import { ISpotRepository } from "./interfaces/i-spot-repository";
import { IUserRepository } from "./interfaces/i-user-repository";

// 🔥 MIGRACIÓN A CLOUD FUNCTIONS
// Cambia entre UserRepositoryImpl (cliente) y UserRepositoryCloud (funciones cloud)
// Para migrar: descomentar UserRepositoryCloud y comentar UserRepositoryImpl

// Versión ACTUAL (cliente directo a Firestore) - ✅ FUNCIONANDO
export const userRepository: IUserRepository = new UserRepositoryImpl();

// Versión CON CLOUD FUNCTIONS - ⚠️ Requiere desplegar funciones primero
// export const userRepository: IUserRepository = new UserRepositoryCloud();

export const authRepository: IAuthRepository = new AuthRepositoryImpl();
export const spotRepository: ISpotRepository = new SpotRepositoryImpl();
export const sportRepository: ISportRepository = new SportRepositoryImpl();
export const reviewRepository: IReviewRepository = new ReviewRepositoryImpl();
