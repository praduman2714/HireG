import { FormEvent, useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { closeJob, createJob, deleteJob, getJobs, updateJob } from "../api";
import { JobDetailsModal } from "../components/jobs/JobDetailsModal";
import { JobFormModal } from "../components/jobs/JobFormModal";
import type { Job, JobFormState, JobStatus } from "../types";

const emptyJobForm: JobFormState = {
  title: "",
  department: "",
  location: "",
  employment_type: "",
  description: "",
  requirements: "",
};

type JobsPageProps = {
  token: string;
};

export function JobsPage({ token }: JobsPageProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState<JobFormState>(emptyJobForm);
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  async function loadJobs() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }
      setJobs(await getJobs(token, params.toString()));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load jobs");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setEditingJob(null);
    setForm(emptyJobForm);
    setIsFormModalOpen(true);
  }

  function openEditModal(job: Job) {
    setEditingJob(job);
    setForm({
      title: job.title,
      department: job.department ?? "",
      location: job.location ?? "",
      employment_type: job.employment_type ?? "",
      description: job.description,
      requirements: job.requirements,
    });
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    setEditingJob(null);
    setForm(emptyJobForm);
    setIsFormModalOpen(false);
  }

  function updateForm(field: keyof JobFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const payload = {
      title: form.title,
      department: form.department || null,
      location: form.location || null,
      employment_type: form.employment_type || null,
      description: form.description,
      requirements: form.requirements,
    };

    try {
      if (editingJob) {
        await updateJob(token, editingJob.id, payload);
      } else {
        await createJob(token, payload);
      }
      closeFormModal();
      await loadJobs();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save job");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClose(job: Job) {
    setError(null);
    try {
      await closeJob(token, job.id);
      await loadJobs();
      setViewingJob((current) => (current?.id === job.id ? { ...current, status: "closed" } : current));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not close job");
    }
  }

  async function handleDelete(job: Job) {
    setError(null);
    try {
      await deleteJob(token, job.id);
      setViewingJob((current) => (current?.id === job.id ? null : current));
      await loadJobs();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete job");
    }
  }

  return (
    <section className="dashboard-content" aria-label="Jobs dashboard">
      <div className="jobs-page-head">
        <div>
          <span>Jobs</span>
          <h1>Job openings</h1>
          <p>Create, filter, close, and manage recruiter-owned openings.</p>
        </div>
        <button className="primary-button" type="button" onClick={openCreateModal}>
          <Plus size={18} />
          New job
        </button>
      </div>

      <section className="jobs-table-card">
        <div className="filters-row">
          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | JobStatus)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label>
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  loadJobs();
                }
              }}
              placeholder="Title keyword"
            />
          </label>
          <button className="secondary-button" type="button" onClick={loadJobs}>
            Apply
          </button>
        </div>

        {error ? <p className="error-message">{error}</p> : null}

        <div className="jobs-table">
          <div className="jobs-table-row jobs-table-head">
            <span>Role</span>
            <span>Status</span>
            <span>Location</span>
            <span>Type</span>
            <span>Actions</span>
          </div>
          {isLoading ? <p className="muted-text table-empty">Loading jobs...</p> : null}
          {!isLoading && jobs.length === 0 ? (
            <p className="muted-text table-empty">No jobs yet. Create your first opening.</p>
          ) : null}
          {jobs.map((job) => (
            <div className="jobs-table-row" key={job.id}>
              <div className="role-cell">
                <strong>{job.title}</strong>
                <span>{job.department || "No department"}</span>
              </div>
              <span className={`status-pill ${job.status}`}>{job.status}</span>
              <span className="meta-cell">
                <MapPin size={15} />
                {job.location || "Not set"}
              </span>
              <span>{job.employment_type || "Not set"}</span>
              <div className="table-actions">
                <button className="secondary-button" type="button" onClick={() => setViewingJob(job)}>
                  View
                </button>
                <button className="secondary-button" type="button" onClick={() => openEditModal(job)}>
                  Edit
                </button>
                {job.status === "open" ? (
                  <button className="secondary-button" type="button" onClick={() => handleClose(job)}>
                    Close
                  </button>
                ) : null}
                <button className="danger-button" type="button" onClick={() => handleDelete(job)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {viewingJob ? (
        <JobDetailsModal
          job={viewingJob}
          onClose={() => setViewingJob(null)}
          onEdit={() => {
            setViewingJob(null);
            openEditModal(viewingJob);
          }}
          onCloseJob={() => handleClose(viewingJob)}
          onDelete={() => handleDelete(viewingJob)}
        />
      ) : null}

      {isFormModalOpen ? (
        <JobFormModal
          editingJob={editingJob}
          form={form}
          isSaving={isSaving}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          onUpdate={updateForm}
        />
      ) : null}
    </section>
  );
}
