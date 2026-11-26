import { createSignal, createEffect, Show, For, type JSX } from 'solid-js';
import { calculateScriptMetrics, ScriptSanitizer } from '../lib/sanitizer';
import type { Script } from '../lib/types';
import { getCopy, type Locale } from '../lib/i18n';
import { generateAiScript, type AiDuration, type AiTone } from '../lib/aiScript';
import { ChevronLeftIcon, SparklesIcon, CloseIcon, PlusIcon } from '../components/Icons';

export interface ScriptEditorProps {
  script: Script | null;
  language?: Locale;
  onSave: (script: Script) => void;
  onCreate?: () => void;
  onBack?: () => void;
}

export function ScriptEditor(props: ScriptEditorProps): JSX.Element {
  const [title, setTitle] = createSignal('');
  const [content, setContent] = createSignal('');
  const [metrics, setMetrics] = createSignal({ wordCount: 0, estimatedMinutes: 0 });
  const [isRtl, setIsRtl] = createSignal(false);
  const [isDirty, setIsDirty] = createSignal(false);
  const [aiOpen, setAiOpen] = createSignal(false);
  const [aiPrompt, setAiPrompt] = createSignal('');
  const [aiTone, setAiTone] = createSignal<AiTone>('natural');
  const [aiDuration, setAiDuration] = createSignal<AiDuration>('60s');
  const [aiLoading, setAiLoading] = createSignal(false);
  const [aiError, setAiError] = createSignal<string | null>(null);
  const [aiRemaining, setAiRemaining] = createSignal<number | null>(null);
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

  const handleGenerateAi = async () => {
    if (!props.script || aiLoading()) return;
    const prompt = aiPrompt().trim();
    if (prompt.length < 3) {
      setAiError(t().aiEmptyPrompt);
      return;
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const res = await generateAiScript({
        prompt,
        tone: aiTone(),
        duration: aiDuration(),
        language: props.language,
      });
      handleContentChange(res.script);
      if (title() === 'Untitled Speech' || title() === 'Guion sin título' || !title().trim()) {
        const shortTitle = prompt.length > 42 ? `${prompt.slice(0, 42).trim()}...` : prompt;
        handleTitleChange(shortTitle);
      }
      handleSave();
      setAiRemaining(res.remaining);
      setAiOpen(false);
      setAiPrompt('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'EMPTY_PROMPT') setAiError(t().aiEmptyPrompt);
      else if (msg === 'NETWORK_ERROR') setAiError(t().aiNetworkError);
      else if (msg === 'RATE_LIMIT') {
        setAiRemaining(0);
        setAiError(t().aiLimitReached);
      } else setAiError(msg);
    } finally {
      setAiLoading(false);
    }
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

              <button
                type="button"
                data-testid="ai-write-button"
                onClick={() => {
                  setAiError(null);
                  setAiOpen(!aiOpen());
                }}
                class={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  aiOpen()
                    ? 'bg-[var(--accent)]/20 text-white border-[var(--accent)]'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-[var(--border)] text-[var(--text)]'
                }`}
              >
                <SparklesIcon class="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{t().aiWrite}</span>
              </button>

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

          {/* Inline AI Script Generator Drawer */}
          <Show when={aiOpen()}>
            <div class="animate-drawer-in px-4 py-3 border-b border-[var(--border)] bg-white/[0.025] flex flex-col gap-2.5 shrink-0">
              <div class="flex items-start gap-2">
                <textarea
                  rows={2}
                  value={aiPrompt()}
                  onInput={(e) => setAiPrompt(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleGenerateAi();
                    } else if (e.key === 'Escape') {
                      setAiOpen(false);
                    }
                  }}
                  placeholder={t().aiPromptPlaceholder}
                  disabled={aiLoading()}
                  class="flex-1 bg-[#0b0b12]/70 border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] resize-none focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAiOpen(false)}
                  aria-label="Close"
                  class="w-7 h-7 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.07] flex items-center justify-center shrink-0"
                >
                  <CloseIcon class="w-3.5 h-3.5" />
                </button>
              </div>

              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="flex items-center gap-0.5 bg-white/[0.04] border border-[var(--border)] rounded-full p-0.5">
                    <For
                      each={[
                        { id: 'natural' as AiTone, label: () => t().aiToneNatural },
                        { id: 'confident' as AiTone, label: () => t().aiToneConfident },
                        { id: 'concise' as AiTone, label: () => t().aiToneConcise },
                      ]}
                    >
                      {(item) => (
                        <button
                          type="button"
                          onClick={() => setAiTone(item.id)}
                          class={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                            aiTone() === item.id
                              ? 'bg-[var(--accent)] text-white'
                              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          {item.label()}
                        </button>
                      )}
                    </For>
                  </div>

                  <div class="flex items-center gap-0.5 bg-white/[0.04] border border-[var(--border)] rounded-full p-0.5">
                    <For each={['30s', '60s', '2m', '5m'] as AiDuration[]}>
                      {(dur) => (
                        <button
                          type="button"
                          onClick={() => setAiDuration(dur)}
                          class={`px-2 py-0.5 rounded-full font-mono text-[10px] transition-colors ${
                            aiDuration() === dur
                              ? 'bg-white/[0.16] text-white'
                              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          {dur}
                        </button>
                      )}
                    </For>
                  </div>

                  <span class="font-mono text-[10px] text-[var(--text-muted)]">
                    {aiRemaining() !== null ? `${aiRemaining()}/10 ${t().aiRemaining}` : t().aiDailyLimitBadge}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="ai-generate-button"
                    onClick={() => void handleGenerateAi()}
                    disabled={aiLoading() || aiRemaining() === 0}
                    class="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 text-white text-xs font-semibold transition-all"
                  >
                    <SparklesIcon class="w-3 h-3" />
                    <span>{aiLoading() ? t().aiGenerating : t().aiGenerate}</span>
                  </button>
                </div>
              </div>

              <Show when={aiError() || aiRemaining() === 0}>
                <div
                  class={`px-3 py-1.5 rounded-lg text-[11px] border ${
                    aiRemaining() === 0
                      ? 'bg-amber-500/10 border-amber-400/35 text-amber-200'
                      : 'bg-rose-500/10 border-rose-400/35 text-rose-300'
                  }`}
                >
                  {aiRemaining() === 0 ? t().aiLimitReached : aiError()}
                </div>
              </Show>
            </div>
          </Show>

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
        <div class="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] text-xs gap-3 px-6 text-center">
          <p class="text-[var(--text)] font-medium">{t().noScriptsYet}</p>
          <Show when={props.onCreate}>
            <button
              type="button"
              onClick={() => props.onCreate?.()}
              class="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--text)] text-[#0b0b12] hover:opacity-90 active:scale-95 text-xs font-semibold transition-opacity duration-150"
            >
              <PlusIcon class="w-3.5 h-3.5" />
              <span>{t().newScript}</span>
            </button>
          </Show>
        </div>
      )}
    </div>
  );
}
