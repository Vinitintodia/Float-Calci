const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-4">This page doesn't exist.</p>
      <a href="/" className="text-brand-blue hover:underline">
        Back to Float Calci
      </a>
    </div>
  </div>
);

export default NotFound;
