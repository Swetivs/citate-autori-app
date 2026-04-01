import { useState } from "react";

// Parola este definita ca constanta.
// Intr-o aplicatie reala ar proveni din variabile de mediu (.env).
const MANAGE_PASSWORD = "quotes2025";

// PasswordGate invaluieste continut protejat.
// Daca utilizatorul este autentificat, reda `children`.
// Altfel, afiseaza formularul de parola.
export default function PasswordGate({ children }) {
  // Verificam sessionStorage la montare - daca utilizatorul s-a
  // autentificat in aceasta sesiune de browser, nu mai cerem parola.
  // sessionStorage se goleste automat la inchiderea tab-ului.
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("manage_auth") === "true",
  );

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();

    if (password === MANAGE_PASSWORD) {
      // Salvam autentificarea in sessionStorage
      sessionStorage.setItem("manage_auth", "true");
      setAuthenticated(true);
    } else {
      setError("Parola incorecta. Incearca din nou.");
      setPassword("");
      // Animatie de shake pentru feedback vizual la eroare
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  // Daca este autentificat, redam direct continutul protejat
  if (authenticated) return children;

  // Altfel, afisam ecranul de blocare
  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center px-4">
      <div
        className={`bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-100 ${
          shake ? "animate-bounce" : ""
        }`}
      >
        <div className="text-center mb-6">
          <span className="text-5xl">LOCK</span>
          <h1 className="text-xl font-bold text-gray-800 mt-3">
            Zona protejata
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Introduceti parola pentru a accesa administrarea citatelor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Parola
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              autoFocus
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                error
                  ? "border-red-400 focus:ring-red-200 bg-red-50"
                  : "border-gray-300 focus:ring-indigo-300"
              }`}
            />
            {error && <p className="mt-1 text-xs text-red-500">! {error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Intra in administrare
          </button>
        </form>

        <p className="text-center mt-4">
          <a href="/" className="text-xs text-gray-400 hover:text-indigo-500">
            Inapoi la citate
          </a>
        </p>
      </div>
    </div>
  );
}
