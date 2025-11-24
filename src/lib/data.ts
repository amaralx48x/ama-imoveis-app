




export type SocialLink = {
  id: string;
  label: string;
  url: string;
  icon: string;
  imageUrl?: string; // Adicionado para a foto do endereço
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
  operation: 'Venda' | 'Alugar';
  sectionIds: string[];
  phone?: string;
  agentId?: string; 
  createdAt?: any;
  status: 'ativo' | 'vendido' | 'alugado';
  soldAt?: any; // ou rentedAt
  commissionValue?: number;
  ownerContactId?: string | null;
};

export type Contact = {
    id: string;
    type: "owner" | "client";
    name: string;
    cpf?: string;
    phone?: string;
    email?: string;
    age?: number;
    notes?: string;
    linkedPropertyIds?: string[];
    createdAt?: any;
    updatedAt?: any;
    agentId?: string;
};

export type Availability = {
  days: {
    Segunda: boolean;
    Terça: boolean;
    Quarta: boolean;
    Quinta: boolean;
    Sexta: boolean;
    Sábado: boolean;
    Domingo: boolean;
  };
  startTime: string;
  endTime: string;
}

export type SiteSettings = {
    showFinancing?: boolean;
    financingLink?: string;
    showReviews?: boolean;
    defaultSaleCommission?: number;
    defaultRentCommission?: number;
    socialLinks?: SocialLink[];
    privacyPolicy?: string;
    termsOfUse?: string;
    theme?: 'light' | 'dark';
    faviconUrl?: string;
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
    phone?: string; // Telefone principal do corretor
    cities?: string[];
    availability?: Availability;
    siteSettings?: SiteSettings;
    role?: 'corretor' | 'admin';
    plan?: 'corretor' | 'imobiliaria';
}

export type LeadType = "seller" | "buyer" | "other";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  propertyId?: string | null;
  status: 'unread' | 'read' | 'archived';
  leadType: LeadType;
  context?: string;
  createdAt?: any;
  // Campos de agendamento
  cpf?: string;
  visitDate?: any;
  visitTime?: string;
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

export type SupportMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  images?: string[];
  status: 'pending' | 'responded';
  createdAt: any;
  respondedBy?: string;
  responseMessage?: string;
  responseAt?: any;
}

export type MarketingContent = {
    hero_media_url?: string;
    hero_media_type?: 'image' | 'video';
    feature_video_url?: string;
    feature_video_title?: string;
    ctaImageUrl?: string;
    section2_image?: string;
    section3_image?: string;
    section4_image1?: string;
    section4_image2?: string;
    section5_image1?: string;
    section5_image2?: string;
    section6_image?: string;
}


// This data is now considered legacy mock data.
// The app will primarily use Firestore.
const properties: Property[] = [
  {
    id: '1',
    agentId: 'exemplo',
    title: 'Apartamento Luxuoso no Centro',
    description: 'Um deslumbrante apartamento de luxo no coração da cidade, com vistas panorâmicas e acabamentos de alta qualidade. Ideal para quem busca conforto e sofisticação. Com 3 quartos, sendo 2 suítes, sala de estar ampla com varanda gourmet e cozinha planejada. O condomínio oferece lazer completo com piscina, academia e salão de festas.',
    price: 1200000,
    bedrooms: 3,
    bathrooms: 3,
    garage: 2,
    rooms: 7,
    builtArea: 150,
    totalArea: 150,
    imageUrls: ['https://images.unsplash.com/photo-1621070659899-40b6b6f6731d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxtb2Rlcm4lMjBhcGFydG1lbnR8ZW58MHx8fHwxNzYxOTY5MTY4fDA&ixlib=rb-4.1.0&q=80&w=1080', 'https://images.unsplash.com/photo-1742453161018-73e39a241541?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDB8fHx8MTc2MjAxMDk0NHww&ixlib=rb-4.1.0&q=80&w=1080', 'https://images.unsplash.com/photo-1630699294197-6ac1c11ae156?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxhcGFydG1lbnQlMjBraXRjaGVufGVufDB8fHx8MTc2MTkxOTE1MHww&ixlib=rb-4.1.0&q=80&w=1080'],
    city: 'São Paulo',
    neighborhood: 'Centro',
    type: 'Apartamento',
    operation: 'Venda',
    sectionIds: ['featured'],
    status: 'ativo',
  },
  {
    id: '2',
    agentId: 'exemplo',
    title: 'Casa Espaçosa com Quintal',
    description: 'Casa familiar espaçosa em bairro tranquilo, com um grande quintal perfeito para crianças e animais de estimação. Possui 4 quartos, cozinha americana и área de churrasqueira. Próxima a escolas, parques e comércios locais.',
    price: 850000,
    bedrooms: 4,
    bathrooms: 3,
    garage: 4,
    rooms: 9,
    builtArea: 250,
    totalArea: 400,
    imageUrls: ['https://images.unsplash.com/photo-1572120360610-d971b9d7767c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxzdWJ1cmJhbiUyMGhvdXNlfGVufDB8fHx8MTc2MTkwODc5N3ww&ixlib=rb-4.1.0&q=80&w=1080', 'https://images.unsplash.com/photo-1726968335694-02219ed7ce96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxob3VzZSUyMGJhY2t5YXJkfGVufDB8fHx8MTc2MjAwOTc0Mnww&ixlib=rb-4.1.0&q=80&w=1080'],
    city: 'Campinas',
    neighborhood: 'Taquaral',
    type: 'Casa',
    operation: 'Venda',
    sectionIds: ['featured'],
    status: 'ativo',
  },
  {
    id: '3',
    agentId: 'exemplo',
    title: 'Casa de Praia com Vista para o Mar',
    description: 'Desfrute de uma vista deslumbrante do oceano nesta casa de praia espaçosa. Com acesso direto à praia, piscina privativa e um design moderno e arejado. Perfeito para férias ou como residência permanente.',
    price: 2500000,
    bedrooms: 5,
    bathrooms: 6,
    garage: 3,
    rooms: 10,
    builtArea: 400,
    totalArea: 600,
    imageUrls: ['https://images.unsplash.com/photo-1634351580440-8fcf7813367e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxiZWFjaGZyb250JTIwaG91c2V8ZW58MHx8fHwxNzYxOTQ1NTg4fDA&ixlib=rb-4.1.0&q=80&w=1080'],
    city: 'Ubatuba',
    neighborhood: 'Praia Grande',
    type: 'Casa',
    operation: 'Venda',
    sectionIds: ['featured'],
    status: 'ativo'
  },
  {
      id: '4',
      agentId: 'exemplo',
      title: 'Apartamento Aconchegante no Itaim Bibi',
      description: 'Apartamento charmoso e bem iluminado em uma das áreas mais nobres de São Paulo. Próximo a restaurantes, bares e parques. Totalmente mobiliado e pronto para morar. Ideal para jovens profissionais e casais.',
      price: 5500,
      bedrooms: 1,
      bathrooms: 1,
      garage: 1,
      rooms: 3,
      builtArea: 50,
      totalArea: 50,
      imageUrls: ['https://images.unsplash.com/photo-1737737210863-387afd35344e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxjb3p5JTIwYXBhcnRtZW50fGVufDB8fHx8MTc2MjAxMDk0NXww&ixlib=rb-4.1.0&q=80&w=1080'],
      city: 'São Paulo',
      neighborhood: 'Itaim Bibi',
      type: 'Apartamento',
      operation: 'Alugar',
      sectionIds: [],
      status: 'ativo'
  },
];

const staticReviews: Review[] = [
  { id: '1', name: 'Carlos Silva', rating: 5, comment: 'Atendimento excepcional e muito profissionalismo. Encontrei o imóvel dos meus sonhos em poucas semanas. Recomendo fortemente!', approved: true },
  { id: '2', name: 'Mariana Oliveira', rating: 5, comment: 'Processo de compra muito tranquilo e transparente. A equipe foi muito atenciosa e tirou todas as minhas dúvidas.', approved: true },
  { id: '3', name: 'Pedro Martins', rating: 4, comment: 'Gostei muito da variedade de imóveis disponíveis. O corretor foi paciente e me ajudou a encontrar a melhor opção para minha família.', approved: true },
  { id: '4', name: 'Juliana Costa', rating: 5, comment: 'Experiência fantástica! Venderam meu apartamento antigo e me ajudaram a encontrar um novo lar. Super eficientes!', approved: true },
  { id: '5', name: 'Fernanda Lima', rating: 5, comment: 'Ótimo suporte durante todo o processo de locação. Me senti segura e bem assessorada.', approved: true },
  { id: '6', name: 'Ricardo Alves', rating: 5, comment: 'A melhor imobiliária da região! Encontrei exatamente o que procurava e o atendimento foi impecável.', approved: true }
];

export const defaultPrivacyPolicy = `
## POLÍTICA DE PRIVACIDADE

**Última Atualização:** ${new Date().toLocaleDateString('pt-BR')}

A presente Política de Privacidade e Tratamento de Dados Pessoais ("Política") tem por finalidade demonstrar o compromisso do(a) [Nome do Site/Corretor], doravante denominado(a) "Controlador", com a privacidade e a proteção dos dados pessoais coletados de seus Usuários, estabelecendo as regras sobre a coleta, registro, armazenamento, uso, compartilhamento e eliminação dos dados coletados dentro do escopo dos serviços prestados, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD).

**1. DEFINIÇÕES**
**Dado Pessoal:** Informação relacionada a pessoa natural identificada ou identificável.
**Titular:** Pessoa natural a quem se referem os dados pessoais que são objeto de tratamento.
**Tratamento:** Toda operação realizada com dados pessoais, como as que se referem a coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação ou controle da informação, modificação, comunicação, transferência, difusão ou extração.
**Controlador:** Pessoa natural ou jurídica, de direito público ou privado, a quem competem as decisões referentes ao tratamento de dados pessoais. Para fins desta Política, o corretor/imobiliária responsável por este site.

**2. DADOS COLETADOS E FINALIDADE DO TRATAMENTO**
O Controlador poderá coletar os seguintes dados pessoais dos Titulares que utilizam o formulário de contato:
- **Dados de Contato:** Nome, endereço de e-mail, número de telefone.
- **Finalidade:** Viabilizar o contato comercial para responder a questionamentos, fornecer informações sobre imóveis, agendar visitas e prestar os serviços de intermediação imobiliária. A base legal para este tratamento é o fornecimento de consentimento pelo Titular (Art. 7º, I, LGPD) e, subsequentemente, a execução de diligências pré-contratuais (Art. 7º, V, LGPD).

**3. ARMAZENAMENTO E SEGURANÇA DOS DADOS**
Os dados pessoais coletados são armazenados em ambiente seguro e controlado. O Controlador emprega medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito.
Os dados são retidos apenas pelo período estritamente necessário para o cumprimento das finalidades para as quais foram coletados, bem como para o cumprimento de obrigações legais, regulatórias ou para o exercício regular de direitos em processo judicial.

**4. COMPARTILHAMENTO DE DADOS**
O Controlador não compartilha os dados pessoais dos Titulares com terceiros, exceto mediante consentimento expresso do Titular ou por força de obrigação legal ou ordem judicial.

**5. DIREITOS DO TITULAR DOS DADOS**
Nos termos do Art. 18 da LGPD, o Titular dos dados pessoais tem o direito a obter do Controlador, a qualquer momento e mediante requisição:
I - confirmação da existência de tratamento;
II - acesso aos dados;
III - correção de dados incompletos, inexatos ou desatualizados;
IV - anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;
V - portabilidade dos dados a outro fornecedor, mediante requisição expressa;
VI - eliminação dos dados pessoais tratados com o consentimento do titular;
VII - informação das entidades com as quais o controlador realizou uso compartilhado de dados;
VIII - informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa;
IX - revogação do consentimento.

Para exercer qualquer um dos seus direitos, o Titular deverá entrar em contato com o Controlador através dos canais de comunicação disponibilizados neste site.

**6. DISPOSIÇÕES GERAIS**
Esta Política poderá ser atualizada a qualquer tempo. Recomenda-se que o Titular a verifique periodicamente.
O uso continuado deste site após a publicação de alterações a esta Política será considerado como aceitação das práticas de privacidade.

**7. JURISDIÇÃO**
Esta Política será regida, interpretada e executada de acordo com as Leis da República Federativa do Brasil, sendo competente o foro da comarca de domicílio do Titular para dirimir qualquer dúvida decorrente deste documento.
`;

export const defaultTermsOfUse = `
## TERMOS E CONDIÇÕES DE USO

**Última Atualização:** ${new Date().toLocaleDateString('pt-BR')}

Estes Termos e Condições de Uso ("Termos") regulam o acesso e a utilização do website mantido pelo(a) [Nome do Site/Corretor], doravante denominado(a) "Prestador". O acesso e a utilização do site implicam na aceitação integral e sem reservas de todas as disposições destes Termos.

**1. OBJETO**
O presente site tem como objeto a divulgação de anúncios de imóveis para venda e locação, bem como a facilitação do contato entre os Usuários interessados e o Prestador, que atua na intermediação imobiliária.

**2. OBRIGAÇÕES DO USUÁRIO**
O Usuário compromete-se a utilizar o site e seus serviços em conformidade com a lei, a moral, os bons costumes, a ordem pública e os presentes Termos. O Usuário se obriga a não utilizar o site para fins ilícitos, lesivos aos direitos e interesses de terceiros, ou que de qualquer forma possam danificar, inutilizar, sobrecarregar ou deteriorar o site e seus serviços.

**3. PROPRIEDADE INTELECTUAL**
Todo o conteúdo disponibilizado no site, incluindo, mas não se limitando a textos, gráficos, imagens, logotipos, ícones, fotografias, layout, software e demais materiais ("Conteúdo"), é de propriedade exclusiva do Prestador ou de terceiros que licitamente cederam seu direito de uso, e está protegido pelas leis de propriedade intelectual.
É vedada a reprodução, distribuição, modificação, exibição, criação de trabalhos derivados ou qualquer outra forma de utilização do Conteúdo sem a prévia e expressa autorização por escrito do Prestador.

**4. ISENÇÃO DE RESPONSABILIDADE**
As informações sobre os imóveis (preços, metragens, características, disponibilidade, etc.) são fornecidas pelos proprietários e estão sujeitas a alterações sem aviso prévio. O Prestador envida seus melhores esforços para manter as informações atualizadas, contudo, não garante a exatidão, pontualidade ou integralidade das mesmas, recomendando-se a confirmação junto aos nossos corretores.
O Prestador não se responsabiliza por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos resultantes do uso ou da incapacidade de uso do site.

**5. LINKS PARA SITES DE TERCEIROS**
O site pode conter links para websites de terceiros. A existência desses links não implica em relação de endosso, patrocínio ou afiliação do Prestador para com esses sites. O Prestador não exerce controle sobre o conteúdo de sites de terceiros e não se responsabiliza por suas políticas ou práticas. O acesso a tais sites se dará por conta e risco do Usuário.

**6. MODIFICAÇÕES DOS TERMOS**
O Prestador reserva-se o direito de modificar os presentes Termos a qualquer tempo, sem necessidade de aviso prévio. A versão atualizada estará sempre disponível no site. Recomenda-se a leitura periódica destes Termos. A continuidade do uso do site pelo Usuário após quaisquer alterações constituirá sua aceitação tácita.

**7. LEGISLAÇÃO APLICÁVEL E FORO**
Estes Termos são regidos e interpretados segundo as leis da República Federativa do Brasil. Fica eleito o foro da Comarca do domicílio do Prestador para dirimir quaisquer controvérsias oriundas destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
`;

export const getProperties = () => properties;
export const getReviews = () => staticReviews;
export const getPropertyCities = () => ['São Paulo', 'Campinas', 'Ubatuba', 'Guarujá', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
export const getPropertyTypes = () => ['Apartamento', 'Casa', 'Chácara', 'Galpão', 'Sala', 'Kitnet', 'Terreno', 'Lote', 'Alto Padrão'];






