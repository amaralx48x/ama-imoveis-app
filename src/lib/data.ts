

export type SocialLink = {
  id: string;
  label: string;
  url: string;
  icon: string;
}

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
  sectionIds: string[];
  agentId?: string; 
  createdAt?: any;
  status: 'ativo' | 'vendido' | 'alugado';
  soldAt?: any; // ou rentedAt
  commissionValue?: number;
};

export type SiteSettings = {
    showFinancing?: boolean;
    financingLink?: string;
    showReviews?: boolean;
    defaultSaleCommission?: number;
    defaultRentCommission?: number;
    socialLinks?: SocialLink[];
    privacyPolicy?: string;
    termsOfUse?: string;
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

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  propertyId?: string | null;
  status: 'unread' | 'read' | 'archived';
  createdAt?: any;
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

export type CustomSection = {
  id: string;
  title: string;
  order: number;
  createdAt: any;
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
    imageUrls: ['property-1-1', 'property-1-2', 'property-1-3'],
    city: 'São Paulo',
    neighborhood: 'Centro',
    type: 'Apartamento',
    operation: 'Comprar',
    sectionIds: ['featured'],
    status: 'ativo'
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
    sectionIds: ['featured'],
    status: 'ativo'
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

export const defaultPrivacyPolicy = `
## Política de Privacidade

**Última atualização:** ${new Date().toLocaleDateString('pt-BR')}

A sua privacidade é importante para nós. É política do nosso site respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar.

**1. Coleta de Dados**
Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos и legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.

Os dados que coletamos através do formulário de contato (nome, email, telefone e mensagem) são utilizados exclusivamente para que o corretor responsável possa entrar em contato com você para tratar sobre sua solicitação.

**2. Uso dos Dados**
Os dados fornecidos são utilizados para:
- Responder às suas questões e solicitações.
- Agendar visitas a imóveis.
- Fornecer informações sobre propriedades de seu interesse.
- Enviar comunicações de marketing, caso tenha consentido.

**3. Armazenamento de Dados**
Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.

**4. Compartilhamento de Dados**
Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.

**5. Seus Direitos (LGPD)**
De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem o direito de:
- Confirmar a existência de tratamento de seus dados.
- Acessar seus dados.
- Corrigir dados incompletos, inexatos ou desatualizados.
- Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.
- Solicitar a portabilidade dos seus dados a outro fornecedor de serviço ou produto.
- Solicitar a eliminação dos dados pessoais tratados com o seu consentimento.
- Obter informação sobre as entidades públicas ou privadas com as quais compartilhamos seus dados.

Para exercer seus direitos, entre em contato conosco através dos canais disponibilizados neste site.

**6. Links para Sites de Terceiros**
O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade.

**7. Consentimento**
O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contato conosco.

O corretor/imobiliária responsável por este site é o controlador dos dados pessoais coletados.
`;

export const defaultTermsOfUse = `
## Termos de Uso

**Última atualização:** ${new Date().toLocaleDateString('pt-BR')}

**1. Termos**
Ao acessar ao site, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.

**2. Uso de Licença**
É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você не pode:
- modificar ou copiar os materiais;
- usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);
- tentar descompilar ou fazer engenharia reversa de qualquer software contido no site;
- remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou
- transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.

Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por nós a qualquer momento.

**3. Isenção de Responsabilidade**
Os materiais no site são fornecidos 'como estão'. Não oferecemos garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.
Além disso, não garantimos ou fazemos qualquer representação relativa à precisão, aos resultados prováveis ​​ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site.

**4. Limitações**
Em nenhum caso nós ou nossos fornecedores seremos responsáveis ​​por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais no site, mesmo que nós ou um representante autorizado tenha sido notificado oralmente ou por escrito da possibilidade de tais danos.

**5. Precisão dos Materiais**
Os materiais exibidos no site podem incluir erros técnicos, tipográficos ou fotográficos. Não garantimos que qualquer material em seu site seja preciso, completo ou atual. Podemos fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, não nos comprometemos a atualizar os materiais.

**6. Links**
Não analisamos todos os sites vinculados ao seu site e не somos responsáveis pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica nosso endosso do site. O uso de qualquer site vinculado é por conta e risco do usuário.

**Modificações**
Podemos revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.

**Lei aplicável**
Estes termos e condições são regidos e interpretados de acordo com as leis do Brasil e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.
`;

export const getReviews = () => staticReviews;
export const getPropertyCities = () => ['São Paulo', 'Campinas', 'Ubatuba', 'Guarujá', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
export const getPropertyTypes = () => ['Apartamento', 'Casa', 'Chácara', 'Galpão', 'Sala', 'Kitnet', 'Terreno', 'Lote', 'Alto Padrão'];
