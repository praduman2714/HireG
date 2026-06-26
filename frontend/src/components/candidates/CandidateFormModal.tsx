import { FormEvent } from "react";
import { X } from "lucide-react";
import type { Candidate, CandidateFormState, CandidateStatus } from "../../types";

type CandidateFormModalProps = {
  candidate: Candidate | null;
  form: CandidateFormState;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (field: keyof CandidateFormState, value: string) => void;
};

const statusOptions: CandidateStatus[] = ["new", "reviewing", "shortlisted", "rejected", "hired"];

export function CandidateFormModal({
  candidate,
  form,
  isSaving,
  onClose,
  onSubmit,
  onUpdate,
}: CandidateFormModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="job-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-modal-title">
        <div className="modal-head">
          <div>
            <span>{candidate ? "Edit candidate" : "New candidate"}</span>
            <h2 id="candidate-modal-title">{candidate ? "Update candidate" : "Add candidate"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <form className="job-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label>
              <span>Name</span>
              <input
                maxLength={160}
                value={form.name}
                onChange={(event) => onUpdate("name", event.target.value)}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                maxLength={255}
                type="email"
                value={form.email}
                onChange={(event) => onUpdate("email", event.target.value)}
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              <span>Phone</span>
              <input
                maxLength={40}
                value={form.phone}
                onChange={(event) => onUpdate("phone", event.target.value)}
              />
            </label>
            <label>
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => onUpdate("status", event.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span>Resume text</span>
            <textarea
              value={form.resume_text}
              onChange={(event) => onUpdate("resume_text", event.target.value)}
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Saving" : candidate ? "Save changes" : "Add candidate"}
            </button>
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
