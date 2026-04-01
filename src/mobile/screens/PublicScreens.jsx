import { useState } from "react"
import { Modal, ScrollView, StyleSheet, Switch, Text, View } from "react-native"
import EntryShell from "../../components/EntryShell"
import { getGoogleRedirectUrl, signInWithGoogle } from "../../lib/googleAuth"
import { getPerfil, upsertPerfil } from "../../lib/profileService"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { useUserStore } from "../../store/userStore"
import { Button, InputField, OptionCard, StatusCard } from "../ui"
import { colors, radius, spacing, typography } from "../theme"

const termsSections = [
  {
    title: "1. Finalidade do aplicativo",
    paragraphs: [
      "O aplicativo oferece recursos de apoio a organizacao alimentar, acompanhamento pessoal, check-ins, cardapios, receitas e visualizacao de progresso.",
      "O conteudo exibido tem finalidade informativa e de suporte a rotina do usuario, sem substituir avaliacao profissional individual.",
    ],
  },
  {
    title: "2. Receitas, recomendacoes e uso de IA",
    paragraphs: [
      "Parte das receitas, sugestoes, organizacao de cardapios e recomendacoes exibidas pode ser gerada, adaptada, resumida ou organizada com apoio de inteligencia artificial.",
      "Apesar de buscarmos clareza e utilidade, podem existir imprecisoes, inconsistencias, omissoes ou inadequacoes para casos especificos.",
    ],
  },
  {
    title: "3. Nao substitui atendimento profissional",
    paragraphs: [
      "O aplicativo nao realiza diagnostico e nao substitui consulta com nutricionista, medico ou outro profissional habilitado.",
      "Pessoas com restricoes, alergias, condicoes de saude ou situacoes especiais devem buscar orientacao profissional antes de seguir qualquer plano.",
    ],
  },
]

const privacySections = [
  {
    title: "1. Dados que podem ser tratados",
    paragraphs: [
      "Podemos tratar dados cadastrais e dados inseridos pelo proprio usuario, como nome, email, idade, peso, altura, objetivo e check-ins.",
    ],
  },
  {
    title: "2. Finalidade do tratamento",
    paragraphs: [
      "Os dados sao usados para criar a conta, personalizar a experiencia, salvar evolucao e sincronizar o historico.",
    ],
  },
  {
    title: "3. Direitos do usuario",
    paragraphs: [
      "O usuario pode solicitar correcao, atualizacao ou exclusao quando cabivel, conforme a legislacao aplicavel.",
    ],
  },
]

function Feedback({ message }) {
  if (!message) return null
  return <StatusCard tone="warning" title="Ajuste necessario" description={message} />
}

async function syncAuthenticatedUser(userId) {
  if (!userId) return

  await upsertPerfil(userId, useUserStore.getState())
  const { perfil } = await getPerfil(userId)
  if (perfil) {
    useUserStore.getState().setPerfil(perfil)
  }
}

async function loadExistingProfile(userId) {
  if (!userId) return false

  const { perfil } = await getPerfil(userId)
  if (!perfil) {
    return false
  }

  useUserStore.getState().setPerfil(perfil)
  return true
}

async function createProfileFromCurrentOnboarding(userId) {
  if (!userId) return
  await syncAuthenticatedUser(userId)
}

export function HomeScreen({ navigation }) {
  const resetOnboarding = useUserStore((state) => state.resetOnboarding)

  return (
    <EntryShell
      eyebrow="Nutricao inteligente"
      title="Painel nutricional pronto para celular"
      description="Organize sua alimentacao, acompanhe sua evolucao e monte refeicoes com uma experiencia pensada para mobile."
      footer="Escolha como deseja comecar e siga com uma jornada mais organizada desde o primeiro acesso."
      highlights={[
        { title: "Check-ins semanais", description: "Peso e historico reunidos em um acompanhamento simples." },
        { title: "Cardapios por refeicao", description: "Receitas distribuidas por momento do dia e objetivo." },
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
      setErro("Confirme os Termos de Uso e a Politica de Privacidade para continuar.")
      return
    }

    setErro("")
    navigation.navigate("Nome")
  }

  return (
    <EntryShell eyebrow="Termos e privacidade" title="Leia antes de iniciar">
      <Text style={styles.copy}>
        Leia o texto completo dos Termos de Uso e da Politica de Privacidade no botao abaixo. Depois, confirme os aceites para continuar.
      </Text>

      <Button label="Abrir termos e privacidade" variant="secondary" onPress={() => setVisible(true)} />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Li e concordo com os Termos de Uso.</Text>
        <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} trackColor={{ true: colors.brand }} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Li e concordo com a Politica de Privacidade.</Text>
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
              <View key={section.title} style={styles.modalCard}>
                <Text style={styles.modalSectionTitle}>{section.title}</Text>
                {section.paragraphs.map((paragraph) => (
                  <Text key={paragraph} style={styles.modalParagraph}>{paragraph}</Text>
                ))}
              </View>
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
}) {
  return function InputScreen({ navigation }) {
    const setField = useUserStore((state) => state[storeKey])
    const [value, setValue] = useState("")
    const [erro, setErro] = useState("")

    function continuar() {
      if (!String(value).trim()) {
        setErro("Preencha este campo para continuar.")
        return
      }

      setErro("")
      setField(String(value).trim())
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
  title: "Como voce gostaria de se identificar?",
  description: "Esse nome sera usado para personalizar o painel e deixar sua jornada mais clara.",
  label: "Nome",
  placeholder: "Digite o nome",
  nextRoute: "Idade",
  storeKey: "setNome",
  step: 1,
})

export const IdadeScreen = buildInputScreen({
  title: "Qual e a sua idade?",
  description: "A idade entra na estimativa metabolica e ajuda a calibrar melhor o plano inicial.",
  label: "Idade",
  placeholder: "Ex: 32",
  keyboardType: "number-pad",
  nextRoute: "Peso",
  storeKey: "setIdade",
  step: 2,
})

export const PesoScreen = buildInputScreen({
  title: "Qual e o peso atual?",
  description: "Esse dado ajuda a compor a base metabolica e sera o primeiro marco da evolucao.",
  label: "Peso em kg",
  placeholder: "Ex: 72.4",
  keyboardType: "decimal-pad",
  nextRoute: "Altura",
  storeKey: "setPeso",
  step: 3,
})

export const AlturaScreen = buildInputScreen({
  title: "Qual e a sua altura?",
  description: "Junto com peso e idade, essa medida deixa a estimativa metabolica mais consistente.",
  label: "Altura em cm",
  placeholder: "Ex: 168",
  keyboardType: "number-pad",
  nextRoute: "Sexo",
  storeKey: "setAltura",
  step: 4,
})

export function SexoScreen({ navigation }) {
  const setSexo = useUserStore((state) => state.setSexo)

  return (
    <EntryShell
      step={5}
      totalSteps={7}
      title="Qual referencia biologica devemos considerar?"
      description="Essa informacao sera usada somente para compor o calculo metabolico basal."
    >
      <OptionCard title="Masculino" description="Usar formula de referencia masculina no calculo." onPress={() => {
        setSexo("masculino")
        navigation.navigate("NivelAtividade")
      }} />
      <OptionCard title="Feminino" description="Usar formula de referencia feminina no calculo." onPress={() => {
        setSexo("feminino")
        navigation.navigate("NivelAtividade")
      }} />
    </EntryShell>
  )
}

export function NivelAtividadeScreen({ navigation }) {
  const setAtividade = useUserStore((state) => state.setAtividade)

  const options = [
    ["sedentario", "Sedentario", "Rotina com pouca ou nenhuma atividade fisica regular."],
    ["leve", "Leve", "Movimento leve ao longo da semana ou exercicios ocasionais."],
    ["moderado", "Moderado", "Treinos frequentes ou rotina ativa na maior parte da semana."],
    ["alto", "Alto", "Volume de treino elevado ou rotina fisicamente exigente."],
    ["muito_alto", "Muito alto", "Atividade intensa, diaria e com demanda energetica elevada."],
  ]

  return (
    <EntryShell
      step={6}
      totalSteps={7}
      title="Qual e o nivel de atividade atual?"
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
    ["emagrecer", "Emagrecimento", "Foco em reducao de gordura com controle calorico e saciedade."],
    ["manter", "Manutencao", "Equilibrio para manter peso e rotina alimentar consistentes."],
    ["ganhar_massa", "Ganho de massa", "Maior suporte calorico e proteico para evolucao muscular."],
  ]

  return (
    <EntryShell
      step={7}
      totalSteps={7}
      title="Qual e o objetivo principal?"
      description="Defina a direcao principal do plano para gerar uma estrategia inicial mais coerente."
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
    objetivo === "emagrecer" ? "emagrecimento" : objetivo === "ganhar_massa" ? "ganho de massa" : "manutencao"

  const pesoNum = Number(peso)
  const alturaNum = Number(altura)
  const idadeNum = Number(idade)
  const dadosCompletos = Boolean(peso && altura && idade && sexo)

  let tmb = 0
  if (dadosCompletos) {
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
      setErro("Complete as etapas anteriores para gerar o resumo metabolico corretamente.")
      navigation.navigate("Nome")
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
      eyebrow="Resumo metabolico"
      title={`Base inicial de ${nome || "voce"}`}
      description={`Com os dados preenchidos, ja temos uma estimativa inicial para orientar o plano de ${objetivoTexto}.`}
      footer="No proximo passo, voce cria a conta para salvar sua base inicial e seguir com o painel completo."
      highlights={[
        { title: "TMB estimada", description: "Uma referencia inicial para entender o metabolismo basal." },
        { title: "Direcao do plano", description: "Ajuste calorico inicial alinhado ao objetivo definido." },
      ]}
    >
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>TMB</Text>
          <Text style={styles.metricValue}>{Math.round(tmb)} kcal</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Gasto diario</Text>
          <Text style={styles.metricValue}>{Math.round(tdee)} kcal</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Meta inicial</Text>
          <Text style={styles.metricValue}>{Math.round(caloriasObjetivo)} kcal</Text>
        </View>
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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [mensagem, setMensagem] = useState("")

  async function onSubmit() {
    setLoading(true)
    setErro("")
    setMensagem("")

    try {
      const result = await submitAction({
        email,
        senha,
        setErro,
        setMensagem,
      })

      if (result?.finallyMessage) {
        setMensagem(result.finallyMessage)
      }
    } catch (error) {
      setErro(error?.message ?? "Ocorreu um erro inesperado ao processar sua autenticacao.")
    } finally {
      setLoading(false)
    }
  }

  async function loginGoogle() {
    setGoogleLoading(true)
    setErro("")
    setMensagem("")

    try {
      const { session, error, cancelled, redirectTo } = await signInWithGoogle()

      if (cancelled) {
        setMensagem("Login com Google cancelado antes da confirmacao.")
        return
      }

      if (error) {
        setErro(
          `${error.message} Verifique tambem se o redirect URI ${redirectTo} esta liberado no Supabase e no Google.`,
        )
        return
      }

      const userId = session?.user?.id
      if (userId) {
        await syncAuthenticatedUser(userId)
      }

      setMensagem("Login com Google concluido com sucesso.")
    } catch (error) {
      setErro(error?.message ?? "Ocorreu um erro inesperado ao iniciar o login com Google.")
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <EntryShell
      eyebrow="Acesso"
      title={title}
      description={description}
      footer="Se este for seu primeiro acesso, crie uma conta para salvar sua evolucao e organizar sua rotina."
      highlights={[
        { title: "Historico sincronizado", description: "Check-ins e dados da sua jornada reunidos com seguranca." },
        { title: "Entrada flexivel", description: "Acesse com email e senha ou finalize com Google via callback mobile." },
      ]}
    >
      <InputField
        label="Email"
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
      <Button
        label={googleLoading ? "Abrindo Google..." : "Continuar com Google"}
        variant="secondary"
        onPress={loginGoogle}
        disabled={loading || googleLoading}
      />
      <StatusCard
        title="Redirect mobile configurado"
        description={`Cadastre este callback no Supabase e no provedor Google: ${getGoogleRedirectUrl()}`}
      />
      <Button label={secondaryLabel} variant="ghost" onPress={secondaryAction.action} />
    </EntryShell>
  )
}

export function LoginScreen({ navigation }) {
  async function submitAction({ email, senha, setErro }) {
    if (!hasSupabaseConfig || !supabase) {
      setErro("Conexao com o Supabase nao configurada. Revise as variaveis EXPO_PUBLIC para continuar.")
      return null
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro("Nao foi possivel entrar com esse email e senha. Revise os dados e tente novamente.")
      return null
    }

    const userId = data.user?.id
    if (userId) {
      const loadedExistingProfile = await loadExistingProfile(userId)
      if (!loadedExistingProfile) {
        await createProfileFromCurrentOnboarding(userId)
      }
    }

    return {}
  }

  return (
    <AuthForm
      title="Acesse seu painel"
      description="Retome seu acompanhamento com historico, cardapios e dados pessoais sincronizados em um unico lugar."
      buttonLabel="Entrar"
      secondaryLabel="Criar nova conta"
      secondaryAction={{ navigation, action: () => navigation.navigate("CriarConta") }}
      submitAction={submitAction}
    />
  )
}

export function CriarContaScreen({ navigation }) {
  async function submitAction({ email, senha, setErro, setMensagem }) {
    if (!hasSupabaseConfig || !supabase) {
      setErro("Conexao com o Supabase nao configurada. Revise as variaveis EXPO_PUBLIC para continuar.")
      return null
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    })

    if (error) {
      setErro("Nao foi possivel criar sua conta agora. Revise os dados e tente novamente.")
      return null
    }

    const userId = data.user?.id
    if (userId) {
      await createProfileFromCurrentOnboarding(userId)
    }

    setMensagem("Conta criada com sucesso.")
    return { finallyMessage: data.session ? "Conta criada com sucesso." : "Conta criada. Confirme seu email se o Supabase exigir verificacao." }
  }

  return (
    <AuthForm
      title="Crie sua conta"
      description="Conecte seu onboarding ao Supabase para manter historico, cardapios e progresso sincronizados."
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
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
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
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
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
