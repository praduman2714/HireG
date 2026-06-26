import uuid
from pathlib import Path

from docx import Document
from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader

from app.core.config import settings


ALLOWED_RESUME_EXTENSIONS = {".pdf", ".docx", ".txt"}


def validate_resume_file(file: UploadFile) -> str:
    original_name = file.filename or ""
    suffix = Path(original_name).suffix.lower()
    if suffix not in ALLOWED_RESUME_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume must be a PDF, DOCX, or TXT file",
        )
    return suffix


def save_resume_file(file: UploadFile, suffix: str) -> Path:
    upload_dir = Path(settings.upload_dir) / "resumes"
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / f"{uuid.uuid4()}{suffix}"
    with file_path.open("wb") as destination:
        while chunk := file.file.read(1024 * 1024):
            destination.write(chunk)

    return file_path


def extract_resume_text(file_path: Path) -> str:
    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        return extract_pdf_text(file_path)
    if suffix == ".docx":
        return extract_docx_text(file_path)
    if suffix == ".txt":
        return extract_txt_text(file_path)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported resume file type",
    )


def extract_pdf_text(file_path: Path) -> str:
    reader = PdfReader(str(file_path))
    parts = [page.extract_text() or "" for page in reader.pages]
    return normalize_resume_text("\n".join(parts))


def extract_docx_text(file_path: Path) -> str:
    document = Document(str(file_path))
    parts = [paragraph.text for paragraph in document.paragraphs]
    return normalize_resume_text("\n".join(parts))


def extract_txt_text(file_path: Path) -> str:
    try:
        text = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = file_path.read_text(encoding="latin-1")
    return normalize_resume_text(text)


def normalize_resume_text(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    cleaned = "\n".join(line for line in lines if line)
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract text from the uploaded resume",
        )
    return cleaned
