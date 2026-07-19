import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/clubedascolecionadoras/termos")({
  component: TermsPage,
});

const sections = [
  {
    title: "1. Definições",
    body: [
      "Para facilitar a interpretação destes Termos, considera-se:",
      "Clube das Colecionadoras: plataforma digital desenvolvida pelo Lendo Sáficos destinada à coleção, organização, troca e obtenção de figurinhas digitais relacionadas à literatura sáfica.",
      "Lendo Sáficos: responsável pela criação, administração e manutenção da plataforma.",
      "Pessoa Usuária: qualquer pessoa que realize cadastro ou utilize a plataforma.",
      "Conta: cadastro individual criado para utilização dos serviços.",
      "Figurinha Digital: item virtual disponibilizado dentro da plataforma, gratuito ou pago, destinado exclusivamente à utilização no Clube das Colecionadoras.",
      "Coleção: conjunto de figurinhas pertencentes a uma categoria específica.",
      "Pacote: conjunto de figurinhas digitais disponibilizado gratuitamente ou mediante pagamento.",
      "Conteúdo de Terceiros: capas de livros, títulos, nomes de autoras, editoras, ilustrações, marcas e demais elementos que pertençam aos respectivos titulares de direitos.",
    ],
  },
  {
    title: "2. Sobre a plataforma",
    body: [
      "O Clube das Colecionadoras é uma iniciativa criada pelo Lendo Sáficos com o objetivo de incentivar a leitura, promover a literatura sáfica e proporcionar uma experiência interativa de coleção de figurinhas digitais.",
      "A plataforma poderá disponibilizar funcionalidades gratuitas e pagas, incluindo coleções, figurinhas digitais, pacotes, trocas, selos, desafios, quizzes, recompensas, eventos temporários e campanhas promocionais.",
      "Essas funcionalidades poderão ser alteradas, ampliadas, suspensas ou descontinuadas sempre que necessário para evolução da plataforma, manutenção técnica, segurança ou cumprimento da legislação.",
      "Sempre que possível, alterações relevantes serão comunicadas às pessoas usuárias.",
    ],
  },
  {
    title: "3. Cadastro",
    body: [
      "Para utilizar determinadas funcionalidades da plataforma é necessário criar uma conta.",
      "Ao realizar o cadastro, a pessoa usuária declara que fornecerá informações verdadeiras, manterá seus dados atualizados, utilizará apenas uma conta e possui capacidade para aceitar estes Termos ou está devidamente representada por responsável legal quando exigido pela legislação.",
      "Cada conta é pessoal e intransferível. Não é permitido vender, emprestar, compartilhar, transferir ou ceder contas para terceiros.",
      "A pessoa usuária é responsável por manter a confidencialidade de sua senha e pelas atividades realizadas em sua conta.",
      "Caso identifique acesso não autorizado, deverá comunicar o Lendo Sáficos assim que possível.",
    ],
  },
  {
    title: "4. Uma conta por pessoa",
    body: [
      "Para garantir igualdade entre todas as pessoas participantes da plataforma, é permitida apenas uma conta por pessoa.",
      "Não é permitido criar múltiplas contas, utilizar diferentes endereços de e-mail para obter novos pacotes, utilizar contas pertencentes a terceiros, utilizar e-mails temporários ou descartáveis para obter vantagens, criar contas destinadas exclusivamente ao envio de figurinhas para outra conta ou utilizar qualquer estratégia destinada a contornar limitações da plataforma.",
      "Caso sejam identificadas contas relacionadas à mesma pessoa, todas elas poderão ser analisadas.",
      "A existência de contas semelhantes não implica automaticamente aplicação de penalidades. A equipe poderá avaliar as circunstâncias específicas antes de qualquer decisão.",
    ],
  },
  {
    title: "5. Utilização da plataforma",
    body: [
      "Ao utilizar o Clube das Colecionadoras, a pessoa usuária compromete-se a agir de boa-fé e respeitar as regras da plataforma.",
      "É proibido explorar falhas do sistema, utilizar bots, scripts, automações, modificar o funcionamento da plataforma, tentar acessar áreas restritas, manipular resultados de quizzes ou desafios, adulterar pacotes, manipular sorteios internos, utilizar programas destinados à obtenção de vantagens indevidas ou praticar qualquer fraude.",
      "Também é proibido utilizar a plataforma para fins ilícitos ou que prejudiquem outras pessoas usuárias.",
      "A tentativa de fraude será tratada da mesma forma que a fraude efetivamente consumada.",
    ],
  },
  {
    title: "6. Figurinhas digitais",
    body: [
      "As figurinhas disponibilizadas no Clube das Colecionadoras são itens exclusivamente virtuais, destinados à utilização dentro da própria plataforma.",
      "As figurinhas não possuem valor monetário fora do Clube das Colecionadoras e não podem ser convertidas em dinheiro, crédito financeiro, criptomoedas ou qualquer outro bem.",
      "A aquisição de uma figurinha digital não transfere à pessoa usuária qualquer direito de propriedade intelectual sobre as obras, capas, ilustrações ou demais conteúdos nela representados.",
      "As figurinhas destinam-se exclusivamente à experiência de coleção oferecida pela plataforma.",
    ],
  },
  {
    title: "7. Pacotes gratuitos e pagos",
    body: [
      "A plataforma poderá disponibilizar figurinhas por diferentes meios, incluindo pacotes gratuitos, pacotes pagos, recompensas, desafios, quizzes, campanhas promocionais, eventos especiais ou outras formas definidas pelo Lendo Sáficos.",
      "Cada modalidade poderá possuir regras próprias, divulgadas na própria plataforma.",
      "Os pacotes poderão conter figurinhas repetidas.",
      "Quando um pacote possuir distribuição aleatória, a pessoa usuária reconhece que a compra não garante o recebimento de uma figurinha específica.",
      "As probabilidades de obtenção das figurinhas poderão variar conforme a coleção, campanha ou evento disponível.",
    ],
  },
  {
    title: "8. Pagamentos",
    body: [
      "Quando houver venda de pacotes ou figurinhas digitais, os valores serão apresentados antes da confirmação da compra.",
      "Ao concluir o pagamento, a pessoa usuária declara estar ciente das características do produto digital adquirido.",
      "Após a disponibilização do conteúdo digital na conta da pessoa usuária, eventuais pedidos de cancelamento ou reembolso serão analisados conforme a legislação aplicável, especialmente nas hipóteses de cobrança indevida, falha comprovada na entrega ou defeito no serviço.",
      "Nada nestes Termos limita os direitos garantidos pela legislação brasileira de defesa do consumidor.",
    ],
  },
  {
    title: "9. Trocas de figurinhas",
    body: [
      "Quando a funcionalidade estiver disponível, as pessoas usuárias poderão realizar trocas de figurinhas utilizando exclusivamente os mecanismos disponibilizados pela plataforma.",
      "Não é permitido utilizar as ferramentas de troca para comercializar figurinhas por dinheiro, praticar golpes, solicitar dados pessoais desnecessários, obter vantagens indevidas ou fraudar o funcionamento da plataforma.",
      "O Lendo Sáficos não participa das negociações realizadas entre pessoas usuárias nem se responsabiliza por acordos realizados fora das ferramentas oficiais disponibilizadas pela plataforma.",
      "Caso sejam identificadas práticas abusivas, fraudulentas ou contrárias a estes Termos, a funcionalidade de troca poderá ser suspensa para a conta envolvida.",
    ],
  },
  {
    title: "10. Conteúdo gratuito",
    body: [
      "Parte das figurinhas disponibilizadas gratuitamente utiliza capas de livros e outras referências relacionadas à literatura sáfica com finalidade informativa, cultural e de divulgação de obras e autoras.",
      "A presença de determinada obra no Clube das Colecionadoras não significa, por si só, que exista parceria comercial entre o Lendo Sáficos e a respectiva autora, editora ou titular dos direitos.",
      "Quando houver parceria oficial, essa informação poderá ser indicada pela plataforma.",
    ],
  },
  {
    title: "11. Conteúdo pago",
    body: [
      "As figurinhas disponibilizadas mediante pagamento são compostas por conteúdos utilizados com autorização dos respectivos titulares dos direitos, quando aplicável.",
      "Essas autorizações poderão ser concedidas por autoras, ilustradoras, editoras ou demais titulares responsáveis pelo conteúdo utilizado.",
      "As autorizações permitem a utilização do material exclusivamente para sua transformação em figurinhas digitais e para sua disponibilização dentro do Clube das Colecionadoras, observados os limites estabelecidos nos respectivos instrumentos de autorização.",
    ],
  },
  {
    title: "12. Ilustrações",
    body: [
      "As ilustrações disponibilizadas na plataforma são utilizadas mediante autorização da pessoa responsável pelo envio ou do respectivo titular dos direitos.",
      "Poderão ser realizados apenas os ajustes técnicos necessários para adaptação ao formato das figurinhas digitais, incluindo redimensionamento, recorte, compressão, aplicação de molduras, adequação de formato e outros ajustes técnicos necessários ao funcionamento da plataforma.",
      "Esses ajustes não têm como finalidade alterar a autoria, o significado ou a integridade da obra original.",
    ],
  },
  {
    title: "13. Conteúdos de terceiros",
    body: [
      "As capas de livros, títulos de obras, nomes de autoras, nomes de editoras, marcas, ilustrações e demais conteúdos pertencentes a terceiros continuam sendo de propriedade de seus respectivos titulares.",
      "A utilização desses conteúdos na plataforma não implica transferência de direitos ao Lendo Sáficos nem às pessoas usuárias.",
      "Da mesma forma, a aquisição de figurinhas digitais não autoriza sua reprodução, comercialização, distribuição, licenciamento ou qualquer outra forma de exploração das obras representadas.",
    ],
  },
  {
    title: "14. Direitos sobre a plataforma",
    body: [
      "O Clube das Colecionadoras é um projeto original desenvolvido pelo Lendo Sáficos.",
      "A organização das coleções, o sistema de funcionamento, os ícones, selos, molduras, elementos gráficos próprios, identidade visual, textos, estrutura do álbum e demais conteúdos originais criados especificamente para a plataforma constituem elementos próprios do projeto.",
      "Esses elementos não poderão ser reproduzidos, copiados, adaptados ou utilizados para criação de plataformas semelhantes sem autorização do Lendo Sáficos.",
      "Esta disposição não se aplica às obras pertencentes a terceiros, cujos direitos permanecem com seus respectivos titulares.",
    ],
  },
  {
    title: "15. Notificações de direitos autorais",
    body: [
      "O Lendo Sáficos atua de boa-fé na seleção dos conteúdos disponibilizados na plataforma e busca respeitar os direitos de autoras, editoras, ilustradoras e demais titulares.",
      "Caso qualquer titular de direitos identifique conteúdo que considere incorreto, desatualizado ou cuja utilização entenda necessitar de revisão, poderá entrar em contato pelos canais oficiais do Lendo Sáficos.",
      "Recebida a solicitação, ela será analisada em prazo razoável.",
      "Quando constatada a necessidade de atualização, correção ou retirada do conteúdo, o Lendo Sáficos poderá promover os ajustes necessários, sem que isso represente reconhecimento automático de qualquer irregularidade anterior.",
    ],
  },
];

function TermsPage() {
  return (
    <main className="terms-screen">
      <div className="terms-card">
        <Link to="/clubedascolecionadoras/signup" className="terms-back-link">
          <ArrowLeft size={16} />
          Voltar ao cadastro
        </Link>

        <header className="terms-header">
          <ShieldCheck size={28} />
          <h1>Termos de uso do Clube das Colecionadoras</h1>
          <p>Última atualização: 18 de julho de 2026</p>
        </header>

        <section className="terms-intro">
          <p>
            Estes Termos de Uso estabelecem as regras para acesso e utilização da plataforma
            digital Clube das Colecionadoras, desenvolvida pelo Lendo Sáficos.
          </p>
          <p>
            Ao criar uma conta, acessar ou utilizar qualquer funcionalidade da plataforma, você
            declara que leu, compreendeu e concorda com estes Termos.
          </p>
          <p>
            Caso não concorde com qualquer disposição deste documento, recomendamos que não utilize
            a plataforma.
          </p>
        </section>

        {sections.map((section) => (
          <section className="terms-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
