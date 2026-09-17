# ✅ Minhas Tarefas

Um organizador pessoal que cabe no dia a dia: tarefas, compromissos, metas e foco em um lugar só — sem cadastro, sem servidor, tudo salvo no seu navegador.

🔗 **[Acessar o app](https://josealbertodeev.github.io/lista-de-tarefas-app/)**

<img width="941" height="914" alt="image" src="https://github.com/user-attachments/assets/8699586c-70c1-43ac-80ab-a696fe0ee169" />

---

## ✨ O que ele faz

| | |
|---|---|
| 📝 **Tarefas** | Prioridade, categoria, prazo, subtarefas e favoritos. Arraste para reordenar. |
| 📋 **Quadro Kanban** | As mesmas tarefas em colunas, movidas com arrastar e soltar. |
| 📅 **Calendário** | Visão de mês e semana, compromissos recorrentes e feriados nacionais. |
| 🎯 **Metas** | Progresso por percentual ou por métrica (ex: 7 de 10 livros), com gráficos. |
| 🍅 **Pomodoro** | Ciclos de foco e pausa ligados a uma tarefa específica. |
| 🏆 **Conquistas** | 10 conquistas e um sistema de XP e níveis que acompanha sua constância. |
| 🔔 **Lembretes** | Avisos do navegador na hora do compromisso. |
| 🌓 **Tema** | Claro e escuro. |
| 💾 **Backup** | Exporte e importe tudo em um arquivo JSON. |

---

## 🚀 Rodando na sua máquina

Você precisa do [Node.js 20+](https://nodejs.org).

```bash
git clone https://github.com/josealbertodeev/lista-de-tarefas-app.git
cd lista-de-tarefas-app
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`) e pronto. 🎉

---

## 📜 Comandos

| Comando | Para quê |
|---|---|
| `npm run dev` | Sobe o app em modo desenvolvimento, recarregando a cada alteração. |
| `npm test` | Roda os testes. |
| `npm run lint` | Procura problemas no código. |
| `npm run build` | Gera a versão de produção na pasta `dist/`. |
| `npm run preview` | Abre localmente o que o `build` gerou. |

---

## 🛠️ Feito com

**React 19** · **TypeScript** · **Vite** · **Tailwind CSS** · **Zustand** (estado) · **Recharts** (gráficos) · **Vitest** (testes)

---

## 🗂️ Como o código está organizado

```
src/
├── components/   # Telas e peças de interface, agrupadas por área
├── stores/       # Estado global (tarefas, perfil, pomodoro, notificações)
├── lib/          # Regras de negócio e utilitários — é onde vivem os testes
└── types/        # Tipos compartilhados
```

---

## 💾 Onde ficam os seus dados

Tudo é salvo no **`localStorage` do seu navegador**. Nada sai da sua máquina, e não existe conta nem sincronização entre aparelhos.

> ⚠️ Limpar os dados do navegador apaga tudo. Antes disso, use **Configurações → Exportar Dados**.

---

