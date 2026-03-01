export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
        MotoGP Predictions 2026 &middot; v{process.env.NEXT_PUBLIC_APP_VERSION}
      </div>
    </footer>
  );
}
