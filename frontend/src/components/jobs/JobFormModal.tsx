import { FormEvent } from "react";
import { X } from "lucide-react";
import type { Job, JobFormState } from "../../types";

type JobFormModalProps = {
  editingJob: Job | null;
  form: JobFormState;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (field: keyof JobFormState, value: string) => void;
};

export function JobFormModal({
  editingJob,
  form,
  isSaving,
  onClose,
  onSubmit,
  onUpdate,
}: JobFormModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="job-modal" role="dialog" aria-modal="true" aria-labelledby="job-modal-title">
        <div className="modal-head">
          <div>
            <span>{editingJob ? "Edit opening" : "New opening"}</span>
            <h2 id="job-modal-title">{editingJob ? "Update job details" : "Create a job"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <form className="job-form" onSubmit={onSubmit}>
          <label>
            <span>Title</span>
            <input
              minLength={2}
              maxLength={160}
              required
              value={form.title}
              onChange={(event) => onUpdate("title", event.target.value)}
            />
          </label>
          <div className="form-grid">
            <label>
              <span>Department</span>
              <input
                maxLength={120}
                value={form.department}
                onChange={(event) => onUpdate("department", event.target.value)}
              />
            </label>
            <label>
              <span>Location</span>
              <input
                maxLength={160}
                value={form.location}
                onChange={(event) => onUpdate("location", event.target.value)}
              />
            </label>
          </div>
          <label>
            <span>Employment type</span>
            <input
              maxLength={80}
              value={form.employment_type}
              onChange={(event) => onUpdate("employment_type", event.target.value)}
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              minLength={10}
              required
              value={form.description}
              onChange={(event) => onUpdate("description", event.target.value)}
            />
          </label>
          <label>
            <span>Requirements</span>
            <textarea
              minLength={10}
              required
              value={form.requirements}
              onChange={(event) => onUpdate("requirements", event.target.value)}
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Saving" : editingJob ? "Save changes" : "Create job"}
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
