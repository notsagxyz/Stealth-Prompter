import { createSignal, createEffect, type JSX } from 'solid-js';
import { calculateScriptMetrics, ScriptSanitizer } from '../lib/sanitizer';
import type { Script } from '../lib/types';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';

export interface ScriptEditorProps {
  script: Script | null;
  onSave: (script: Script) => void;
}

export function ScriptEditor(props: ScriptEditorProps): JSX.Element {
  const [title, setTitle] = createSignal('');
  const [content, setContent] = createSignal('');
  const [metrics, setMetrics] = createSignal({ wordCount: 0, estimatedMinutes: 0 });
  const [isRtl, setIsRtl] = createSignal(false);

  createEffect(() => {
    if (props.script) {
      setTitle(props.script.title);
      setContent(props.script.content);
      setMetrics(calculateScriptMetrics(props.script.content));
      setIsRtl(ScriptSanitizer.detectRtl(props.script.content));
    } else {
      setTitle('');
      setContent('');
      setMetrics({ wordCount: 0, estimatedMinutes: 0 });
      setIsRtl(false);
    }
  });

  const handleContentChange = (val: string) => {
    setContent(val);
    setMetrics(calculateScriptMetrics(val));
    setIsRtl(ScriptSanitizer.detectRtl(val));
  };

  const handleSave = () => {
    if (!props.script) return;
    const sanitized = ScriptSanitizer.sanitize(content());
    const updated: Script = {
      ...props.script,
      title: title().trim() || 'Untitled Script',
      content: sanitized,
      updated_at: new Date().toISOString(),
    };
    props.onSave(updated);
  };

  return (
    <GlassCard class="flex flex-col h-full p-4">
      {props.script ? (
        <div class="flex flex-col h-full gap-3">
          {/* Editor Header */}
          <div class="flex items-center justify-between gap-3 border-b border-obsidian-border pb-3">
            <input
              type="text"
              value={title()}
              onInput={(e) => setTitle(e.currentTarget.value)}
              placeholder="Script Title..."
              class="bg-transparent text-lg font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 px-2 py-1 rounded flex-1"
            />
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400 font-mono bg-slate-900/60 px-2 py-1 rounded border border-obsidian-border">
                {metrics().wordCount} words (~{metrics().estimatedMinutes} min)
              </span>
              <Button variant="cyber" size="sm" onClick={handleSave}>
                Save Script
              </Button>
            </div>
          </div>

          {/* Editor Textarea */}
          <div class="flex-1 relative">
            <textarea
              id="script-editor-textarea"
              value={content()}
              onInput={(e) => handleContentChange(e.currentTarget.value)}
              placeholder="Paste or write your speech script here..."
              dir={isRtl() ? 'rtl' : 'ltr'}
              class="w-full h-full bg-slate-950/40 border border-obsidian-border rounded-lg p-3 text-slate-200 placeholder-slate-600 resize-none font-sans text-sm leading-relaxed focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/50 no-scrollbar"
            />
          </div>
        </div>
      ) : (
        <div class="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
          <p class="text-sm">Select a script from the sidebar or create a new one.</p>
        </div>
      )}
    </GlassCard>
  );
}
