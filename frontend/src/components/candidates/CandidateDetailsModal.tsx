import { X } from "lucide-react";
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

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="job-modal candidate-view-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-view-title">
        <div className="modal-head">
          <div>
            <span className={`status-pill ${candidate.status}`}>{candidate.status}</span>
            <h2 id="candidate-view-title">{candidate.name || "Unnamed candidate"}</h2>
            <p>{candidate.email || "No email"} · {candidate.phone || "No phone"}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
        </div>

        <div className="candidate-score-strip">
          <div>
            <span>Fit score</span>
            <strong>{candidate.fit_score ?? "Not scored"}</strong>
          </div>
          <div>
            <span>Summary</span>
            <p>{candidate.fit_summary || "No fit summary yet."}</p>
          </div>
        </div>

        <div className="detail-block">
          <span>Resume</span>
          {resumeSections.length > 0 ? (
            <div className="resume-viewer">
              {resumeSections.map((section) => (
                <article className="resume-section" key={section.title}>
                  <h3>{section.title}</h3>
                  {section.lines.length > 0 ? (
                    <ul>
                      {section.lines.map((line, index) => (
                        <li key={`${section.title}-${index}`}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p>No resume text stored.</p>
          )}
        </div>

        <div className="detail-block">
          <span>Fit explanation</span>
          <p>{fitExplanation || "No fit explanation yet."}</p>
        </div>

        <div className="detail-columns">
          <div>
            <span>Parsed profile</span>
            <p>{parsedSkills ? `Skills: ${parsedSkills}` : "No parsed resume data yet."}</p>
          </div>
          <div>
            <span>AI signals</span>
            {matchedSkills.length || missingSkills.length || strengths.length || concerns.length ? (
              <div className="ai-signals">
                <SignalList label="Matched" values={matchedSkills} />
                <SignalList label="Missing" values={missingSkills} />
                <SignalList label="Strengths" values={strengths} />
                <SignalList label="Concerns" values={concerns} />
              </div>
            ) : (
              <p>No detailed AI signals yet.</p>
            )}
          </div>
        </div>

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

function SignalList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div>
      <strong>{label}</strong>
      <p>{values.join(", ")}</p>
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
