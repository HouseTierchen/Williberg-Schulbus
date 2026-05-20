export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-wili-bluelight/40">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-wili-ink md:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <img src="/wappen.svg" alt="" className="h-8 w-auto" />
            <strong className="font-serif text-wili-bluedark">
              Gemeinde Wiliberg
            </strong>
          </div>
          <p>
            Gemeindekanzlei Wiliberg
            <br />
            5058 Wiliberg, Kanton Aargau
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-wili-bluedark">Kontakt</div>
          <p>
            kanzlei@wiliberg.ch
            <br />
            +41 62 000 00 00
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-wili-bluedark">Schulbus</div>
          <p>
            Bei Fragen zum Fahrplan oder Krankmeldung wenden Sie sich an die
            Gemeindekanzlei oder nutzen Sie das Eltern-Dashboard.
          </p>
        </div>
      </div>
      <div className="border-t border-gray-200 py-3 text-center text-xs text-wili-ink/70">
        © {new Date().getFullYear()} Einwohnergemeinde Wiliberg · Eifach schön!
      </div>
    </footer>
  );
}
