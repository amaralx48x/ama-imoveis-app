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
  city: string;
  type: 'Apartamento' | 'Casa' | 'Terreno';
  operation: 'Venda' | 'Aluguel';
  featured: boolean;
  address: string;
};

export type Review = {
  id: string;
  name: string;
  review: string;
  avatar: string;
};

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
    city: 'Campinas',
    type: 'Casa',
    operation: 'Venda',
    featured: true,
    address: 'Rua das Orquídeas, 345, Bairro das Flores, Campinas - SP',
  },
  {
    id: '3',
    title: 'Casa de Praia com Vista para o Mar',
    description: 'Viva o sonho de morar na praia nesta casa incrível com acesso direto à areia e uma vista espetacular para o mar. Com 5 suítes, piscina privativa e um design moderno e arejado, é o refúgio perfeito.',
    price: 2500000,
    bedrooms: 5,
    bathrooms: 6,
    garage: 5,
    rooms: 10,
    builtArea: 300,
    totalArea: 500,
    images: ['property-3-1'],
    city: 'Ubatuba',
    type: 'Casa',
    operation: 'Venda',
    featured: true,
    address: 'Avenida da Praia, 789, Praia Grande, Ubatuba - SP',
  },
  {
    id: '4',
    title: 'Apartamento Aconchegante para Alugar',
    description: 'Apartamento de 2 quartos totalmente mobiliado e pronto para morar. Localizado em uma área central, com fácil acesso a transporte público, restaurantes e lojas. Condomínio com portaria 24h.',
    price: 2500,
    bedrooms: 2,
    bathrooms: 1,
    garage: 1,
    rooms: 4,
    builtArea: 60,
    totalArea: 60,
    images: ['property-4-1'],
    city: 'São Paulo',
    type: 'Apartamento',
    operation: 'Aluguel',
    featured: true,
    address: 'Rua Augusta, 900, Consolação, São Paulo - SP',
  },
  {
    id: '5',
    title: 'Terreno Amplo para Construção',
    description: 'Excelente terreno plano com 1000m², ideal para construção da casa dos seus sonhos ou para investimento. Localizado em um condomínio fechado com segurança e infraestrutura completa.',
    price: 500000,
    bedrooms: 0,
    bathrooms: 0,
    garage: 0,
    rooms: 0,
    builtArea: 0,
    totalArea: 1000,
    images: ['property-5-1'],
    city: 'Campinas',
    type: 'Terreno',
    operation: 'Venda',
    featured: false,
    address: 'Rua do Lago, Lote 12, Condomínio Colinas, Campinas - SP',
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

export const getAllProperties = () => properties;
export const getFeaturedProperties = () => properties.filter(p => p.featured);
export const getPropertyById = (id: string) => properties.find(p => p.id === id);
export const getReviews = () => reviews;
export const getPropertyCities = () => [...new Set(properties.map(p => p.city))];
export const getPropertyTypes = () => [...new Set(properties.map(p => p.type))];
