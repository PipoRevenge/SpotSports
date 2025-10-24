import { SportRepositoryImpl } from '@/src/api/repositories/implementations/sport-repository-impl';
import { SportDetails } from '@/src/entities/sport/model/sport';

const sportRepository = new SportRepositoryImpl();

const testSports: SportDetails[] = [
  {
    name: 'Football (Soccer)',
    description: 'Team sport played between two teams of 11 players.',
    category: 'Team sport',
    icon: '',
    image: '',
  },
  {
    name: 'Basketball',
    description: 'Team sport where the objective is to score by shooting the ball through the hoop.',
    category: 'Team sport',
    icon: '',
    image: '',
  },
  {
    name: 'Tennis',
    description: 'Racket sport played between two or four players.',
    category: 'Individual sport',
    icon: '',
    image: '',
  },
  {
    name: 'Swimming',
    description: 'Water sport that involves moving through water.',
    category: 'Aquatic sport',
    icon: '',
    image: '',
  },
  {
    name: 'Cycling',
    description: 'Sport that consists of riding a bicycle.',
    category: 'Individual sport',
    icon: '',
    image: '',
  },
  {
    name: 'Volleyball',
    description: 'Team sport where a ball is hit over a net.',
    category: 'Team sport',
    icon: '',
    image: '',
  },
  {
    name: 'Athletics',
    description: 'Set of sporting disciplines such as running, jumping and throwing.',
    category: 'Individual sport',
    icon: '',
    image: '',
  },
  {
    name: 'Boxing',
    description: 'Combat sport where two opponents fight using gloves.',
    category: 'Combat sport',
    icon: '',
    image: '',
  },
  {
    name: 'Fencing',
    description: 'Combat sport with swords, foils, or epees.',
    category: 'Combat sport',
    icon: '',
    image: '',
  },
  {
    name: 'Golf',
    description: 'Sport where the objective is to get a ball into holes with the fewest strokes.',
    category: 'Individual sport',
    icon: '',
    image: '',
  },
];

export const uploadTestSports = async () => {
  for (const sport of testSports) {
    try {
      const sportId = await sportRepository.createSport(sport, 'system');
      console.log(`Sport created: ${sport.name} with ID ${sportId}`);
    } catch (error) {
      console.error(`Error creating sport ${sport.name}:`, error);
    }
  }
};