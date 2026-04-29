import { useState } from "react"
import { Modal, ScrollView, StyleSheet, Switch, Text, View } from "react-native"
import EntryShell from "../../components/EntryShell"
import { getPerfil, upsertPerfil } from "../../lib/profileService"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { useUserStore } from "../../store/userStore"
import { Button, InputField, OptionCard, StatusCard, SurfaceBox } from "../ui"
import { colors, spacing, typography } from "../theme"

const termsSections = [
  {
    title: "1. Finalidade do aplicativo",
    paragraphs: [
      "O aplicativo oferece recursos de apoio à organização alimentar, acompanhamento pessoal, check-ins, cardápios, receitas e visualização de progresso.",
      "O conteúdo exibido tem finalidade informativa e de suporte à rotina do usuário, sem substituir avaliação profissional individual.",
    ],
  },
  {
    title: "2. Receitas, recomendacoes e uso de IA",
    paragraphs: [
      "Parte das receitas, sugestões, organização de cardápios e recomendações exibidas pode ser gerada, adaptada, resumida ou organizada com apoio de inteligência artificial.",
      "Apesar de buscarmos clareza e utilidade, podem existir imprecisões, inconsistências, omissões ou inadequações para casos específicos.",
    ],
  },
  {
    title: "3. Não substitui atendimento profissional",
    paragraphs: [
      "O aplicativo não realiza diagnóstico e não substitui consulta com nutricionista, médico ou outro profissional habilitado.",
      "Pessoas com restrições, alergias, condições de saúde ou situações especiais devem buscar orientação profissional antes de seguir qualquer plano.",
    ],
  },
]

const privacySections = [
  {
    title: "1. Dados que podem ser tratados",
    paragraphs: [
      "Podemos tratar dados cadastrais e dados inseridos pelo próprio usuário, como nome, e-mail, idade, peso, altura, objetivo e check-ins.",
    ],
  },
  {
    title: "2. Finalidade do tratamento",
    paragraphs: [
      "Os dados são usados para criar a conta, personalizar a experiência, salvar a evolução e sincronizar o histórico.",
    ],
  },
  {
    title: "3. Direitos do usuario",
    paragraphs: [
      "O usuário pode solicitar correção, atualização ou exclusão quando cabível, conforme a legislação aplicável.",
    ],
  },
]

function Feedback({ message }) {
  if (!message) return null
  return <StatusCard tone="warning" title="Ajuste necessario" description={message} />
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase()
}

function normalizeIntegerInput(value) {
  return String(value ?? "").replace(/[^\d]/g, "")
}

function normalizeDecimalInput(value) {
  const sanitized = String(value ?? "")
    .trim()
    .replace(",", ".")
    .replace(/[^\d.]/g, "")

  const [integerPart = "", ...decimalParts] = sanitized.split(".")
  const decimalPart = decimalParts.join("")

  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart
}

function parsePositiveNumber(value) {
  const normalized = String(value ?? "").trim().replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function validateNome(value) {
  return String(value ?? "").trim().length >= 2
    ? ""
    : "Digite pelo menos 2 caracteres para continuar."
}

function validateIdade(value) {
  const parsed = parsePositiveNumber(value)
  if (parsed == null || !Number.isInteger(parsed)) {
    return "Informe uma idade valida em numeros inteiros."
  }
  if (parsed < 10 || parsed > 120) {
    return "Informe uma idade entre 10 e 120 anos."
  }
  return ""
}

function validatePeso(value) {
  const parsed = parsePositiveNumber(value)
  if (parsed == null) {
    return "Informe um peso válido. Você pode usar vírgula ou ponto."
  }
  if (parsed < 25 || parsed > 400) {
    return "Informe um peso entre 25 kg e 400 kg."
  }
  return ""
}

function validateAltura(value) {
  const parsed = parsePositiveNumber(value)
  if (parsed == null || !Number.isInteger(parsed)) {
    return "Informe uma altura valida em centimetros."
  }
  if (parsed < 100 || parsed > 250) {
    return "Informe uma altura entre 100 cm e 250 cm."
  }
  return ""
}

async function syncAuthenticatedUser(userId) {
  if (!userId) return

  await upsertPerfil(userId, useUserStore.getState())
  const { perfil } = await getPerfil(userId)
  if (perfil) {
    useUserStore.getState().setPerfil(perfil)
  }
}

async function loadUserProfile(userId) {
  if (!userId) {
    return { error: new Error("Usuário autenticado sem identificador válido.") }
  }

  const { perfil, error } = await getPerfil(userId)

  if (error) {
    return { error }
  }

  if (perfil) {
    useUserStore.getState().setPerfil(perfil)
    return { perfil, found: true, error: null }
  }

  return { perfil: null, found: false, error: null }
}

async function createProfileFromCurrentOnboarding(userId) {
  if (!userId) {
    return { error: new Error("Usuário autenticado sem identificador válido.") }
  }

  await syncAuthenticatedUser(userId)
  return loadUserProfile(userId)
}

export function HomeScreen({ navigation }) {
  const resetOnboarding = useUserStore((state) => state.resetOnboarding)

  return (
    <EntryShell
      eyebrow="Nutrição inteligente"
      title="Painel nutricional pronto para celular"
      description="Organize sua alimentação, acompanhe sua evolução e monte refeições com uma experiência pensada para o celular."
      footer="Escolha como deseja começar e siga com uma jornada mais organizada desde o primeiro acesso."
      highlights={[
        { title: "Check-ins semanais", description: "Peso e histórico reunidos em um acompanhamento simples." },
        { title: "Cardápios por refeição", description: "Receitas distribuídas por momento do dia e objetivo." },
      ]}
    >
      <Button
        label="Iniciar novo acompanhamento"
        onPress={() => {
          resetOnboarding()
          navigation.navigate("Terms")
        }}
      />
      <Button label="Acessar minha conta" variant="secondary" onPress={() => navigation.navigate("Login")} />
    </EntryShell>
  )
}

export function TermsScreen({ navigation }) {
  const [visible, setVisible] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [erro, setErro] = useState("")

  function continuar() {
    if (!acceptedTerms || !acceptedPrivacy) {
      setErro("Confirme os Termos de Uso e a Política de Privacidade para continuar.")
      return
    }

    setErro("")
    navigation.navigate("Nome")
  }

  return (
    <EntryShell eyebrow="Termos e privacidade" title="Leia antes de iniciar">
      <Text style={styles.copy}>
        Leia o texto completo dos Termos de Uso e da Política de Privacidade no botão abaixo. Depois, confirme os aceites para continuar.
      </Text>

      <Button label="Abrir termos e privacidade" variant="secondary" onPress={() => setVisible(true)} />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Li e concordo com os Termos de Uso.</Text>
        <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} trackColor={{ true: colors.brand }} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Li e concordo com a Política de Privacidade.</Text>
        <Switch value={acceptedPrivacy} onValueChange={setAcceptedPrivacy} trackColor={{ true: colors.brand }} />
      </View>

      <Feedback message={erro} />
      <Button label="Aceitar e continuar" onPress={continuar} />

      <Modal visible={visible} animationType="slide">
        <View style={styles.modalShell}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalEyebrow}>Leitura completa</Text>
            <Text style={styles.modalTitle}>Termos e privacidade</Text>
            {[...termsSections, ...privacySections].map((section) => (
              <SurfaceBox key={section.title} style={styles.modalCard} tone="default">
                <Text style={styles.modalSectionTitle}>{section.title}</Text>
                {section.paragraphs.map((paragraph) => (
                  <Text key={paragraph} style={styles.modalParagraph}>{paragraph}</Text>
                ))}
              </SurfaceBox>
            ))}
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button label="Fechar leitura" onPress={() => setVisible(false)} />
          </View>
        </View>
      </Modal>
    </EntryShell>
  )
}

function buildInputScreen({
  title,
  description,
  label,
  placeholder,
  keyboardType,
  nextRoute,
  storeKey,
  step,
  normalizeValue = (value) => String(value ?? "").trim(),
  validateValue = () => "",
}) {
  return function InputScreen({ navigation }) {
    const setField = useUserStore((state) => state[storeKey])
    const [value, setValue] = useState("")
    const [erro, setErro] = useState("")

    function continuar() {
      const normalizedValue = normalizeValue(value)

      if (!normalizedValue) {
        setErro("Preencha este campo para continuar.")
        return
      }

      const validationError = validateValue(normalizedValue)
      if (validationError) {
        setErro(validationError)
        return
      }

      setErro("")
      setField(normalizedValue)
      navigation.navigate(nextRoute)
    }

    return (
      <EntryShell step={step} totalSteps={7} title={title} description={description}>
        <InputField
          label={label}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
        <Feedback message={erro} />
        <Button label="Continuar" onPress={continuar} />
      </EntryShell>
    )
  }
}

export const NomeScreen = buildInputScreen({
  title: "Como você gostaria de se identificar?",
  description: "Esse nome será usado para personalizar o painel e deixar sua jornada mais clara.",
  label: "Nome",
  placeholder: "Digite o nome",
  nextRoute: "Idade",
  storeKey: "setNome",
  step: 1,
  validateValue: validateNome,
})

export const IdadeScreen = buildInputScreen({
  title: "Qual é a sua idade?",
  description: "A idade entra na estimativa metabólica e ajuda a calibrar melhor o plano inicial.",
  label: "Idade",
  placeholder: "Ex: 32",
  keyboardType: "number-pad",
  nextRoute: "Peso",
  storeKey: "setIdade",
  step: 2,
  normalizeValue: normalizeIntegerInput,
  validateValue: validateIdade,
})

export const PesoScreen = buildInputScreen({
  title: "Qual é o peso atual?",
  description: "Esse dado ajuda a compor a base metabólica e será o primeiro marco da evolução.",
  label: "Peso em kg",
  placeholder: "Ex: 72,4",
  keyboardType: "decimal-pad",
  nextRoute: "Altura",
  storeKey: "setPeso",
  step: 3,
  normalizeValue: normalizeDecimalInput,
  validateValue: validatePeso,
})

export const AlturaScreen = buildInputScreen({
  title: "Qual é a sua altura?",
  description: "Junto com peso e idade, essa medida deixa a estimativa metabólica mais consistente.",
  label: "Altura em cm",
  placeholder: "Ex: 168",
  keyboardType: "number-pad",
  nextRoute: "Sexo",
  storeKey: "setAltura",
  step: 4,
  normalizeValue: normalizeIntegerInput,
  validateValue: validateAltura,
})

export function SexoScreen({ navigation }) {
  const setSexo = useUserStore((state) => state.setSexo)

  return (
    <EntryShell
      step={5}
      totalSteps={7}
      title="Qual referência biológica devemos considerar?"
      description="Essa informação será usada somente para compor o cálculo metabólico basal."
    >
      <OptionCard title="Masculino" description="Usar fórmula de referência masculina no cálculo." onPress={() => {
        setSexo("masculino")
        navigation.navigate("NivelAtividade")
      }} />
      <OptionCard title="Feminino" description="Usar fórmula de referência feminina no cálculo." onPress={() => {
        setSexo("feminino")
        navigation.navigate("NivelAtividade")
      }} />
    </EntryShell>
  )
}

export function NivelAtividadeScreen({ navigation }) {
  const setAtividade = useUserStore((state) => state.setAtividade)

  const options = [
    ["sedentario", "Sedentário", "Rotina com pouca ou nenhuma atividade física regular."],
    ["leve", "Leve", "Movimento leve ao longo da semana ou exercícios ocasionais."],
    ["moderado", "Moderado", "Treinos frequentes ou rotina ativa na maior parte da semana."],
    ["alto", "Alto", "Volume de treino elevado ou rotina fisicamente exigente."],
    ["muito_alto", "Muito alto", "Atividade intensa, diária e com demanda energética elevada."],
  ]

  return (
    <EntryShell
      step={6}
      totalSteps={7}
      title="Qual é o nível de atividade atual?"
      description="Selecione a rotina que melhor representa seu momento atual."
    >
      {options.map(([value, title, description]) => (
        <OptionCard
          key={value}
          title={title}
          description={description}
          onPress={() => {
            setAtividade(value)
            navigation.navigate("Objetivo")
          }}
        />
      ))}
    </EntryShell>
  )
}

export function ObjetivoScreen({ navigation }) {
  const setObjetivo = useUserStore((state) => state.setObjetivo)

  const options = [
    ["emagrecer", "Emagrecimento", "Foco em redução de gordura com controle calórico e saciedade."],
    ["manter", "Manutenção", "Equilíbrio para manter peso e rotina alimentar consistentes."],
    ["ganhar_massa", "Ganho de massa", "Maior suporte calórico e proteico para evolução muscular."],
  ]

  return (
    <EntryShell
      step={7}
      totalSteps={7}
      title="Qual é o objetivo principal?"
      description="Defina a direção principal do plano para gerar uma estratégia inicial mais coerente."
    >
      {options.map(([value, title, description]) => (
        <OptionCard
          key={value}
          title={title}
          description={description}
          onPress={() => {
            setObjetivo(value)
            navigation.navigate("CalculoMetabolico")
          }}
        />
      ))}
    </EntryShell>
  )
}

export function CalculoMetabolicoScreen({ navigation }) {
  const [erro, setErro] = useState("")
  const nome = useUserStore((state) => state.nome)
  const idade = useUserStore((state) => state.idade)
  const peso = useUserStore((state) => state.peso)
  const altura = useUserStore((state) => state.altura)
  const sexo = useUserStore((state) => state.sexo)
  const atividade = useUserStore((state) => state.atividade)
  const objetivo = useUserStore((state) => state.objetivo)
  const setCalculoMetabolico = useUserStore((state) => state.setCalculoMetabolico)

  const objetivoTexto =
    objetivo === "emagrecer" ? "emagrecimento" : objetivo === "ganhar_massa" ? "ganho de massa" : "manutenção"

  const pesoNum = parsePositiveNumber(peso)
  const alturaNum = parsePositiveNumber(altura)
  const idadeNum = parsePositiveNumber(idade)
  const idadeError = validateIdade(idade)
  const pesoError = validatePeso(peso)
  const alturaError = validateAltura(altura)
  const dadosCompletos = Boolean(peso && altura && idade && sexo)
  const dadosNumericosValidos = !idadeError && !pesoError && !alturaError && pesoNum != null && alturaNum != null && idadeNum != null

  let tmb = 0
  if (dadosCompletos && dadosNumericosValidos) {
    tmb = sexo === "masculino"
      ? 10 * pesoNum + 6.25 * alturaNum - 5 * idadeNum + 5
      : 10 * pesoNum + 6.25 * alturaNum - 5 * idadeNum - 161
  }

  let fatorAtividade = 1.2
  if (atividade === "leve") fatorAtividade = 1.375
  if (atividade === "moderado") fatorAtividade = 1.55
  if (atividade === "alto") fatorAtividade = 1.725
  if (atividade === "muito_alto") fatorAtividade = 1.9

  const tdee = tmb * fatorAtividade
  let caloriasObjetivo = tdee
  if (objetivo === "emagrecer") caloriasObjetivo = tdee - 400
  if (objetivo === "ganhar_massa") caloriasObjetivo = tdee + 400

  function continuar() {
    if (!dadosCompletos) {
      setErro("Complete as etapas anteriores para gerar o resumo metabólico corretamente.")
      navigation.navigate("Nome")
      return
    }

    if (!dadosNumericosValidos) {
      setErro(idadeError || pesoError || alturaError || "Revise idade, peso e altura antes de continuar.")
      return
    }

    setErro("")
    setCalculoMetabolico({
      tmb: Math.round(tmb),
      tdee: Math.round(tdee),
      caloriasObjetivo: Math.round(caloriasObjetivo),
    })
    navigation.navigate("CriarConta")
  }

  return (
    <EntryShell
      eyebrow="Resumo metabólico"
      title={`Base inicial de ${nome || "você"}`}
      description={`Com os dados preenchidos, já temos uma estimativa inicial para orientar o plano de ${objetivoTexto}.`}
      footer="No próximo passo, você cria a conta para salvar sua base inicial e seguir com o painel completo."
      highlights={[
        { title: "TMB estimada", description: "Uma referência inicial para entender o metabolismo basal." },
        { title: "Direção do plano", description: "Ajuste calórico inicial alinhado ao objetivo definido." },
      ]}
    >
      <View style={styles.metricsRow}>
        <SurfaceBox style={styles.metricCard}>
          <Text style={styles.metricTitle}>TMB</Text>
          <Text style={styles.metricValue}>{Math.round(tmb)} kcal</Text>
        </SurfaceBox>
        <SurfaceBox style={styles.metricCard}>
          <Text style={styles.metricTitle}>Gasto diário</Text>
          <Text style={styles.metricValue}>{Math.round(tdee)} kcal</Text>
        </SurfaceBox>
        <SurfaceBox style={styles.metricCard}>
          <Text style={styles.metricTitle}>Meta inicial</Text>
          <Text style={styles.metricValue}>{Math.round(caloriasObjetivo)} kcal</Text>
        </SurfaceBox>
      </View>
      <Feedback message={erro} />
      <Button label="Criar conta e continuar" onPress={continuar} />
    </EntryShell>
  )
}

function AuthForm({
  title,
  description,
  buttonLabel,
  secondaryLabel,
  secondaryAction,
  submitAction,
}) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [mensagem, setMensagem] = useState("")

  async function onSubmit() {
    const normalizedEmail = normalizeEmail(email)
    const normalizedSenha = String(senha ?? "")

    if (!normalizedEmail) {
      setErro("Preencha seu e-mail para continuar.")
      return
    }

    if (!normalizedSenha.trim()) {
      setErro("Preencha sua senha para continuar.")
      return
    }

    setLoading(true)
    setErro("")
    setMensagem("")

    try {
      const result = await submitAction({
        email: normalizedEmail,
        senha: normalizedSenha,
        setErro,
        setMensagem,
      })

      if (result?.finallyMessage) {
        setMensagem(result.finallyMessage)
      }
    } catch (error) {
      setErro(error?.message ?? "Ocorreu um erro inesperado ao processar sua autenticação.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <EntryShell
      eyebrow="Acesso"
      title={title}
      description={description}
      footer="Se este for seu primeiro acesso, crie uma conta para salvar sua evolução e organizar sua rotina."
      highlights={[
        { title: "Histórico sincronizado", description: "Check-ins e dados da sua jornada reunidos com segurança." },
        { title: "Acesso direto", description: "Entre com e-mail e senha para retomar seu painel sem etapas extras." },
      ]}
    >
      <InputField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <InputField
        label="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="Digite sua senha"
        secureTextEntry
        autoCapitalize="none"
      />
      <Feedback message={erro} />
      {mensagem ? <StatusCard tone="success" title={mensagem} /> : null}
      <Button label={loading ? "Processando..." : buttonLabel} onPress={onSubmit} disabled={loading} />
      <Button label={secondaryLabel} variant="ghost" onPress={secondaryAction.action} />
    </EntryShell>
  )
}

export function LoginScreen({ navigation }) {
  async function submitAction({ email, senha, setErro }) {
    if (!hasSupabaseConfig || !supabase) {
      setErro("Conexão com o Supabase não configurada. Revise as variáveis EXPO_PUBLIC para continuar.")
      return null
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro("Não foi possível entrar com esse e-mail e senha. Revise os dados e tente novamente.")
      return null
    }

    const userId = data.user?.id
    if (userId) {
      const { found, error: profileError } = await loadUserProfile(userId)
      if (profileError) {
        setErro("Entramos na conta, mas não foi possível carregar seu perfil agora.")
      } else if (!found) {
        setErro("Entramos na conta, mas seu perfil ainda não foi configurado neste acesso.")
      }
    }

    return {}
  }

  return (
    <AuthForm
      title="Acesse seu painel"
      description="Retome seu acompanhamento com histórico, cardápios e dados pessoais sincronizados em um único lugar."
      buttonLabel="Entrar"
      secondaryLabel="Criar nova conta"
      secondaryAction={{ navigation, action: () => navigation.navigate("CriarConta") }}
      submitAction={submitAction}
    />
  )
}

export function CriarContaScreen({ navigation }) {
  async function submitAction({ email, senha, setErro }) {
    if (!hasSupabaseConfig || !supabase) {
      setErro("Conexão com o Supabase não configurada. Revise as variáveis EXPO_PUBLIC para continuar.")
      return null
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    })

    if (error) {
      setErro("Não foi possível criar sua conta agora. Revise os dados e tente novamente.")
      return null
    }

    const userId = data.user?.id
    if (userId) {
      const { error: profileError } = await createProfileFromCurrentOnboarding(userId)
      if (profileError) {
        setErro("A conta foi criada, mas não conseguimos preparar seu perfil agora.")
        return {
          finallyMessage: data.session
            ? "Conta criada e autenticada, mas o perfil precisa ser sincronizado novamente."
            : "Conta criada. Confirme seu e-mail e depois conclua a sincronização do perfil.",
        }
      }
    }

    return {
      finallyMessage: data.session
        ? "Conta criada com sucesso."
        : "Conta criada. Confirme seu e-mail se o Supabase exigir verificação.",
    }
  }

  return (
    <AuthForm
      title="Crie sua conta"
      description="Conecte seu onboarding ao Supabase para manter histórico, cardápios e progresso sincronizados."
      buttonLabel="Criar conta"
      secondaryLabel="Voltar para login"
      secondaryAction={{ navigation, action: () => navigation.navigate("Login") }}
      submitAction={submitAction}
    />
  )
}

const styles = StyleSheet.create({
  copy: {
    ...typography.body,
    color: colors.textMuted,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  modalShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalEyebrow: {
    ...typography.caption,
    color: colors.brand,
    textTransform: "uppercase",
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },
  modalCard: {
    gap: spacing.sm,
  },
  modalSectionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  modalParagraph: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  modalFooter: {
    padding: spacing.lg,
  },
  metricsRow: {
    gap: spacing.sm,
  },
  metricCard: {
    gap: spacing.xs,
  },
  metricTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  metricValue: {
    ...typography.h3,
    color: colors.text,
  },
})
