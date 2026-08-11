import { useEffect, useMemo, useState } from "react";
import { buildActionMatrix } from "../../../../features/home-admin/domain/editorial-rules";
import type {
  AdminError,
  HomeAdminResource,
} from "../../../../features/home-admin/domain/home-admin.types";
import type { HomeAdminMockRepository } from "../../../../features/home-admin/mocks/home-admin.mock.repository";
import type { SimulatedAdminProfile } from "../../../../features/home-admin/permissions/home-admin.permissions";
import type { ValidationIssue, ValidationResult } from "../../../../features/home-admin/schemas/home-admin.validators";
import { validateCancellationReason } from "../../../../features/home-admin/schemas/home-admin.editor.validators";

function clone<T>(value: T): T { return structuredClone(value); }

function hashResource(resource: HomeAdminResource): string {
  const content = JSON.stringify(resource, (key, value) => ["version", "review", "state", "previousState"].includes(key) ? undefined : value);
  let hash = 5381;
  for (let index = 0; index < content.length; index += 1) hash = ((hash << 5) + hash) ^ content.charCodeAt(index);
  return `local:${resource.resourceType}:${(hash >>> 0).toString(16)}`;
}

function issuesToError(issues: ValidationIssue[]): Extract<AdminError, { kind: "validation" }> {
  const fields: Record<string, string[]> = {};
  issues.forEach(({ path, message }) => {
    const field = path.replace(/^(contacts|social)\./, "");
    fields[field] = [...(fields[field] ?? []), message];
  });
  return { kind: "validation", status: 422, message: "Revise os campos destacados.", fields };
}

function focusFirstError(fields: Record<string, string[]>) {
  const first = Object.keys(fields)[0];
  requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-error-field="${first ?? ""}"]`)?.focus());
}

export function useAdminResourceEditor<T extends HomeAdminResource>(options: {
  initial: T;
  repository: HomeAdminMockRepository;
  profile: SimulatedAdminProfile;
  validate: (value: unknown) => ValidationResult<T>;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { initial, repository, profile, validate, onDirtyChange } = options;
  const [resource, setResource] = useState<T>(() => clone(initial));
  const [baseline, setBaseline] = useState<T>(() => clone(initial));
  const [feedback, setFeedback] = useState<{ error?: AdminError; success?: string }>({});
  const [busy, setBusy] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationError, setCancellationError] = useState<string>();
  const hasChanges = JSON.stringify(resource) !== JSON.stringify(baseline);

  useEffect(() => onDirtyChange?.(hasChanges), [hasChanges, onDirtyChange]);

  const actions = useMemo(() => buildActionMatrix({
    resourceType: resource.resourceType,
    state: resource.state,
    reviewDecision: resource.review?.decision ?? null,
    authorId: resource.review?.submittedBy ?? resource.version.createdBy,
    profile,
    hasChanges,
    approvalValid: false,
    currentVersion: resource.version.editorialVersion,
    approvedVersion: null,
    currentHash: resource.version.contentHash,
    approvedHash: null,
  }), [hasChanges, profile, resource]);

  const validateCurrent = () => {
    const result = validate(resource);
    if (result.success) return result.data;
    const error = issuesToError(result.issues);
    setFeedback({ error });
    focusFirstError(error.fields);
    return null;
  };

  const saveDraft = async () => {
    const validated = validateCurrent();
    if (!validated) return;
    const prepared = { ...validated, version: { ...validated.version, contentHash: hashResource(validated) } } as T;
    setBusy(true);
    const result = await repository.saveDraft({ resource: prepared, expectedRevision: baseline.version.revision });
    setBusy(false);
    if (!result.ok) {
      setFeedback({ error: result.error });
      if (result.error.kind === "validation") focusFirstError(result.error.fields);
      return;
    }
    if (result.data.resourceType !== prepared.resourceType) return;
    const saved = result.data as T;
    setResource(saved); setBaseline(saved);
    setFeedback({ success: "Rascunho salvo somente na memória desta demonstração." });
  };

  const submitReview = async () => {
    const validated = validateCurrent();
    if (!validated) return;
    const contentHash = hashResource(validated);
    setBusy(true);
    const result = await repository.submitReview({
      resourceType: validated.resourceType,
      resourceId: validated.id,
      version: validated.version.editorialVersion,
      contentHash,
      submittedBy: profile.actorId,
    });
    setBusy(false);
    if (!result.ok) {
      setFeedback({ error: result.error });
      if (result.error.kind === "validation") focusFirstError(result.error.fields);
      return;
    }
    const reviewed = {
      ...validated,
      previousState: validated.state,
      state: "review",
      review: result.data,
      version: { ...validated.version, contentHash, submittedAt: result.data.submittedAt },
    } as T;
    setResource(reviewed); setBaseline(reviewed);
    setFeedback({ success: "Configuração completa enviada para revisão simulada." });
  };

  const cancelReview = async () => {
    const reasonError = validateCancellationReason(cancellationReason);
    if (reasonError) { setCancellationError(reasonError); requestAnimationFrame(() => document.getElementById("cancellation-reason")?.focus()); return; }
    if (!resource.review) return;
    setBusy(true);
    const result = await repository.cancelReview({ cycleId: resource.review.cycleId, actorId: profile.actorId, reason: cancellationReason.trim() });
    setBusy(false);
    if (!result.ok) { setFeedback({ error: result.error }); return; }
    const cancelled = { ...resource, previousState: "review", state: "draft", review: result.data } as T;
    setResource(cancelled); setBaseline(cancelled); setCancellationReason(""); setCancellationError(undefined);
    setFeedback({ success: "Envio cancelado. O conteúdo voltou para rascunho sem alterar a versão pública." });
  };

  const update = (next: T) => { setResource(next); setFeedback({}); };
  const reload = () => { const fresh = clone(initial); setResource(fresh); setBaseline(fresh); setFeedback({ success: "Dados simulados recarregados; a edição local foi descartada." }); };

  return { resource, update, baseline, actions, hasChanges, feedback, busy, cancellationReason, setCancellationReason, cancellationError, saveDraft, submitReview, cancelReview, reload };
}
