import { FormEvent, useState } from "react";
import { X } from "lucide-react";

type ResumeUploadModalProps = {
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
};

export function ResumeUploadModal({ isSaving, onClose, onSubmit }: ResumeUploadModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    if (name) formData.append("name", name);
    if (email) formData.append("email", email);
    if (phone) formData.append("phone", phone);
    onSubmit(formData);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="job-modal" role="dialog" aria-modal="true" aria-labelledby="resume-upload-title">
        <div className="modal-head">
          <div>
            <span>Resume upload</span>
            <h2 id="resume-upload-title">Upload candidate resume</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <form className="job-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
          </div>
          <label>
            <span>Phone</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label>
            <span>Resume file</span>
            <input
              accept=".pdf,.docx,.txt"
              required
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" disabled={isSaving || !file} type="submit">
              {isSaving ? "Uploading" : "Upload resume"}
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
