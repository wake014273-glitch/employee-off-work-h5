type Completion<T> = (error: Error | null, value?: T | null) => void;
type LoadOptions = { label: string; attempts?: number; timeoutMs?: number; delayMs?: number;
  onRetry?: (attempt: number) => void; isCurrent?: () => boolean };

/** Smooth completed work and carry the displayed value across the platform/scene handoff. */
export class LoadingProgress {
  value = 0;
  target = 0;
  reset(value = 0) { this.value = this.target = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
  report(value: number) { if (Number.isFinite(value)) this.target = Math.max(this.target, Math.min(1, value)); }
  advance(dt: number) {
    if (Number.isFinite(dt) && dt > 0) this.value = Math.min(this.target, this.value + Math.min(dt, 0.1) * 0.8);
    return this.value;
  }
}

/** Bound callback loaders; ignore late callbacks after a timeout and retry transient failures. */
export async function retryLoad<T>(request: (done: Completion<T>) => void, options: LoadOptions): Promise<T> {
  const attempts = options.attempts ?? 3;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (options.isCurrent && !options.isCurrent()) throw new Error(`${options.label}加载已取消`);
    try {
      return await new Promise<T>((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => finish(new Error(`${options.label}加载超时`)), options.timeoutMs ?? 45000);
        const finish: Completion<T> = (error, value) => {
          if (settled) return;
          settled = true; clearTimeout(timer);
          if (error || !value) reject(error ?? new Error(`${options.label}未返回资源`));
          else resolve(value);
        };
        try { request(finish); } catch (error) { finish(error instanceof Error ? error : new Error(String(error))); }
      });
    } catch (error) {
      if (attempt === attempts || (options.isCurrent && !options.isCurrent())) throw error;
      options.onRetry?.(attempt + 1);
      await new Promise(resolve => setTimeout(resolve, (options.delayMs ?? 1000) * attempt));
    }
  }
  throw new Error(`${options.label}加载失败`);
}
