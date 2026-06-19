/**
 * Layout du blog
 */

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background">
      {children}
    </div>
  );
}
