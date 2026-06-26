type PlaceholderSectionProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export function PlaceholderSection({ icon, title, description }: PlaceholderSectionProps) {
  return (
    <section className="placeholder-section">
      <div className="stat-icon">{icon}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
