import { describe, it, expect } from 'vitest';
import { parseBackup, serializeBackup, mergeById } from './backup';

const validTask = {
  id: 't1',
  title: 'Revisar sprint',
  category: 'Trabalho',
  priority: 'Alta',
  status: 'backlog',
  dueDate: '2026-09-20',
  pomodoroEstimate: 2,
  pomodorosCompleted: 0,
  subtasks: [],
  createdAt: '2026-09-13T12:00:00.000Z',
};

function backupWith(extra: Record<string, unknown>): string {
  return JSON.stringify({ schemaVersion: 1, exportedAt: '2026-09-13T12:00:00.000Z', tasks: [], appointments: [], goals: [], ...extra });
}

describe('parseBackup — arquivos inválidos', () => {
  it('recusa JSON malformado sem lançar exceção', () => {
    const result = parseBackup('{ "tasks": [');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('JSON');
  });

  it('recusa JSON válido que não é um backup', () => {
    expect(parseBackup('{"foo":1}').ok).toBe(false);
    expect(parseBackup('"texto"').ok).toBe(false);
    expect(parseBackup('[]').ok).toBe(false);
  });
});

describe('parseBackup — saneamento', () => {
  it('mantém uma tarefa válida intacta', () => {
    const result = parseBackup(backupWith({ tasks: [validTask] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.tasks).toEqual({ kept: 1, skipped: 0 });
    expect(result.data.tasks[0].title).toBe('Revisar sprint');
    expect(result.data.tasks[0].priority).toBe('Alta');
  });

  it('descarta tarefas sem título em vez de abortar o arquivo inteiro', () => {
    const result = parseBackup(backupWith({ tasks: [validTask, { title: '   ' }, { foo: 'bar' }, null] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.tasks).toEqual({ kept: 1, skipped: 3 });
  });

  it('preenche campos ausentes com padrões seguros', () => {
    // Uma tarefa salva antes de subtasks existir quebraria toggleSubtask ao ser lida.
    const result = parseBackup(backupWith({ tasks: [{ title: 'Antiga' }] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const task = result.data.tasks[0];
    expect(task.subtasks).toEqual([]);
    expect(task.category).toBe('Outros');
    expect(task.priority).toBe('Média');
    expect(task.status).toBe('backlog');
    expect(task.id).toBeTruthy();
  });

  it('normaliza categoria e prioridade desconhecidas', () => {
    const result = parseBackup(backupWith({ tasks: [{ ...validTask, category: 'Jardinagem', priority: 'Altíssima' }] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.tasks[0].category).toBe('Outros');
    expect(result.data.tasks[0].priority).toBe('Média');
  });

  it('rejeita datas impossíveis', () => {
    const result = parseBackup(backupWith({ tasks: [{ ...validTask, dueDate: '2026-02-31' }] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.tasks[0].dueDate).toBeUndefined();
  });

  it('exige título, data e horário nos compromissos', () => {
    const result = parseBackup(
      backupWith({
        appointments: [
          { title: 'Reunião', date: '2026-09-15', time: '09:00' },
          { title: 'Sem horário', date: '2026-09-15' },
          { title: 'Horário inválido', date: '2026-09-15', time: '99:99' },
        ],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.appointments).toEqual({ kept: 1, skipped: 2 });
  });

  it('limita o progresso das metas a 0-100', () => {
    const result = parseBackup(backupWith({ goals: [{ title: 'Meta', deadline: '2026-12-01', progress: 320 }] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.goals[0].progress).toBe(100);
  });

  it('ignora chaves desconhecidas no perfil', () => {
    const result = parseBackup(backupWith({ profile: { name: 'Beto', theme: 'light', hackeado: true } }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.profile?.name).toBe('Beto');
    expect(result.data.profile?.theme).toBe('light');
    expect('hackeado' in (result.data.profile ?? {})).toBe(false);
  });
});

describe('serializeBackup / ida e volta', () => {
  it('preserva os dados exportados ao reimportar', () => {
    const text = serializeBackup({
      tasks: [validTask as never],
      appointments: [],
      goals: [],
      achievements: [],
    });
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.schemaVersion).toBe(1);
    expect(result.data.tasks[0].title).toBe('Revisar sprint');
  });
});

describe('mergeById', () => {
  it('acrescenta só os ids ainda inexistentes', () => {
    const current = [{ id: 'a' }, { id: 'b' }];
    const incoming = [{ id: 'b' }, { id: 'c' }];
    expect(mergeById(current, incoming).map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });
});
