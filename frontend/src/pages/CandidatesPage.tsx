import { useEffect, useMemo, useState, FormEvent } from "react";
import { BrainCircuit, FileUp, Plus, Sparkles, Star, Trash2 } from "lucide-react";
import {
  createCandidate,
  deleteCandidate,
  getCandidatesForJob,
  getJobs,
  parseCandidateResume,
  scoreCandidateFit,
  updateCandidate,
  uploadCandidateResume,
} from "../api";
import { CandidateDetailsModal } from "../components/candidates/CandidateDetailsModal";
import { CandidateFormModal } from "../components/candidates/CandidateFormModal";
import { ResumeUploadModal } from "../components/candidates/ResumeUploadModal";
import type { Candidate, CandidateFormState, CandidateStatus, Job } from "../types";

const emptyCandidateForm: CandidateFormState = {
  name: "",
  email: "",
  phone: "",
  status: "new",
  resume_text: "",
};

type CandidatesPageProps = {
  token: string;
};

export function CandidatesPage({ token }: CandidatesPageProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [candidateForm, setCandidateForm] = useState<CandidateFormState>(emptyCandidateForm);
  const [statusFilter, setStatusFilter] = useState<"all" | CandidateStatus>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiBusy, setIsAiBusy] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const scoredCount = candidates.filter((candidate) => candidate.fit_score !== null).length;
  const shortlistedCount = candidates.filter((candidate) => candidate.status === "shortlisted").length;

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadCandidates(selectedJobId);
    } else {
      setCandidates([]);
      setIsLoading(false);
    }
  }, [selectedJobId, statusFilter]);

  async function loadJobs() {
    setError(null);
    try {
      const loadedJobs = await getJobs(token);
      setJobs(loadedJobs);
      setSelectedJobId((current) => current || loadedJobs[0]?.id || "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load jobs");
      setIsLoading(false);
    }
  }

  async function loadCandidates(jobId = selectedJobId) {
    if (!jobId) {
      return;
    }
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
      setCandidates(await getCandidatesForJob(token, jobId, params.toString()));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load candidates");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCandidate(null);
    setCandidateForm(emptyCandidateForm);
    setIsCandidateModalOpen(true);
  }

  function openEditModal(candidate: Candidate) {
    setEditingCandidate(candidate);
    setCandidateForm({
      name: candidate.name ?? "",
      email: candidate.email ?? "",
      phone: candidate.phone ?? "",
      status: candidate.status,
      resume_text: candidate.resume_text ?? "",
    });
    setIsCandidateModalOpen(true);
  }

  function closeCandidateModal() {
    setEditingCandidate(null);
    setCandidateForm(emptyCandidateForm);
    setIsCandidateModalOpen(false);
  }

  function updateCandidateForm(field: keyof CandidateFormState, value: string) {
    setCandidateForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCandidateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedJobId) {
      setError("Create or select a job before adding candidates");
      return;
    }

    setIsSaving(true);
    setError(null);
    const payload = {
      name: candidateForm.name || null,
      email: candidateForm.email || null,
      phone: candidateForm.phone || null,
      status: candidateForm.status,
      resume_text: candidateForm.resume_text || null,
    };

    try {
      if (editingCandidate) {
        await updateCandidate(token, editingCandidate.id, payload);
      } else {
        await createCandidate(token, selectedJobId, payload);
      }
      closeCandidateModal();
      await loadCandidates();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save candidate");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResumeUpload(formData: FormData) {
    if (!selectedJobId) {
      setError("Create or select a job before uploading resumes");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await uploadCandidateResume(token, selectedJobId, formData);
      setIsUploadModalOpen(false);
      await loadCandidates();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not upload resume");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(candidate: Candidate) {
    setError(null);
    try {
      await deleteCandidate(token, candidate.id);
      setViewingCandidate((current) => (current?.id === candidate.id ? null : current));
      await loadCandidates();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete candidate");
    }
  }

  async function handleParse(candidate: Candidate) {
    setIsAiBusy(true);
    setError(null);
    try {
      const updated = await parseCandidateResume(token, candidate.id);
      setViewingCandidate(updated);
      await loadCandidates();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not parse resume");
    } finally {
      setIsAiBusy(false);
    }
  }

  async function handleScore(candidate: Candidate) {
    setIsAiBusy(true);
    setError(null);
    try {
      const updated = await scoreCandidateFit(token, candidate.id);
      setViewingCandidate(updated);
      await loadCandidates();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not score fit");
    } finally {
      setIsAiBusy(false);
    }
  }

  return (
    <section className="dashboard-content" aria-label="Candidates dashboard">
      <div className="jobs-page-head">
        <div>
          <span>Candidates</span>
          <h1>Candidate pipeline</h1>
          <p>Upload resumes, manage candidate records, parse profiles, and score fit.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={() => setIsUploadModalOpen(true)}>
            <FileUp size={18} />
            Upload resume
          </button>
          <button className="primary-button" type="button" onClick={openCreateModal}>
            <Plus size={18} />
            Add candidate
          </button>
        </div>
      </div>

      <div className="stats-grid candidates-stats">
        <article className="stat-card">
          <div className="stat-icon"><Sparkles size={20} /></div>
          <span>Total candidates</span>
          <strong>{candidates.length}</strong>
          <small>For selected job</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon"><Star size={20} /></div>
          <span>Shortlisted</span>
          <strong>{shortlistedCount}</strong>
          <small>Ready for review</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon"><BrainCircuit size={20} /></div>
          <span>AI scored</span>
          <strong>{scoredCount}</strong>
          <small>Fit score generated</small>
        </article>
      </div>

      <section className="jobs-table-card">
        <div className="filters-row">
          <label>
            <span>Job</span>
            <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}>
              {jobs.length === 0 ? <option value="">No jobs available</option> : null}
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | CandidateStatus)}
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </label>
          <label>
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  loadCandidates();
                }
              }}
              placeholder="Name or email"
            />
          </label>
          <button className="secondary-button" type="button" onClick={() => loadCandidates()}>
            Apply
          </button>
        </div>

        {selectedJob ? <p className="selected-context">Showing candidates for {selectedJob.title}</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        <div className="candidates-table">
          <div className="candidates-table-row candidates-table-head">
            <span>Candidate</span>
            <span>Status</span>
            <span>Fit score</span>
            <span>Resume</span>
            <span>Actions</span>
          </div>
          {isLoading ? <p className="muted-text table-empty">Loading candidates...</p> : null}
          {!isLoading && candidates.length === 0 ? (
            <p className="muted-text table-empty">No candidates for this job yet.</p>
          ) : null}
          {candidates.map((candidate) => (
            <div className="candidates-table-row" key={candidate.id}>
              <div className="role-cell">
                <strong>{candidate.name || "Unnamed candidate"}</strong>
                <span>{candidate.email || "No email"}</span>
              </div>
              <span className={`status-pill ${candidate.status}`}>{candidate.status}</span>
              <span className="score-cell">{candidate.fit_score ?? "Not scored"}</span>
              <span>{candidate.resume_text ? "Text ready" : "Missing"}</span>
              <div className="table-actions">
                <button className="secondary-button" type="button" onClick={() => setViewingCandidate(candidate)}>
                  View
                </button>
                <button className="secondary-button" type="button" onClick={() => openEditModal(candidate)}>
                  Edit
                </button>
                <button className="secondary-button" type="button" onClick={() => handleParse(candidate)}>
                  Parse
                </button>
                <button className="secondary-button" type="button" onClick={() => handleScore(candidate)}>
                  Score
                </button>
                <button className="danger-button" type="button" onClick={() => handleDelete(candidate)} aria-label="Delete candidate">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {viewingCandidate ? (
        <CandidateDetailsModal
          candidate={viewingCandidate}
          isBusy={isAiBusy}
          onClose={() => setViewingCandidate(null)}
          onDelete={() => handleDelete(viewingCandidate)}
          onEdit={() => {
            setViewingCandidate(null);
            openEditModal(viewingCandidate);
          }}
          onParse={() => handleParse(viewingCandidate)}
          onScore={() => handleScore(viewingCandidate)}
        />
      ) : null}

      {isCandidateModalOpen ? (
        <CandidateFormModal
          candidate={editingCandidate}
          form={candidateForm}
          isSaving={isSaving}
          onClose={closeCandidateModal}
          onSubmit={handleCandidateSubmit}
          onUpdate={updateCandidateForm}
        />
      ) : null}

      {isUploadModalOpen ? (
        <ResumeUploadModal
          isSaving={isSaving}
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleResumeUpload}
        />
      ) : null}
    </section>
  );
}
