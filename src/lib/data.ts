export type Property = {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  garage: number;
  rooms: number;
  builtArea: number;
  totalArea: number;
  images: string[];
  imageUrls: string[]; // Added this
  city: string;
  type: 'Apartamento' | 'Casa' | 'Terreno';
  operation: 'Venda' | 'Aluguel';
  featured: boolean;
  address: string;
  agentId?: string; // Added this
};

export type Review = {
  id: string;
  name: string;
  review: string;
  avatar: string;
};

// This data is now considered legacy mock data.
// The app will primarily use Firestore.
const properties: Property[] = [
  {
    id: '1',
    title: 'Apartamento Luxuoso no Centro',
    description: 'Um deslumbrante apartamento de luxo no coração da cidade, com vistas panorâmicas e acabamentos de alta qualidade. Ideal para quem busca conforto e sofisticação. Com 3 quartos, sendo 2 suítes, sala de estar ampla com varanda gourmet e cozinha planejada. O condomínio oferece lazer completo com piscina, academia e salão de festas.',
    price: 1200000,
    bedrooms: 3,
    bathrooms: 3,
    garage: 2,
    rooms: 7,
    builtArea: 150,
    totalArea: 150,
    images: ['property-1-1', 'property-1-2', 'property-1-3'],
    imageUrls: ['property-1-1', 'property-1-2', 'property-1-3'],
    city: 'São Paulo',
    type: 'Apartamento',
    operation: 'Venda',
    featured: true,
    address: 'Avenida Paulista, 1578, Bela Vista, São Paulo - SP',
  },
  {
    id: '2',
    title: 'Casa Espaçosa com Quintal',
    description: 'Casa familiar espaçosa em bairro tranquilo, com um grande quintal perfeito para crianças e animais de estimação. Possui 4 quartos, cozinha americana e área de churrasqueira. Próxima a escolas, parques e comércios locais.',
    price: 850000,
    bedrooms: 4,
    bathrooms: 3,
    garage: 4,
    rooms: 9,
    builtArea: 250,
    totalArea: 400,
    images: ['property-2-1', 'property-2-2'],
    imageUrls: ['property-2-1', 'property-2-2'],
    city: 'Campinas',
    type: 'Casa',
    operation: 'Venda',
    featured: true,
    address: 'Rua das Orquídeas, 345, Bairro das Flores, Campinas - SP',
  },
];

const reviews: Review[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    review: 'Atendimento incrível e profissional. Encontrei o apartamento perfeito para minha família em tempo recorde. Recomendo a todos!',
    avatar: 'client-1',
  },
  {
    id: '2',
    name: 'Mariana Oliveira',
    review: 'A corretora foi super atenciosa e paciente durante todo o processo. A experiência de compra foi muito mais tranquila graças a ela.',
    avatar: 'client-2',
  },
  {
    id: '3',
    name: 'João Pereira',
    review: 'Profissionalismo exemplar e conhecimento profundo do mercado. Consegui vender meu imóvel rapidamente e por um ótimo preço.',
    avatar: 'client-3',
  },
];

export const getReviews = () => reviews;
export const getPropertyCities = () => ['São Paulo', 'Campinas', 'Ubatuba'];
export const getPropertyTypes = () => ['Apartamento', 'Casa', 'Terreno'];
