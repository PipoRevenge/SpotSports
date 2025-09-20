export interface User {
  id?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  username?: string;
  fullName?: string;
  bio?: string;
  birthDate?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const exampleUser: User = {
  id: "12345",
  email: "john.doe@example.com",
  displayName: "John Doe",
  photoURL: "https://example.com/profile.jpg",
  username: "johndoe",
  fullName: "Johnathan Doe",
  bio: "Lorem ipsum dolor sit amet.",
  birthDate: "1990-01-01",
  phoneNumber: "123-456-7890",
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};