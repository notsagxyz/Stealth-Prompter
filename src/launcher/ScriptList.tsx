import { For, type JSX } from 'solid-js';
import type { ScriptSummary } from '../lib/types';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { PlusIcon, TrashIcon } from '../components/Icons';

export interface ScriptListProps {
  scripts: ScriptSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function ScriptList(props: ScriptListProps): JSX.Element {
  return (
    <GlassCard
      title="Scripts"
      subtitle={`${props.scripts.length} saved`}
      action={
        <Button variant="cyber" size="sm" onClick={props.onCreate} title="New Script">
          <PlusIcon class="w-3.5 h-3.5" />
          <span>New</span>
        </Button>
      }
      class="flex flex-col h-full p-4"
    >
      <div class="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1.5 pr-1">
        <For
          each={props.scripts}
          fallback={
            <div class="text-center py-6 text-slate-500 text-xs">
              No scripts yet. Click "New" to create one.
            </div>
          }
        >
          {(item) => {
            const isSelected = () => props.selectedId === item.id;
            return (
              <div
                onClick={() => props.onSelect(item.id)}
                class={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                  isSelected()
                    ? 'bg-cyber-cyan/15 border-cyber-cyan/50 text-white shadow-cyber'
                    : 'bg-slate-900/40 border-obsidian-border text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div class="flex flex-col min-w-0 pr-2">
                  <span class="text-xs font-semibold truncate">{item.title || 'Untitled'}</span>
                  <span class="text-[10px] text-slate-400 mt-0.5">
                    {item.word_count} words
                  </span>
                </div>
                <button
                  type="button"
                  title="Delete Script"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onDelete(item.id);
                  }}
                  class="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                >
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }}
        </For>
      </div>
    </GlassCard>
  );
}
