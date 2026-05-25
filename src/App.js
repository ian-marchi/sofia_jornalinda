import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { accentColors, colors, shadow } from "./theme";
import { days, focusAreas, monthlyGoals, reviewSeeds, schedule } from "./plannerData";

const STORAGE_KEY = "planner-enem-rosa:mobile";
const questionRows = 5;
const essayRows = 5;
const simulateRows = 4;
const taskTypes = ["Estudo", "Redação", "Simulado", "Pessoal"];
const essayCompetences = ["", "Competência 1", "Competência 2", "Competência 3", "Competência 4", "Competência 5"];
const reviewAreas = ["Matemática", "Natureza", "Redação", "Humanas", "Linguagens", "Geral"];

function monthValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function safeMonth(value) {
  return /^\d{4}-\d{2}$/.test(value) ? value : monthValue(new Date());
}

function monthLabel(value) {
  const [year, month] = safeMonth(value).split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function shiftMonth(value, amount) {
  const [year, month] = safeMonth(value).split("-").map(Number);
  return monthValue(new Date(year, month - 1 + amount, 1));
}

function calendarDays(month) {
  const normalizedMonth = safeMonth(month);
  const [year, monthNumber] = normalizedMonth.split("-").map(Number);
  const firstDate = new Date(year, monthNumber - 1, 1);
  const lastDate = new Date(year, monthNumber, 0);
  const firstOffset = (firstDate.getDay() + 6) % 7;
  return {
    month: normalizedMonth,
    blanks: Array.from({ length: firstOffset }, (_, index) => `blank-${index}`),
    dates: Array.from({ length: lastDate.getDate() }, (_, index) => index + 1),
  };
}

function makeDefaultState() {
  return {
    studentName: "",
    plannerMonth: monthValue(new Date()),
    targetScore: "",
    checkins: {},
    goals: Object.fromEntries(monthlyGoals.map((goal) => [goal.key, false])),
    goalAmounts: { essays: "", questions: "", simulates: "" },
    tasks: {},
    calendar: {},
    questions: Array.from({ length: questionRows }, () => ({ meta: "150", done: "" })),
    essays: Array.from({ length: essayRows }, () => ({
      date: "",
      theme: "",
      grade: "",
      competence: "",
      improve: "",
    })),
    reviews: reviewSeeds.map((review) => ({ ...review })),
    simulates: Array.from({ length: simulateRows }, () => ({
      date: "",
      math: "",
      nature: "",
      human: "",
      language: "",
      essay: "",
      note: "",
    })),
    extraTasks: [],
    extraDraft: "",
    extraType: "Estudo",
    errorNotebook: "",
    backupImport: "",
  };
}

function mergeState(saved) {
  const defaults = makeDefaultState();
  return {
    ...defaults,
    ...saved,
    goals: { ...defaults.goals, ...(saved?.goals || {}) },
    goalAmounts: { ...defaults.goalAmounts, ...(saved?.goalAmounts || {}) },
    checkins: { ...defaults.checkins, ...(saved?.checkins || {}) },
    tasks: { ...defaults.tasks, ...(saved?.tasks || {}) },
    calendar: { ...defaults.calendar, ...(saved?.calendar || {}) },
    questions: defaults.questions.map((row, index) => ({ ...row, ...(saved?.questions?.[index] || {}) })),
    essays: defaults.essays.map((row, index) => ({ ...row, ...(saved?.essays?.[index] || {}) })),
    reviews: defaults.reviews.map((row, index) => ({ ...row, ...(saved?.reviews?.[index] || {}) })),
    simulates: defaults.simulates.map((row, index) => ({ ...row, ...(saved?.simulates?.[index] || {}) })),
    extraTasks: Array.isArray(saved?.extraTasks) ? saved.extraTasks : defaults.extraTasks,
  };
}

function Section({ title, description, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Card({ children, tone = "default", style }) {
  return <View style={[styles.card, toneStyles[tone], style]}>{children}</View>;
}

function PrimaryButton({ label, onPress, variant = "default", style }) {
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonDefault,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, primary && styles.buttonPrimaryText]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#b38a9c"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function CheckRow({ checked, onPress, title, detail, right }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Text style={styles.checkboxText}>✓</Text> : null}
      </View>
      <View style={styles.checkText}>
        <Text style={[styles.checkTitle, checked && styles.checkedText]}>{title}</Text>
        {detail ? <Text style={[styles.checkDetail, checked && styles.checkedText]}>{detail}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

function MiniStat({ label, value, helper }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHelper}>{helper}</Text>
    </Card>
  );
}

function ProgressBar({ value, color = colors.rose }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option || "empty"}
            onPress={() => onChange(option)}
            style={({ pressed }) => [styles.segment, selected && styles.segmentOn, pressed && styles.pressed]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>{option || "Escolha"}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const [planner, setPlanner] = useState(makeDefaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted || !raw) return;
        setPlanner(mergeState(JSON.parse(raw)));
      })
      .catch(() => {
        Alert.alert("Planner", "Não consegui carregar os dados salvos.");
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(planner)).catch(() => {
      Alert.alert("Planner", "Não consegui salvar suas alterações.");
    });
  }, [planner, loaded]);

  const calendar = useMemo(() => calendarDays(planner.plannerMonth), [planner.plannerMonth]);
  const metrics = useMemo(() => buildMetrics(planner), [planner]);
  const today = schedule[(new Date().getDay() + 6) % 7];

  function patch(patchValue) {
    setPlanner((current) => ({ ...current, ...patchValue }));
  }

  function patchObject(key, patchValue) {
    setPlanner((current) => ({
      ...current,
      [key]: { ...current[key], ...patchValue },
    }));
  }

  function toggleMap(key, itemKey) {
    setPlanner((current) => ({
      ...current,
      [key]: { ...current[key], [itemKey]: !current[key]?.[itemKey] },
    }));
  }

  function patchArray(key, index, patchValue) {
    setPlanner((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patchValue } : item)),
    }));
  }

  function addExtraTask() {
    const title = planner.extraDraft.trim();
    if (!title) {
      Alert.alert("Tarefa extra", "Escreva uma tarefa antes de adicionar.");
      return;
    }

    const task = {
      id: `task-${Date.now()}`,
      title,
      type: planner.extraType,
      done: false,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };

    setPlanner((current) => ({
      ...current,
      extraDraft: "",
      extraTasks: [task, ...current.extraTasks],
    }));
  }

  function toggleExtraTask(id) {
    setPlanner((current) => ({
      ...current,
      extraTasks: current.extraTasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
  }

  function removeExtraTask(id) {
    setPlanner((current) => ({
      ...current,
      extraTasks: current.extraTasks.filter((task) => task.id !== id),
    }));
  }

  async function exportPlanner() {
    const payload = {
      name: "Planner ENEM",
      version: 1,
      exportedAt: new Date().toISOString(),
      planner,
    };
    await Share.share({ message: JSON.stringify(payload, null, 2) });
  }

  function importPlanner() {
    try {
      const payload = JSON.parse(planner.backupImport);
      const incoming = payload.planner || payload;
      setPlanner({ ...mergeState(incoming), backupImport: "" });
      Alert.alert("Planner", "Dados importados.");
    } catch {
      Alert.alert("Importar dados", "Cole um JSON exportado válido antes de importar.");
    }
  }

  function resetChecks() {
    Alert.alert("Limpar checks", "Os textos serão mantidos. Quer limpar apenas as marcações?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar",
        style: "destructive",
        onPress: () => {
          setPlanner((current) => ({
            ...current,
            checkins: {},
            goals: Object.fromEntries(monthlyGoals.map((goal) => [goal.key, false])),
            tasks: {},
            calendar: {},
            reviews: current.reviews.map((review) => ({ ...review, done: false })),
            extraTasks: current.extraTasks.map((task) => ({ ...task, done: false })),
          }));
        },
      },
    ]);
  }

  if (!loaded) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.rose} size="large" />
        <Text style={styles.loadingText}>Carregando planner...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandIcon}>▦</Text>
            </View>
            <Text style={styles.brandText}>Planner ENEM</Text>
          </View>
          <Text style={styles.heroTitle}>Planner ENEM</Text>
          <Text style={styles.heroText}>
            Cronograma adaptado para manter constância em Matemática, Natureza, Redação e revisões estratégicas,
            respeitando curso, educação física e ensaios.
          </Text>

          <View style={styles.fieldGrid}>
            <Field label="Nome" value={planner.studentName} onChangeText={(studentName) => patch({ studentName })} placeholder="Seu nome" />
            <Field label="Mês" value={planner.plannerMonth} onChangeText={(plannerMonth) => patch({ plannerMonth })} placeholder="2026-05" />
            <Field
              label="Meta de nota"
              value={planner.targetScore}
              onChangeText={(targetScore) => patch({ targetScore })}
              placeholder="Ex.: 780"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Exportar" onPress={exportPlanner} variant="primary" />
            <PrimaryButton label="Limpar checks" onPress={resetChecks} />
          </View>

          <Card style={styles.heroCard}>
            <Text style={styles.cardTitle}>Check-ins da semana</Text>
            <Text style={styles.heroPercent}>{metrics.progress}%</Text>
            <ProgressBar value={metrics.progress} />
            <Text style={styles.muted}>{metrics.checked} de {metrics.total} marcações concluídas.</Text>
            <View style={styles.dayStrip}>
              {days.map((day) => (
                <Pressable
                  key={day}
                  onPress={() => toggleMap("checkins", day)}
                  style={[styles.dayPill, planner.checkins[day] && styles.dayPillOn]}
                >
                  <Text style={[styles.dayPillText, planner.checkins[day] && styles.dayPillTextOn]}>{day}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        </View>

        <Section title="Painel rápido" description="Resumo vivo do que já foi marcado, registrado e planejado para a semana.">
          <View style={styles.metricGrid}>
            <MiniStat label="Progresso geral" value={`${metrics.progress}%`} helper={`${metrics.checked} de ${metrics.total} marcações.`} />
            <MiniStat label="Dias no mês" value={String(metrics.studyDays)} helper="Dias marcados no calendário." />
            <MiniStat label="Questões feitas" value={String(metrics.questionsDone)} helper={`${metrics.questionsLeft} para bater a meta.`} />
            <MiniStat label="Média redação" value={String(metrics.essayAverage)} helper={`${metrics.essayCount} notas registradas.`} />
          </View>
          <Card style={styles.spacedCard}>
            <Text style={styles.cardTitle}>Hoje no plano</Text>
            <Detail label="Dia" value={today.day} />
            <Detail label="Foco" value={today.title} />
            <Detail label="Ritmo" value={today.weight} />
          </Card>
          <Card tone="sage" style={styles.spacedCard}>
            <Text style={styles.cardTitle}>Próximas revisões</Text>
            {metrics.reviewQueue.length === 0 ? (
              <Text style={styles.muted}>Todas as revisões cadastradas estão marcadas como feitas.</Text>
            ) : (
              metrics.reviewQueue.map((review, index) => <Detail key={`${review.subject}-${index}`} label={review.action} value={review.subject} />)
            )}
          </Card>
        </Section>

        <Section title="Metas do mês" description="Prioridades mensais com espaço para ajustar redações, questões e simulados.">
          <Card>
            <Text style={styles.cardTitle}>Lista principal</Text>
            {monthlyGoals.map((goal) => (
              <CheckRow
                key={goal.key}
                checked={Boolean(planner.goals[goal.key])}
                onPress={() => toggleMap("goals", goal.key)}
                title={goal.title}
                detail={goal.detail}
                right={
                  goal.amountKey ? (
                    <TextInput
                      value={planner.goalAmounts[goal.amountKey]}
                      onChangeText={(value) => patchObject("goalAmounts", { [goal.amountKey]: value })}
                      placeholder="__"
                      placeholderTextColor="#b38a9c"
                      keyboardType="numeric"
                      style={styles.smallInput}
                    />
                  ) : null
                }
              />
            ))}
          </Card>
          <Card tone="lemon" style={styles.spacedCard}>
            <Text style={styles.cardTitle}>Meta semanal ideal</Text>
            <Detail label="Questões" value="120 a 150" />
            <Detail label="Redação" value="1 completa" />
            <Detail label="Simulado" value="1 mini simulado" />
            <Detail label="Revisão" value="Erros + atualidades" />
          </Card>
        </Section>

        <Section title="Planner semanal fixo" description="Blocos distribuídos para evitar desgaste mental antes dos compromissos fixos.">
          {schedule.map((day, dayIndex) => (
            <Card key={day.day} style={styles.dayCard}>
              <View style={[styles.dayAccent, { backgroundColor: accentColors[day.accent] }]} />
              <View style={styles.dayTitleRow}>
                <Text style={styles.cardTitle}>{day.day} — {day.title}</Text>
                <Text style={styles.dayWeight}>{day.weight}</Text>
              </View>
              {day.tasks.map(([time, label], taskIndex) => {
                const taskKey = `${dayIndex}-${taskIndex}`;
                return (
                  <CheckRow
                    key={taskKey}
                    checked={Boolean(planner.tasks[taskKey])}
                    onPress={() => toggleMap("tasks", taskKey)}
                    title={time}
                    detail={label}
                  />
                );
              })}
            </Card>
          ))}
        </Section>

        <Section title="Calendário mensal" description="Marque os dias em que cumpriu pelo menos um bloco de estudo.">
          <Card>
            <View style={styles.calendarToolbar}>
              <PrimaryButton label="Anterior" onPress={() => patch({ plannerMonth: shiftMonth(planner.plannerMonth, -1) })} />
              <Text style={styles.calendarTitle}>{monthLabel(planner.plannerMonth)}</Text>
              <PrimaryButton label="Próximo" onPress={() => patch({ plannerMonth: shiftMonth(planner.plannerMonth, 1) })} />
            </View>
            <View style={styles.calendarGrid}>
              {days.map((day) => (
                <Text key={day} style={styles.calendarHead}>{day}</Text>
              ))}
              {calendar.blanks.map((blank) => <View key={blank} style={styles.calendarBlank} />)}
              {calendar.dates.map((date) => {
                const key = `${calendar.month}-${date}`;
                const checked = Boolean(planner.calendar[key]);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleMap("calendar", key)}
                    style={[styles.calendarDay, checked && styles.calendarDayOn]}
                  >
                    <Text style={[styles.calendarDayText, checked && styles.calendarDayTextOn]}>{date}</Text>
                    <Text style={[styles.calendarCheck, checked && styles.calendarCheckOn]}>✓</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </Section>

        <Section title="Controles" description="Registre questões, redações e evolução sem depender de aplicativo externo.">
          <Card>
            <Text style={styles.cardTitle}>Controle de questões</Text>
            {planner.questions.map((row, index) => {
              const meta = Number(row.meta || 150);
              const done = Number(row.done || 0);
              const percent = Math.round((done / Math.max(meta, 1)) * 100);
              return (
                <View key={`question-${index}`} style={styles.tableBlock}>
                  <Text style={styles.tableTitle}>Semana {index + 1}</Text>
                  <View style={styles.inlineFields}>
                    <Field label="Meta" value={row.meta} onChangeText={(metaValue) => patchArray("questions", index, { meta: metaValue })} keyboardType="numeric" />
                    <Field label="Feitas" value={row.done} onChangeText={(doneValue) => patchArray("questions", index, { done: doneValue })} keyboardType="numeric" />
                  </View>
                  <Text style={styles.muted}>Faltam {Math.max(meta - done, 0)} questões</Text>
                  <ProgressBar value={percent} color={colors.mint} />
                </View>
              );
            })}
          </Card>

          <Card style={styles.spacedCard}>
            <Text style={styles.cardTitle}>Controle de redação</Text>
            {planner.essays.map((row, index) => (
              <View key={`essay-${index}`} style={styles.tableBlock}>
                <Text style={styles.tableTitle}>Redação {index + 1}</Text>
                <Field label="Data" value={row.date} onChangeText={(date) => patchArray("essays", index, { date })} placeholder="__/__" />
                <Field label="Tema" value={row.theme} onChangeText={(theme) => patchArray("essays", index, { theme })} placeholder="Tema" />
                <Field label="Nota" value={row.grade} onChangeText={(grade) => patchArray("essays", index, { grade })} keyboardType="numeric" placeholder="0" />
                <Text style={styles.label}>Competência foco</Text>
                <Segmented options={essayCompetences} value={row.competence} onChange={(competence) => patchArray("essays", index, { competence })} />
                <Field label="Melhorar" value={row.improve} onChangeText={(improve) => patchArray("essays", index, { improve })} placeholder="Ponto de melhoria" />
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Revisões" description="Organize assuntos que precisam voltar em 24 horas, 7 dias ou no ciclo de fim de semana.">
          <Card>
            {planner.reviews.map((row, index) => (
              <View key={`review-${index}`} style={styles.tableBlock}>
                <CheckRow
                  checked={row.done}
                  onPress={() => patchArray("reviews", index, { done: !row.done })}
                  title={row.subject || `Revisão ${index + 1}`}
                  detail={`${row.area || "Área"} · ${row.action || "Próxima ação"}`}
                />
                <Field label="Data" value={row.date} onChangeText={(date) => patchArray("reviews", index, { date })} placeholder="__/__" />
                <Field label="Assunto" value={row.subject} onChangeText={(subject) => patchArray("reviews", index, { subject })} />
                <Text style={styles.label}>Área</Text>
                <Segmented options={reviewAreas} value={row.area} onChange={(area) => patchArray("reviews", index, { area })} />
                <Field label="Próxima ação" value={row.action} onChangeText={(action) => patchArray("reviews", index, { action })} />
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Simulados" description="Registre desempenho por área para enxergar onde a próxima semana deve ficar mais pesada.">
          <Card>
            {planner.simulates.map((row, index) => (
              <View key={`simulate-${index}`} style={styles.tableBlock}>
                <Text style={styles.tableTitle}>Simulado {index + 1}</Text>
                <Field label="Data" value={row.date} onChangeText={(date) => patchArray("simulates", index, { date })} placeholder="__/__" />
                <View style={styles.inlineFields}>
                  <Field label="Matemática" value={row.math} onChangeText={(math) => patchArray("simulates", index, { math })} keyboardType="numeric" />
                  <Field label="Natureza" value={row.nature} onChangeText={(nature) => patchArray("simulates", index, { nature })} keyboardType="numeric" />
                </View>
                <View style={styles.inlineFields}>
                  <Field label="Humanas" value={row.human} onChangeText={(human) => patchArray("simulates", index, { human })} keyboardType="numeric" />
                  <Field label="Linguagens" value={row.language} onChangeText={(language) => patchArray("simulates", index, { language })} keyboardType="numeric" />
                </View>
                <Field label="Redação" value={row.essay} onChangeText={(essay) => patchArray("simulates", index, { essay })} keyboardType="numeric" />
                <Field label="Observação" value={row.note} onChangeText={(note) => patchArray("simulates", index, { note })} placeholder="O que ajustar" />
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Tarefas extras" description="Use para demandas soltas: prova, trabalho, leitura, inscrição, aula ou revisão emergencial.">
          <Card>
            <Field label="Nova tarefa" value={planner.extraDraft} onChangeText={(extraDraft) => patch({ extraDraft })} placeholder="Nova tarefa" />
            <Text style={styles.label}>Tipo</Text>
            <Segmented options={taskTypes} value={planner.extraType} onChange={(extraType) => patch({ extraType })} />
            <PrimaryButton label="Adicionar" onPress={addExtraTask} variant="primary" style={styles.fullButton} />
            {planner.extraTasks.length === 0 ? (
              <Text style={styles.emptyState}>Nenhuma tarefa extra cadastrada ainda.</Text>
            ) : (
              planner.extraTasks.map((task) => (
                <View key={task.id} style={styles.extraTask}>
                  <CheckRow checked={task.done} onPress={() => toggleExtraTask(task.id)} title={task.title} detail={`${task.type} · criado em ${task.createdAt}`} />
                  <PrimaryButton label="Remover" onPress={() => removeExtraTask(task.id)} />
                </View>
              ))
            )}
          </Card>
        </Section>

        <Section title="Caderno de erros" description="Use este espaço para padrões de erro, fórmulas esquecidas e temas que precisam voltar.">
          <Card>
            <Field
              label="Anotações"
              value={planner.errorNotebook}
              onChangeText={(errorNotebook) => patch({ errorNotebook })}
              placeholder={"- Matemática:\n- Natureza:\n- Redação:\n- Revisar novamente em:"}
              multiline
            />
          </Card>
          <Card tone="sky" style={styles.spacedCard}>
            <Text style={styles.cardTitle}>Estratégia ideal para sua rotina</Text>
            <Detail label="Segunda" value="Matemática com foco forte e revisão de fórmulas." />
            <Detail label="Terça" value="Física antes da educação física e Redação à noite." />
            <Detail label="Sexta" value="Dia mais leve, com Biologia e escrita/correção após ensaio." />
            <Detail label="Domingo" value="Escolha entre descanso real ou revisão geral da semana." />
          </Card>
        </Section>

        <Section title="Foco principal" description="Conteúdos com maior retorno para manter no topo das revisões até o ENEM.">
          {focusAreas.map((area) => (
            <Card key={area.title} style={styles.focusCard}>
              <Text style={styles.cardTitle}>{area.title}</Text>
              {area.items.map((item) => (
                <View key={item} style={styles.focusRow}>
                  <View style={[styles.dot, { backgroundColor: accentColors[area.accent] }]} />
                  <Text style={styles.focusText}>{item}</Text>
                </View>
              ))}
            </Card>
          ))}
        </Section>

        <Section title="Backup" description="Exporte seus dados pelo compartilhamento do celular ou importe um JSON salvo.">
          <Card>
            <PrimaryButton label="Exportar dados" onPress={exportPlanner} variant="primary" />
            <Field
              label="Importar JSON"
              value={planner.backupImport}
              onChangeText={(backupImport) => patch({ backupImport })}
              placeholder="Cole aqui o JSON exportado"
              multiline
            />
            <PrimaryButton label="Importar dados" onPress={importPlanner} />
          </Card>
        </Section>

        <Text style={styles.footer}>Feito para estudar com leveza, constância e revisão inteligente.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function buildMetrics(planner) {
  const { month, dates } = calendarDays(planner.plannerMonth);
  const totalTasks = schedule.reduce((sum, day) => sum + day.tasks.length, 0);
  const total = days.length + monthlyGoals.length + totalTasks + dates.length + planner.reviews.length + planner.extraTasks.length;
  const checked =
    Object.values(planner.checkins).filter(Boolean).length +
    Object.values(planner.goals).filter(Boolean).length +
    Object.values(planner.tasks).filter(Boolean).length +
    dates.filter((date) => planner.calendar[`${month}-${date}`]).length +
    planner.reviews.filter((review) => review.done).length +
    planner.extraTasks.filter((task) => task.done).length;

  const questionMeta = planner.questions.reduce((sum, row) => sum + Number(row.meta || 0), 0);
  const questionsDone = planner.questions.reduce((sum, row) => sum + Number(row.done || 0), 0);
  const grades = planner.essays.map((row) => Number(row.grade || 0)).filter(Boolean);
  const essayAverage = grades.length ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length) : 0;

  return {
    checked,
    total,
    progress: Math.round((checked / Math.max(total, 1)) * 100),
    studyDays: dates.filter((date) => planner.calendar[`${month}-${date}`]).length,
    questionsDone,
    questionsLeft: Math.max(questionMeta - questionsDone, 0),
    essayAverage,
    essayCount: grades.length,
    reviewQueue: planner.reviews.filter((review) => !review.done && review.subject).slice(0, 3),
  };
}

const toneStyles = StyleSheet.create({
  default: {},
  lemon: { backgroundColor: colors.surfaceLemon },
  sage: { backgroundColor: colors.surfaceSage },
  sky: { backgroundColor: colors.surfaceSky },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 36,
  },
  hero: {
    gap: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(217, 95, 141, 0.24)",
    backgroundColor: colors.bgStrong,
  },
  brandIcon: {
    color: colors.roseDeep,
    fontWeight: "900",
    fontSize: 20,
  },
  brandText: {
    color: colors.roseDeep,
    fontSize: 16,
    fontWeight: "900",
  },
  heroTitle: {
    maxWidth: 310,
    color: colors.ink,
    fontSize: 58,
    fontWeight: "900",
    lineHeight: 62,
  },
  heroText: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  fieldGrid: {
    gap: 12,
  },
  field: {
    gap: 7,
    flex: 1,
  },
  label: {
    color: colors.roseDeep,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "rgba(217, 95, 141, 0.22)",
    borderRadius: 8,
    paddingHorizontal: 12,
    color: colors.ink,
    backgroundColor: "rgba(255,255,255,0.86)",
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  smallInput: {
    width: 70,
    minHeight: 38,
    borderWidth: 1,
    borderColor: "rgba(217, 95, 141, 0.24)",
    borderRadius: 8,
    paddingHorizontal: 8,
    color: colors.roseDeep,
    backgroundColor: colors.surface,
    textAlign: "center",
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  buttonDefault: {
    borderColor: "rgba(217, 95, 141, 0.18)",
    backgroundColor: colors.surface,
  },
  buttonPrimary: {
    borderColor: colors.rose,
    backgroundColor: colors.rose,
  },
  buttonText: {
    color: colors.roseDeep,
    fontSize: 14,
    fontWeight: "900",
  },
  buttonPrimaryText: {
    color: colors.surface,
  },
  fullButton: {
    marginTop: 12,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(217, 95, 141, 0.16)",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.88)",
    ...shadow,
  },
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 23,
  },
  heroPercent: {
    color: colors.roseDeep,
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 42,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  dayStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayPill: {
    minWidth: 48,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(217, 95, 141, 0.2)",
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  dayPillOn: {
    borderColor: colors.rose,
    backgroundColor: colors.rose,
  },
  dayPillText: {
    color: colors.muted,
    fontWeight: "900",
  },
  dayPillTextOn: {
    color: colors.surface,
  },
  section: {
    gap: 14,
    marginTop: 24,
  },
  sectionHead: {
    gap: 6,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  metricGrid: {
    gap: 12,
  },
  metricCard: {
    minHeight: 116,
  },
  metricLabel: {
    color: colors.roseDeep,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900",
  },
  metricHelper: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  spacedCard: {
    marginTop: 2,
  },
  detailRow: {
    gap: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(217, 95, 141, 0.13)",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  detailLabel: {
    color: colors.roseDeep,
    fontWeight: "900",
  },
  detailValue: {
    color: colors.muted,
    lineHeight: 20,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(217, 95, 141, 0.14)",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(217, 95, 141, 0.42)",
    borderRadius: 7,
    backgroundColor: colors.surface,
  },
  checkboxOn: {
    borderColor: colors.rose,
    backgroundColor: colors.rose,
  },
  checkboxText: {
    color: colors.surface,
    fontWeight: "900",
  },
  checkText: {
    flex: 1,
    gap: 2,
  },
  checkTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  checkDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  checkedText: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  dayCard: {
    overflow: "hidden",
  },
  dayAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 5,
  },
  dayTitleRow: {
    gap: 4,
    paddingTop: 5,
  },
  dayWeight: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  progressTrack: {
    overflow: "hidden",
    height: 9,
    borderRadius: 999,
    backgroundColor: "#f5d6e0",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  calendarToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  calendarTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "capitalize",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  calendarHead: {
    width: "13.55%",
    color: colors.roseDeep,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
  },
  calendarBlank: {
    width: "13.55%",
    minHeight: 54,
  },
  calendarDay: {
    width: "13.55%",
    minHeight: 54,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(217, 95, 141, 0.14)",
    borderRadius: 8,
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  calendarDayOn: {
    borderColor: "rgba(79, 154, 112, 0.32)",
    backgroundColor: colors.surfaceSage,
  },
  calendarDayText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  calendarDayTextOn: {
    color: colors.mint,
  },
  calendarCheck: {
    alignSelf: "flex-end",
    color: "transparent",
    fontSize: 12,
    fontWeight: "900",
  },
  calendarCheckOn: {
    color: colors.mint,
  },
  tableBlock: {
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217, 95, 141, 0.12)",
  },
  tableTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  inlineFields: {
    flexDirection: "row",
    gap: 10,
  },
  segmented: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segment: {
    minHeight: 34,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(217, 95, 141, 0.18)",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
  },
  segmentOn: {
    borderColor: colors.rose,
    backgroundColor: colors.bgStrong,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  segmentTextOn: {
    color: colors.roseDeep,
  },
  emptyState: {
    padding: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(217, 95, 141, 0.28)",
    borderRadius: 8,
    color: colors.muted,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  extraTask: {
    gap: 8,
    paddingTop: 12,
  },
  focusCard: {
    gap: 10,
  },
  focusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217, 95, 141, 0.1)",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  focusText: {
    flex: 1,
    color: colors.muted,
    lineHeight: 20,
  },
  footer: {
    marginTop: 26,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
