export const dynamic = "force-static";

export default function Offline() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <img
        src="/wappen.svg"
        alt="Wappen Wiliberg"
        className="mx-auto h-24 w-auto"
      />
      <h1 className="h-title mt-4">Offline</h1>
      <p className="mt-2 text-sm text-wili-ink/70">
        Sie sind momentan nicht mit dem Internet verbunden. Bitte versuchen Sie
        es später erneut.
      </p>
    </div>
  );
}
