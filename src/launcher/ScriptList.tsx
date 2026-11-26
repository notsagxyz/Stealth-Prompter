import { createSignal, For, type JSX } from 'solid-js';
import type { ScriptSummary } from '../lib/types';
import { getCopy, type Locale } from '../lib/i18n';
import { PlusIcon, TrashIcon, SearchIcon } from '../components/Icons';

export interface ScriptListProps {
  scripts: ScriptSummary[];
  selectedId: string | null;
  language?: Locale;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function ScriptList(props: ScriptListProps): JSX.Element {
  const [query, setQuery] = createSignal('');
  const t = () => getCopy(props.language);

  const filteredScripts = () => {
    const q = query().toLowerCase().trim();
    if (!q) return props.scripts;
    return props.scripts.filter(
      (s) =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.snippet && s.snippet.toLowerCase().includes(q))
    );
  };

  return (
    <aside class="flex flex-col h-full select-none gap-2.5">
      {/* Header + Single New Script Pill */}
      <div class="flex items-center justify-between px-0.5">
        <div class="flex items-center gap-2">
          <span class="section-accent-bar" />
          <span class="micro-label">{t().recentScripts}</span>
        </div>

        <button
          type="button"
          onClick={props.onCreate}
          title={t().newScript}
          class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--text)] text-[#0b0b12] hover:opacity-90 text-[11px] font-semibold transition-opacity"
        >
          <PlusIcon class="w-3 h-3" />
          <span>{t().newScript}</span>
        </button>
      </div>

      {/* Compact Search */}
      <div class="relative">
        <SearchIcon class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="text"
          placeholder={t().searchPlaceholder}
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          class="w-full bg-white/[0.03] border border-[var(--border)] rounded-full pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Script List */}
      <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-0.5">
        <For
          each={filteredScripts()}
          fallback={
            <div class="text-center py-8 px-3 rounded-[14px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] text-xs">
              {query() ? t().noScriptsMatch : t().noScriptsYet}
            </div>
          }
        >
          {(item) => {
            const isSelected = () => props.selectedId === item.id;
            return (
              <div
                role="button"
                tabIndex={0}
                onClick={() => props.onSelect(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    props.onSelect(item.id);
                  }
                }}
                class={`group relative flex flex-col p-3 rounded-[14px] cursor-pointer transition-colors duration-150 border ${
                  isSelected()
                    ? 'bg-white/[0.07] border-[var(--accent)]'
                    : 'bg-[var(--surface)] border-transparent hover:bg-[var(--surface-hover)] hover:border-[var(--border)]'
                }`}
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-medium text-[var(--text)] truncate">
                    {item.title || t().untitled}
                  </span>
                  <button
                    type="button"
                    title={t().deleteScript}
                    aria-label={t().deleteScript}
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onDelete(item.id);
                    }}
                    class="opacity-0 group-hover:opacity-100 p-1 -mr-1 text-[var(--text-muted)] hover:text-rose-400 rounded-full transition-opacity"
                  >
                    <TrashIcon class="w-3 h-3" />
                  </button>
                </div>

                <p class="text-[11px] text-[var(--text-muted)] truncate mt-1">
                  {item.snippet || '...'}
                </p>

                <div class="flex items-center justify-between mt-2 text-[10px] font-mono text-[var(--text-muted)] tabular-nums">
                  <span>{item.word_count} {t().words}</span>
                  <span>{item.speed.toFixed(1)}x</span>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </aside>
  );
}
