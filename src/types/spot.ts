export interface Spot {
    id: string;
    name: string;
    description?: string;
    imagesUrl: string[];
    rating: number;
    createdAt?: Date;
    updatedAt?: Date;
    reviews?: Review[];
    sportsReviewed?: SportDetail[];
    location?: GeoPoint;
    foro: string;
    
}
export interface SportDetail {
    id: string;
    iconUrl?: string;
    name: string;
    description: string;
    difficultyLevel: number;
    reviewsCount?: number;
    rating?: number;
}
export interface Review {
    userId: string;
    spotId: string;
    sportName: string;
    comment: string;
    imagesUrl?: string[];
    rating: number;
    createdAt: Date;
}
export interface GeoPoint {
  /**
   * The latitude coordinate in degrees.
   */
  latitude: number;

  /**
   * The longitude coordinate in degrees.
   */
  longitude: number;
}



export const exampleSpot: Spot = {
    id: "1",
    name: "Central Park",
    description: "A large public park in New York City.",
    imagesUrl: [require("@/assets/test_data/profile_picture.png")],
    rating: 4.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    reviews: [
        { userId: "u1", spotId: "1", sportName: "Soccer", comment: "Great place to play!", rating: 5, createdAt: new Date() },
        { userId: "u2", spotId: "1", sportName: "Tennis", comment: "Well maintained courts.", rating: 4, createdAt: new Date() }
    ],
    sportsReviewed: [
        { id: "s1", name: "Soccccccccccccccccccccccccccccer", description: "A team sport played with a spherical ball.", difficultyLevel: 3, reviewsCount: 10, rating: 4.5 },
        { id: "s2", name: "Tennis", description: "A racket sport that can be played individually or in doubles.", difficultyLevel: 4, reviewsCount: 5, rating: 4.0 }
    ],
    location: { latitude: 40.785091, longitude: -73.968285 },
    foro: "Central Park Forum"
};
