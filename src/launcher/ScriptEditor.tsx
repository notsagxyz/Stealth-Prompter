import { createSignal, createEffect, type JSX } from 'solid-js';
import { calculateScriptMetrics, ScriptSanitizer } from '../lib/sanitizer';
import type { Script } from '../lib/types';
import { getCopy, type Locale } from '../lib/i18n';
import { ChevronLeftIcon } from '../components/Icons';

export interface ScriptEditorProps {
  script: Script | null;
  language?: Locale;
  onSave: (script: Script) => void;
  onBack?: () => void;
}

export function ScriptEditor(props: ScriptEditorProps): JSX.Element {
  const [title, setTitle] = createSignal('');
  const [content, setContent] = createSignal('');
  const [metrics, setMetrics] = createSignal({ wordCount: 0, estimatedMinutes: 0 });
  const [isRtl, setIsRtl] = createSignal(false);
  const [isDirty, setIsDirty] = createSignal(false);
  const t = () => getCopy(props.language);

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
      title: title().trim() || t().untitled,
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
          if (!title() || title() === t().untitled || title() === 'New Speech') {
            const fileName = file.name.replace(/\.[^/.]+$/, '');
            handleTitleChange(fileName);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div class="flex flex-col h-full rounded-[14px] bg-[var(--surface)] border border-[var(--border)] overflow-hidden select-none">
      {props.script ? (
        <>
          {/* Editor Header */}
          <div class="px-4 py-3 flex items-center justify-between gap-3 border-b border-[var(--border)] shrink-0">
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
              {props.onBack && (
                <button
                  type="button"
                  onClick={() => {
                    if (isDirty()) handleSave();
                    props.onBack?.();
                  }}
                  title={t().backToHome}
                  class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0"
                >
                  <ChevronLeftIcon class="w-3.5 h-3.5" />
                  <span>{t().backToHome}</span>
                </button>
              )}

              <span class="section-accent-bar" />
              <input
                type="text"
                value={title()}
                onInput={(e) => handleTitleChange(e.currentTarget.value)}
                onBlur={handleSave}
                placeholder={t().untitled}
                class="bg-transparent text-sm font-semibold text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none px-2 py-1 rounded-lg flex-1 min-w-0"
              />
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span class="micro-label tabular-nums hidden sm:inline">
                {metrics().wordCount} {t().words} · ~{metrics().estimatedMinutes} {t().minRead}
              </span>

              <label class="cursor-pointer text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-[var(--border)] transition-colors">
                {t().importFile}
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileImport}
                  class="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleSave}
                class={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isDirty()
                    ? 'bg-[var(--text)] text-[#0b0b12] hover:opacity-90'
                    : 'text-[var(--text-muted)] bg-white/[0.04] border border-[var(--border)]'
                }`}
              >
                {isDirty() ? t().save : t().saved}
              </button>
            </div>
          </div>

          {/* Writing Area */}
          <div class="flex-1 min-h-0 p-5 overflow-hidden">
            <textarea
              id="script-editor-textarea"
              value={content()}
              onInput={(e) => handleContentChange(e.currentTarget.value)}
              onBlur={handleSave}
              placeholder={t().editorPlaceholder}
              dir={isRtl() ? 'rtl' : 'ltr'}
              class="w-full h-full bg-transparent text-[var(--text)] placeholder-[var(--text-muted)] font-sans text-sm leading-[1.75] resize-none focus:outline-none custom-scrollbar select-text"
            />
          </div>
        </>
      ) : (
        <div class="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] text-xs gap-1.5">
          <p class="text-[var(--text)] font-medium">{t().noScriptsYet}</p>
        </div>
      )}
    </div>
  );
}
