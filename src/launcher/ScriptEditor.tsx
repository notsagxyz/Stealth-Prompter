import { createSignal, createEffect, type JSX } from 'solid-js';
import { calculateScriptMetrics, ScriptSanitizer } from '../lib/sanitizer';
import type { Script } from '../lib/types';
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
  const [isDirty, setIsDirty] = createSignal(false);

  createEffect(() => {
    if (props.script) {
      setTitle(props.script.title);
      setContent(props.script.content);
      setMetrics(calculateScriptMetrics(props.script.content));
      setIsRtl(ScriptSanitizer.detectRtl(props.script.content));
      setIsDirty(false);
    } else {
      setTitle('');
      setContent('');
      setMetrics({ wordCount: 0, estimatedMinutes: 0 });
      setIsRtl(false);
      setIsDirty(false);
    }
  });

  const handleContentChange = (val: string) => {
    setContent(val);
    setMetrics(calculateScriptMetrics(val));
    setIsRtl(ScriptSanitizer.detectRtl(val));
    setIsDirty(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!props.script) return;
    const sanitized = ScriptSanitizer.sanitize(content());
    const updated: Script = {
      ...props.script,
      title: title().trim() || 'Untitled Speech',
      content: sanitized,
      updated_at: new Date().toISOString(),
    };
    props.onSave(updated);
    setIsDirty(false);
  };

  const handleFileImport = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleContentChange(text);
          if (!title() || title() === 'Untitled Speech') {
            const fileName = file.name.replace(/\.[^/.]+$/, '');
            handleTitleChange(fileName);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div class="flex flex-col h-full bg-white/[0.025] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-5 pb-20 select-none">
      {props.script ? (
        <div class="flex flex-col h-full gap-4">
          {/* Editor Header Bar (Match Image 1 & 2 Linear tags) */}
          <div class="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
            <input
              type="text"
              value={title()}
              onInput={(e) => handleTitleChange(e.currentTarget.value)}
              onBlur={handleSave}
              placeholder="Speech title..."
              class="bg-transparent text-lg font-semibold text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 px-2.5 py-1 rounded-xl flex-1 transition-all tracking-tight"
            />

            <div class="flex items-center gap-2">
              {/* Word & Reading Time Pill */}
              <div class="flex items-center gap-1.5 text-xs text-slate-300 font-mono bg-white/[0.05] px-3 py-1 rounded-full border border-white/[0.08]">
                <span>{metrics().wordCount} words</span>
                <span class="text-white/30">·</span>
                <span>~{metrics().estimatedMinutes} min</span>
              </div>

              {/* Import Action Pill */}
              <label class="cursor-pointer text-xs font-medium text-slate-300 hover:text-white px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] transition-all">
                Import .txt / .md
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileImport}
                  class="hidden"
                />
              </label>

              {/* Save Button (White Pill when dirty, subtle when saved) */}
              <Button
                variant={isDirty() ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleSave}
                class="!px-3.5 !py-1 !text-xs !rounded-full"
              >
                {isDirty() ? 'Save' : 'Saved'}
              </Button>
            </div>
          </div>

          {/* Editor Textarea with generous line-height */}
          <div class="flex-1 relative min-h-0">
            <textarea
              id="script-editor-textarea"
              value={content()}
              onInput={(e) => handleContentChange(e.currentTarget.value)}
              onBlur={handleSave}
              placeholder="Paste or write your speech script here... The text synchronizes instantly with the invisible prompter overlay."
              dir={isRtl() ? 'rtl' : 'ltr'}
              class="w-full h-full bg-transparent text-slate-200 placeholder-white/20 font-sans text-sm leading-relaxed p-2 resize-none focus:outline-none custom-scrollbar select-text"
              style={{
                'line-height': '1.75',
              }}
            />
          </div>
        </div>
      ) : (
        <div class="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
          <p>No speech selected.</p>
          <p class="text-xs text-slate-600">Select a speech from the sidebar or click New to begin.</p>
        </div>
      )}
    </div>
  );
}
