import { X } from "lucide-react";
import type { Job } from "../../types";

type JobDetailsModalProps = {
  job: Job;
  onClose: () => void;
  onEdit: () => void;
  onCloseJob: () => void;
  onDelete: () => void;
};

export function JobDetailsModal({
  job,
  onClose,
  onEdit,
  onCloseJob,
  onDelete,
}: JobDetailsModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="job-modal job-view-modal" role="dialog" aria-modal="true" aria-labelledby="job-view-title">
        <div className="modal-head">
          <div>
            <span className={`status-pill ${job.status}`}>{job.status}</span>
            <h2 id="job-view-title">{job.title}</h2>
            <p>
              {[job.department, job.location, job.employment_type].filter(Boolean).join(" · ") ||
                "No metadata"}
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
        </div>

        <div className="detail-columns">
          <div>
            <span>Description</span>
            <p>{job.description}</p>
          </div>
          <div>
            <span>Requirements</span>
            <p>{job.requirements}</p>
          </div>
        </div>

        <div className="form-actions">
          <button className="primary-button" type="button" onClick={onEdit}>
            Edit job
          </button>
          {job.status === "open" ? (
            <button className="secondary-button" type="button" onClick={onCloseJob}>
              Close job
            </button>
          ) : null}
          <button className="danger-button" type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}
