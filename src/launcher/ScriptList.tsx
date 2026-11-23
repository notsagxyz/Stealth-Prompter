import { createSignal, For, type JSX } from 'solid-js';
import type { ScriptSummary } from '../lib/types';
import { Button } from '../components/Button';
import { PlusIcon, TrashIcon, SearchIcon } from '../components/Icons';

export interface ScriptListProps {
  scripts: ScriptSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function ScriptList(props: ScriptListProps): JSX.Element {
  const [query, setQuery] = createSignal('');

  const filteredScripts = () => {
    const q = query().toLowerCase().trim();
    if (!q) return props.scripts;
    return props.scripts.filter(
      (s) => (s.title && s.title.toLowerCase().includes(q)) || (s.snippet && s.snippet.toLowerCase().includes(q))
    );
  };

  return (
    <div class="flex flex-col h-full bg-white/[0.025] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-3 select-none">
      {/* Header */}
      <div class="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06] px-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Scripts</span>
          <span class="text-[11px] font-mono text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/[0.08]">
            {props.scripts.length}
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={props.onCreate}
          title="Create New Script"
          class="!px-2.5 !py-1 !text-xs !rounded-full font-medium"
        >
          <PlusIcon class="w-3.5 h-3.5" />
          <span>New</span>
        </Button>
      </div>

      {/* Search Input Bar (Match Image 3 tidyloop) */}
      <div class="relative mb-2">
        <SearchIcon class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search scripts..."
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          class="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
        />
      </div>

      {/* Script List Items */}
      <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
        <For
          each={filteredScripts()}
          fallback={
            <div class="text-center py-10 px-4 text-slate-500 text-xs">
              {query() ? 'No scripts match your search.' : 'No saved scripts yet. Click New to create your first speech.'}
            </div>
          }
        >
          {(item) => {
            const isSelected = () => props.selectedId === item.id;
            return (
              <div
                onClick={() => props.onSelect(item.id)}
                class={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all border ${
                  isSelected()
                    ? 'bg-white/[0.1] text-white border-white/[0.12] shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                <div class="flex flex-col min-w-0 pr-2">
                  <span class="text-xs font-medium truncate text-slate-100">
                    {item.title || 'Untitled Speech'}
                  </span>
                  <span class="text-[11px] text-slate-400 mt-0.5 font-mono">
                    {item.word_count} words
                  </span>
                </div>

                <button
                  type="button"
                  title="Delete script"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onDelete(item.id);
                  }}
                  class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                >
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
