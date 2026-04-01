import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QuoteCard from "../components/QuoteCard";
import {
  getAllQuotes,
  addQuote,
  updateQuote,
  deleteQuote,
} from "../api/quoteApi";
import { useFormValidation } from "../hooks/useFormValidation";

// Regulile de validare sunt definite o singura data, in afara componentei.
// Astfel nu se recreeaza la fiecare render.
const VALIDATION_RULES = {
  author: {
    required: true,
    requiredMsg: "Autorul este obligatoriu.",
    minLength: 2,
    minLengthMsg: "Autorul trebuie sa aiba cel putin 2 caractere.",
    maxLength: 100,
    maxLengthMsg: "Autorul poate avea maxim 100 de caractere.",
  },
  quote: {
    required: true,
    requiredMsg: "Citatul este obligatoriu.",
    minLength: 5,
    minLengthMsg: "Citatul trebuie sa aiba cel putin 5 caractere.",
    maxLength: 500,
    maxLengthMsg: "Citatul poate avea maxim 500 de caractere.",
  },
};

export default function ManagePage() {
  // Lista de citate afisata in sectiunea de jos a paginii
  const [quotes, setQuotes] = useState([]);

  // Daca editingQuote !== null, formularul este in modul EDITARE.
  // Contine obiectul complet { id, author, quote } al citatului editat.
  const [editingQuote, setEditingQuote] = useState(null);

  // Datele controlate ale formularului - sincronizate cu input-urile
  const [formData, setFormData] = useState({ author: "", quote: "" });

  // Mesaj de feedback dupa operatii (succes sau eroare)
  const [feedback, setFeedback] = useState({ message: "", type: "" });

  const [loading, setLoading] = useState(true);

  // HOOK-ul de validare - destructuram errors, validate, clearErrors
  const { errors, validate, clearErrors } = useFormValidation(VALIDATION_RULES);

  // La montarea componentei, preluam citatele existente
  // Reincarca lista de citate - apelata dupa orice operatie CRUD
  const fetchQuotes = useCallback(async () => {
    try {
      const data = await getAllQuotes();
      setQuotes(data);
    } catch (err) {
      showFeedback(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Handler generic pentru toate campurile formularului.
  // [e.target.name] foloseste proprietatea determinata pentru a actualiza
  // campul corespunzator (author sau quote) fara un handler per camp.
  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Trimitem formularului - comportament diferit in functie de mod
  async function handleSubmit(e) {
    // Prevenim comportamentul implicit al formularului (reload pagina)
    e.preventDefault();

    // VALIDAM local inainte de orice apel la backend.
    // Daca validarea esueaza, oprim executia aici.
    if (!validate(formData)) {
      return;
    }

    try {
      if (editingQuote) {
        // MOD EDITARE: trimitem PUT cu ID-ul citatului editat
        await updateQuote(editingQuote.id, formData);
        showFeedback("Citatul a fost actualizat cu succes.", "success");
      } else {
        // MOD ADAUGARE: trimitem POST fara ID
        await addQuote(formData);
        showFeedback("Citatul a fost adaugat cu succes.", "success");
      }

      // Indiferent de operatie: resetam formularul si reincarcam lista
      resetForm();
      fetchQuotes();
    } catch (err) {
      // Erorile de validare (400) sau retea (500) ajung aici
      showFeedback(err.message, "error");
    }
  }

  // Populeaza formularul cu datele citatului selectat pentru editare.
  // Apelat din QuoteCard via prop-ul onEdit.
  function handleEdit(quote) {
    setEditingQuote(quote);
    setFormData({ author: quote.author, quote: quote.quote });
    clearErrors(); // Stergem erorile anterioare la intrarea in editare
    // Derulam pagina sus - formularul se afla in header
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Sterge citatul cu `id` dupa confirmare utilizator.
  // Apelat din QuoteCard via prop-ul onDelete.
  async function handleDelete(id) {
    if (!window.confirm("Esti sigur ca vrei sa stergi acest citat?")) {
      return;
    }

    try {
      await deleteQuote(id);
      showFeedback("Citatul a fost sters.", "success");
      fetchQuotes();
    } catch (err) {
      showFeedback(err.message, "error");
    }
  }

  // Reseteaza formularul si iese din modul editare
  function resetForm() {
    setEditingQuote(null);
    setFormData({ author: "", quote: "" });
    clearErrors(); // Curatam erorile la resetarea formularului
  }

  // Afiseaza mesajul de feedback si il ascunde automat dupa 3 secunde
  function showFeedback(message, type) {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: "", type: "" }), 3000);
  }

  // Clasa de baza pentru input - reutilizata pentru toate campurile
  const inputBase =
    "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition";

  // Functie care returneaza clasa corecta in functie de starea campului
  // Campurile cu eroare primesc border rosu, cele normale border gri
  const inputClass = (field) =>
    `${inputBase} ${
      errors[field]
        ? "border-red-400 focus:ring-red-300 bg-red-50"
        : "border-gray-300 focus:ring-indigo-300 bg-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">
            Administrare citate
          </h1>

          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors duration-200"
          >
            Inapoi la citate
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {feedback.message && (
          <div
            className={
              "px-4 py-3 rounded-lg text-sm font-medium transition-opacity duration-300 " +
              (feedback.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200")
            }
          >
            {feedback.type === "success" ? "OK " : "Eroare: "}
            {feedback.message}
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2
            className={`text-lg font-semibold mb-6 ${
              editingQuote ? "text-amber-600" : "text-indigo-600"
            }`}
          >
            {editingQuote ? "Editeaza citatul" : "Adauga citat nou"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="author"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Autor
              </label>
              <input
                id="author"
                name="author"
                type="text"
                value={formData.author}
                onChange={handleChange}
                placeholder="ex. Marcus Aurelius"
                className={inputClass("author")}
              />

              {errors.author && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <span>!</span>
                  {errors.author}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="quote"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Citat
              </label>
              <textarea
                id="quote"
                name="quote"
                value={formData.quote}
                onChange={handleChange}
                placeholder="Introduceti citatul..."
                rows={4}
                className={`${inputClass("quote")} resize-none`}
              />

              <div className="flex justify-between mt-1">
                {errors.quote ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span>!</span>
                    {errors.quote}
                  </p>
                ) : (
                  <span />
                )}

                <span
                  className={`text-xs ml-auto ${
                    formData.quote.length > 450
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {formData.quote.length}/500
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors duration-200 ${
                  editingQuote
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {editingQuote ? "Salveaza modificarile" : "Adauga citat"}
              </button>

              {editingQuote && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Anuleaza
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Citate existente
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({quotes.length})
            </span>
          </h2>

          {loading ? (
            <p className="text-center text-indigo-500 animate-pulse py-10">
              Se incarca...
            </p>
          ) : quotes.length === 0 ? (
            <p className="text-center text-gray-400 py-10">
              Nu exista citate. Adauga primul folosind formularul de mai sus.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {quotes.map((q) => (
                <QuoteCard
                  key={q.id}
                  quote={q}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
