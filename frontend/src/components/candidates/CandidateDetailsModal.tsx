import { BrainCircuit, Mail, Phone, Sparkles, X } from "lucide-react";
import type { Candidate } from "../../types";

type CandidateDetailsModalProps = {
  candidate: Candidate;
  onClose: () => void;
  onEdit: () => void;
  onParse: () => void;
  onScore: () => void;
  onDelete: () => void;
  isBusy: boolean;
};

export function CandidateDetailsModal({
  candidate,
  onClose,
  onEdit,
  onParse,
  onScore,
  onDelete,
  isBusy,
}: CandidateDetailsModalProps) {
  const parsedSkills = Array.isArray(candidate.parsed_resume?.skills)
    ? candidate.parsed_resume.skills.join(", ")
    : null;
  const fitExplanation = getTextValue(candidate.fit_explanation)
    || getTextValue(candidate.fit_result?.explanation)
    || getTextValue(candidate.fit_result?.reasoning);
  const resumeSections = formatResumeSections(candidate.resume_text);
  const matchedSkills = getStringList(candidate.fit_result?.matched_skills);
  const missingSkills = getStringList(candidate.fit_result?.missing_skills);
  const strengths = getStringList(candidate.fit_result?.strengths);
  const concerns = getStringList(candidate.fit_result?.concerns);
  const scoreLabel = candidate.fit_score === null ? "Not scored" : `${candidate.fit_score}/100`;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="job-modal candidate-view-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-view-title">
        <div className="candidate-profile-head">
          <div className="candidate-avatar" aria-hidden="true">
            {(candidate.name || "C").slice(0, 1).toUpperCase()}
          </div>
          <div className="candidate-title-group">
            <div className="candidate-title-row">
              <h2 id="candidate-view-title">{candidate.name || "Unnamed candidate"}</h2>
              <span className={`status-pill ${candidate.status}`}>{candidate.status}</span>
            </div>
            <div className="candidate-contact-row">
              <span><Mail size={15} />{candidate.email || "No email"}</span>
              <span><Phone size={15} />{candidate.phone || "No phone"}</span>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
        </div>

        <div className="candidate-insight-grid">
          <article className="candidate-score-card">
            <span><Sparkles size={16} /> Fit score</span>
            <strong>{scoreLabel}</strong>
            <p>{candidate.fit_summary || "Run AI scoring to generate a concise recruiter summary."}</p>
          </article>
          <article className="candidate-explanation-card">
            <span><BrainCircuit size={16} /> Fit explanation</span>
            <p>{fitExplanation || "No fit explanation yet."}</p>
          </article>
        </div>

        <div className="candidate-review-grid">
          <section className="candidate-panel">
            <div className="candidate-panel-head">
              <span>AI signals</span>
              <small>Generated from resume and job requirements</small>
            </div>
            {matchedSkills.length || missingSkills.length || strengths.length || concerns.length ? (
              <div className="ai-signals">
                <SignalList tone="positive" label="Matched skills" values={matchedSkills} />
                <SignalList tone="warning" label="Missing skills" values={missingSkills} />
                <SignalList tone="positive" label="Strengths" values={strengths} />
                <SignalList tone="neutral" label="Concerns" values={concerns} />
              </div>
            ) : (
              <p>No detailed AI signals yet.</p>
            )}
          </section>

          <section className="candidate-panel">
            <div className="candidate-panel-head">
              <span>Parsed profile</span>
              <small>Extracted structured resume information</small>
            </div>
            <p>{parsedSkills ? parsedSkills : "No parsed resume data yet."}</p>
          </section>
        </div>

        <section className="candidate-panel resume-panel">
          <div className="candidate-panel-head">
            <span>Resume</span>
            <small>Formatted for recruiter review</small>
          </div>
          {resumeSections.length > 0 ? (
            <div className="resume-document">
              {resumeSections.map((section) => (
                <article className="resume-section" key={section.title}>
                  <h3>{section.title}</h3>
                  {section.lines.length > 0 ? (
                    <div className="resume-lines">
                      {section.lines.map((line, index) => (
                        <p key={`${section.title}-${index}`}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p>No resume text stored.</p>
          )}
        </section>

        <div className="form-actions">
          <button className="primary-button" type="button" onClick={onEdit}>
            Edit
          </button>
          <button className="secondary-button" disabled={isBusy} type="button" onClick={onParse}>
            {isBusy ? "Working" : "Parse resume"}
          </button>
          <button className="secondary-button" disabled={isBusy} type="button" onClick={onScore}>
            {isBusy ? "Working" : "Score fit"}
          </button>
          <button className="danger-button" type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

function SignalList({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: "positive" | "warning" | "neutral";
}) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className={`signal-list ${tone}`}>
      <strong>{label}</strong>
      <div>
        {values.slice(0, 8).map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>
    </div>
  );
}

function getTextValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function formatResumeSections(resumeText: string | null): Array<{ title: string; lines: string[] }> {
  if (!resumeText) {
    return [];
  }

  const cleaned = resumeText
    .replace(/\/h[^\s]*me/gi, " ")
    .replace(/\/envel[^\s]*pe/gi, " ")
    .replace(/♂phone/gi, " Phone ")
    .replace(/\/linkedin\/?/gi, " LinkedIn ")
    .replace(/\/github/gi, " GitHub ")
    .replace(/\/code/gi, " Code ")
    .replace(/\s+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .trim();

  if (!cleaned) {
    return [];
  }

  const headings = [
    "Profile Summary",
    "Experience",
    "Projects",
    "Skills And Interests",
    "Skills",
    "Achievements",
    "Education",
  ];
  const pattern = new RegExp(`\\b(${headings.join("|")})\\b`, "gi");
  const pieces = cleaned.split(pattern).map((piece) => piece.trim()).filter(Boolean);
  const sections: Array<{ title: string; lines: string[] }> = [];

  if (pieces.length > 0 && !isHeading(pieces[0], headings)) {
    sections.push({
      title: "Candidate snapshot",
      lines: splitResumeLines(pieces.shift() || ""),
    });
  }

  for (let index = 0; index < pieces.length; index += 2) {
    const title = normalizeHeading(pieces[index] || "Resume details", headings);
    const content = pieces[index + 1] || "";
    sections.push({ title, lines: splitResumeLines(content) });
  }

  return sections.filter((section) => section.lines.length > 0).slice(0, 8);
}

function splitResumeLines(content: string): string[] {
  return content
    .replace(/\s*[•]\s*/g, "\n")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s+(?=(?:Languages|Backend & Cloud|GenAI|Frontend|Tools):)/g, "\n")
    .split(/\n|(?=\b[A-Z][A-Za-z .()]+(?:Engineer|Assistant|Generator)\b)|(?=\b[A-Z][A-Za-z .]+(?:\d{4}|Present)\b)/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 14);
}

function isHeading(value: string, headings: string[]): boolean {
  return headings.some((heading) => heading.toLowerCase() === value.toLowerCase());
}

function normalizeHeading(value: string, headings: string[]): string {
  return headings.find((heading) => heading.toLowerCase() === value.toLowerCase()) || value;
}
