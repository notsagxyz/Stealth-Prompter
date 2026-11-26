import { createSignal, For, type JSX } from 'solid-js';
import type { ScriptSummary } from '../lib/types';
import { getCopy, type Locale } from '../lib/i18n';
import { PlusIcon, TrashIcon, SearchIcon, FileTextIcon } from '../components/Icons';

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
    <section class="flex flex-col h-full select-none gap-3">
      {/* Section Title with Accent Vertical Bar */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="section-accent-bar" />
          <span class="micro-label">{t().recentScripts}</span>
          <span class="text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
            {props.scripts.length}
          </span>
        </div>

        <button
          type="button"
          onClick={props.onCreate}
          title={t().newScript}
          class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text)] transition-all duration-200"
        >
          <span class="relative inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/[0.08]">
            <FileTextIcon class="w-2.5 h-2.5 text-[var(--text)]" />
            <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
              <PlusIcon class="w-2 h-2" />
            </span>
          </span>
          <span>{t().newScript}</span>
        </button>
      </div>

      {/* Search Input */}
      <div class="relative">
        <SearchIcon class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="text"
          placeholder={t().searchPlaceholder}
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          class="w-full bg-[var(--surface)] border border-[var(--border)] rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Recent Scripts Glass Cards */}
      <div class="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1 content-start">
        <For
          each={filteredScripts()}
          fallback={
            <div class="col-span-full text-center py-8 px-4 rounded-[14px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] text-xs">
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
                class={`group relative flex flex-col justify-between p-3.5 rounded-[14px] cursor-pointer transition-all duration-200 border ${
                  isSelected()
                    ? 'bg-[var(--surface-hover)] border-[var(--accent)] shadow-[0_0_20px_-6px_var(--accent-glow)]'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-white/15'
                }`}
              >
                <div class="flex items-start justify-between gap-2">
                  <span class="text-xs font-semibold text-[var(--text)] truncate">
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
                    class="opacity-0 group-hover:opacity-100 p-1 -mr-1 -mt-1 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all"
                  >
                    <TrashIcon class="w-3.5 h-3.5" />
                  </button>
                </div>

                <p class="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1.5 leading-relaxed min-h-[2.2em]">
                  {item.snippet || '...'}
                </p>

                <div class="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.05] text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] tabular-nums">
                  <span>{item.word_count} {t().words}</span>
                  <span>{item.speed.toFixed(1)}x</span>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </section>
  );
}
