
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
  imageUrls: string[];
  city: string;
  neighborhood: string;
  type: 'Apartamento' | 'Casa' | 'Chácara' | 'Galpão' | 'Sala' | 'Kitnet' | 'Terreno' | 'Lote' | 'Alto Padrão';
  operation: 'Comprar' | 'Alugar';
  featured: boolean;
  agentId?: string; 
  createdAt?: string;
};

export type SiteSettings = {
    showFinancing?: boolean;
    financingLink?: string;
    showReviews?: boolean;
}

export type Agent = {
    id: string;
    displayName: string;
    name: string; // Site name
    accountType: 'corretor' | 'imobiliaria';
    description: string;
    email: string;
    creci: string;
    photoUrl: string;
    cities?: string[];
    siteSettings?: SiteSettings;
}

export type Review = {
  id: string;
  name: string;
  email?: string | null;
  rating: number;
  comment?: string | null;
  approved?: boolean;
  createdAt?: any;
};

export type BlogPost = {
  id: string;
  agentId: string;
  title: string;
  content: string;
  coverImageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}


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
    imageUrls: ['property-1-1', 'property-1-2', 'property-1-3'],
    city: 'São Paulo',
    neighborhood: 'Centro',
    type: 'Apartamento',
    operation: 'Comprar',
    featured: true,
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
    imageUrls: ['property-2-1', 'property-2-2'],
    city: 'Campinas',
    neighborhood: 'Taquaral',
    type: 'Casa',
    operation: 'Comprar',
    featured: true,
  },
];

const staticReviews: Review[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    rating: 5,
    comment: 'Atendimento incrível e profissional. Encontrei o apartamento perfeito para minha família em tempo recorde. Recomendo a todos!',
    email: 'carlos@example.com'
  },
  {
    id: '2',
    name: 'Mariana Oliveira',
    rating: 5,
    comment: 'A corretora foi super atenciosa e paciente durante todo o processo. A experiência de compra foi muito mais tranquila graças a ela.',
    email: 'mariana@example.com'
  },
  {
    id: '3',
    name: 'João Pereira',
    rating: 5,
    comment: 'Profissionalismo exemplar e conhecimento profundo do mercado. Consegui vender meu imóvel rapidamente e por um ótimo preço.',
    email: 'joao@example.com'
  },
];


export const getReviews = () => staticReviews;
export const getPropertyCities = () => ['São Paulo', 'Campinas', 'Ubatuba', 'Guarujá', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
export const getPropertyTypes = () => ['Apartamento', 'Casa', 'Chácara', 'Galpão', 'Sala', 'Kitnet', 'Terreno', 'Lote', 'Alto Padrão'];
