"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { toast } from "sonner";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";

type FieldType = "text" | "email" | "select" | "textarea";

interface FormOption {
  value: string;
  label: string;
}

interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder: string;
  errorMessage: string;
  options?: FormOption[];
}

const FORM_TABS = [
  { id: "contact", label: "Contact Page Form" },
  { id: "case-studies", label: "Case Studies Request" },
  { id: "ai-production", label: "AI Production Brief" },
  { id: "brand-films", label: "Brand Films Inquiry" },
];

function SortableFieldRow({
  field,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  field: FormField;
  index: number;
  total: number;
  onChange: (updated: FormField) => void;
  onMove: (index: number, delta: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: field.id,
    index,
  });

  const optionsText = (field.options || [])
    .map((o) => `${o.value}:${o.label}`)
    .join(", ");

  return (
    <div
      ref={ref}
      className={`rounded-xl border border-card-border bg-card-background p-4 transition-all ${
        isDragging ? "opacity-50 ring-2 ring-primary-500" : ""
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-card-border pb-3">
        <div className="flex items-center gap-2">
          <button
            ref={handleRef}
            type="button"
            className="cursor-grab rounded p-1 text-text-tertiary hover:bg-background-soft-100 active:cursor-grabbing"
            title="Drag to reorder"
          >
            ⋮⋮
          </button>
          <span className="text-sm font-semibold text-text-primary">
            {field.label || "Untitled Field"}
          </span>
          <Badge color="gray" size="sm">
            {field.type}
          </Badge>
          {field.required && (
            <Badge color="warning" size="sm">
              Required
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
            className="rounded border border-card-border px-2 py-1 text-xs text-text-secondary disabled:opacity-40 hover:bg-background-soft-100"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
            className="rounded border border-card-border px-2 py-1 text-xs text-text-secondary disabled:opacity-40 hover:bg-background-soft-100"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onRemove(field.id)}
            className="rounded border border-error-200 px-2 py-1 text-xs text-error-600 hover:bg-error-50"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-tertiary">
            Field Label
          </label>
          <Input
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-tertiary">
            Field Key Name (API)
          </label>
          <Input
            value={field.name}
            onChange={(e) =>
              onChange({
                ...field,
                name: e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""),
              })
            }
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-tertiary">
            Input Type
          </label>
          <select
            value={field.type}
            onChange={(e) =>
              onChange({ ...field, type: e.target.value as FieldType })
            }
            className="h-10 w-full rounded-lg border border-input-border bg-input-background px-3 text-sm text-text-primary outline-none focus:border-primary-500"
          >
            <option value="text">Text</option>
            <option value="email">Email (Anti-Fraud Check)</option>
            <option value="select">Dropdown Select</option>
            <option value="textarea">Multi-line Textarea</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-tertiary">
            Placeholder Text
          </label>
          <Input
            value={field.placeholder}
            onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-text-tertiary">
            Custom Validation Error Message
          </label>
          <Input
            value={field.errorMessage}
            onChange={(e) => onChange({ ...field, errorMessage: e.target.value })}
            placeholder="Shown inline if field validation fails"
          />
        </div>

        {field.type === "select" && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-text-tertiary">
              Dropdown Options (comma-separated, value:Label)
            </label>
            <Input
              value={optionsText}
              onChange={(e) => {
                const parsed = e.target.value
                  .split(",")
                  .map((chunk) => chunk.trim())
                  .filter(Boolean)
                  .map((chunk) => {
                    const [v, ...rest] = chunk.split(":");
                    const val = (v || "").trim();
                    const lbl = rest.length ? rest.join(":").trim() : val;
                    return { value: val, label: lbl };
                  });
                onChange({ ...field, options: parsed });
              }}
              placeholder="commercial:AI Commercial, film:Brand Film, labs:Visual Labs"
            />
          </div>
        )}

        <div className="sm:col-span-2 flex items-center gap-2 pt-1">
          <input
            id={`req-${field.id}`}
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
            className="size-4 rounded border-input-border text-primary-500"
          />
          <label
            htmlFor={`req-${field.id}`}
            className="text-xs font-medium text-text-secondary"
          >
            Required field before submission
          </label>
        </div>
      </div>
    </div>
  );
}

export default function FormBuilderPage() {
  const params = useParams<{ formId: string }>();
  const rawFormId = String(params?.formId || "contact").toLowerCase();
  const activeTab = FORM_TABS.find((t) => t.id === rawFormId) || FORM_TABS[0];

  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/forms?formId=${encodeURIComponent(rawFormId)}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : { fields: [] }))
      .then((data) => {
        setFields(Array.isArray(data.fields) ? data.fields : []);
        setPreviewValues({});
        setPreviewErrors({});
      })
      .catch(() => toast.error("Failed to load form configuration."))
      .finally(() => setLoading(false));
  }, [rawFormId]);

  const handleAddField = () => {
    const id = `fld-${Date.now()}`;
    setFields((prev) => [
      ...prev,
      {
        id,
        name: `custom_${prev.length + 1}`,
        label: "New Custom Field",
        type: "text",
        required: false,
        placeholder: "Enter details...",
        errorMessage: "Please fill out this field.",
      },
    ]);
  };

  const handleUpdateField = (updated: FormField) => {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMove = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ formId: rawFormId, fields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setFields(data.fields);
      toast.success(`Saved "${activeTab.label}" configuration.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save form.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const val = (previewValues[f.name] || "").trim();
      if (f.required && !val) {
        errs[f.name] = f.errorMessage || `${f.label} is required.`;
      } else if (f.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errs[f.name] = f.errorMessage || "Invalid email address.";
      }
    }
    setPreviewErrors(errs);
    if (Object.keys(errs).length === 0) {
      toast.success("Live validation preview passed cleanly!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Frontend Form Customizer
          </h1>
          <p className="text-sm text-text-tertiary">
            Configure live public fields, order, and custom inline error messages for{" "}
            <strong className="text-text-primary">{activeTab.label}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            appearance="outline"
            onPress={handleAddField}
            className="border px-4 py-2"
          >
            + Add Field
          </Button>
          <Button
            type="button"
            variant="primary"
            onPress={handleSave}
            isDisabled={saving || loading}
          >
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      {/* Form Target Switcher */}
      <div className="flex flex-wrap gap-2">
        {FORM_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/forms/${tab.id}`}
            className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors ${
              rawFormId === tab.id
                ? "border-primary-500 bg-primary-500 text-white"
                : "border-card-border bg-card-background text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Field Builder List */}
        <div className="space-y-4 xl:col-span-7">
          {loading ? (
            <Card className="h-64 animate-pulse p-6" />
          ) : fields.length === 0 ? (
            <Card className="p-8 text-center text-sm text-text-tertiary">
              No fields configured yet. Click "+ Add Field" to begin.
            </Card>
          ) : (
            <DragDropProvider
              onDragEnd={(event) => {
                if (event.canceled) return;
                const sourceId = event.operation.source?.id;
                const targetId = event.operation.target?.id;
                if (!sourceId || !targetId || sourceId === targetId) return;
                setFields((prev) => {
                  const oldIdx = prev.findIndex((f) => f.id === String(sourceId));
                  const newIdx = prev.findIndex((f) => f.id === String(targetId));
                  if (oldIdx < 0 || newIdx < 0) return prev;
                  const next = [...prev];
                  const [moved] = next.splice(oldIdx, 1);
                  next.splice(newIdx, 0, moved);
                  return next;
                });
              }}
            >
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <SortableFieldRow
                    key={field.id}
                    field={field}
                    index={index}
                    total={fields.length}
                    onChange={handleUpdateField}
                    onMove={handleMove}
                    onRemove={handleRemoveField}
                  />
                ))}
              </div>
            </DragDropProvider>
          )}
        </div>

        {/* Live Preview */}
        <Card className="h-fit p-6 xl:col-span-5">
          <div className="mb-4 flex items-center justify-between border-b border-card-border pb-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Live Frontend Preview
              </h2>
              <p className="text-xs text-text-tertiary">
                Synced with /api/forms?formId={rawFormId}
              </p>
            </div>
            <Badge color="blue" size="sm">
              {fields.length} fields
            </Badge>
          </div>

          <form onSubmit={handlePreviewSubmit} noValidate className="space-y-4">
            {fields.map((f) => (
              <div key={f.id}>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  {f.label}
                  {f.required && <span className="ml-1 text-error-500">*</span>}
                </label>

                {f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={previewValues[f.name] || ""}
                    onChange={(e) =>
                      setPreviewValues((prev) => ({
                        ...prev,
                        [f.name]: e.target.value,
                      }))
                    }
                    placeholder={f.placeholder}
                    className="w-full rounded-lg border border-input-border bg-input-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500"
                  />
                ) : f.type === "select" ? (
                  <select
                    value={previewValues[f.name] || ""}
                    onChange={(e) =>
                      setPreviewValues((prev) => ({
                        ...prev,
                        [f.name]: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input-border bg-input-background px-3 text-sm text-text-primary outline-none focus:border-primary-500"
                  >
                    <option value="">{f.placeholder || "Select an option..."}</option>
                    {(f.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={f.type === "email" ? "email" : "text"}
                    value={previewValues[f.name] || ""}
                    onChange={(e) =>
                      setPreviewValues((prev) => ({
                        ...prev,
                        [f.name]: e.target.value,
                      }))
                    }
                    placeholder={f.placeholder}
                  />
                )}

                {previewErrors[f.name] && (
                  <p className="mt-1 text-xs font-medium text-error-500">
                    {previewErrors[f.name]}
                  </p>
                )}
              </div>
            ))}

            <Button type="submit" variant="primary" className="w-full">
              Test Validation Preview
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
