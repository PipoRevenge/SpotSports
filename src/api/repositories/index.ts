import { AuthRepositoryImpl } from "./implementations/auth-repository-impl";
import { ChatRepositoryImpl } from './implementations/chat-repository-impl';
import { commentRepository } from './implementations/comment-repository-impl';
import { discussionRepository } from './implementations/discussion-repository-impl';
import { MeetupRepositoryImpl } from "./implementations/meetup-repository-impl";
import { ReviewRepositoryImpl } from "./implementations/review-repository-impl";
import { SportRepositoryImpl } from "./implementations/sport-repository-impl";
import { SpotRepositoryImpl } from "./implementations/spot-repository-impl";
import { UserRepositoryImpl } from "./implementations/user-repository-impl";
import { IAuthRepository } from "./interfaces/i-auth-repository";
import { IChatRepository } from "./interfaces/i-chat-repository";
import { IMeetupRepository } from "./interfaces/i-meetup-repository";
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
export const chatRepository: IChatRepository = new ChatRepositoryImpl();
export const spotRepository: ISpotRepository = new SpotRepositoryImpl();
export const sportRepository: ISportRepository = new SportRepositoryImpl();
export const reviewRepository: IReviewRepository = new ReviewRepositoryImpl();
export const meetupRepository: IMeetupRepository = new MeetupRepositoryImpl();
export { commentRepository, discussionRepository };
// voteRepository is internal - use specific repository methods instead:
// - reviewRepository.voteReview/removeReviewVote/getReviewVote
// - discussionRepository.voteDiscussion/removeDiscussionVote/getDiscussionVote
// - commentRepository.voteComment/removeCommentVote/getCommentVote
// relationshipRepository removed: relationship logic migrated into userRepository
