export default function BlockedPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-6 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">Access blocked</p>
      <h1 className="mt-2 max-w-md">You must be over 21 to use this store</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Based on your response, browsing and shopping are not available. There
        are no product links from this page.
      </p>
    </div>
  );
}
