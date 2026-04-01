const BASE_URL = "http://localhost:5000/api/quotes";

// GET /api/quotes?search=termen
// Daca `search` este gol sau lipsa, se returneaza toate citatele.
export async function getAllQuotes(search = "") {
    const url = search.trim()
        ? `${BASE_URL}?search=${encodeURIComponent(search.trim())}`
        : BASE_URL;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Nu s-au putut prelua citatele.");
    return response.json();
}

export async function addQuote(quoteData) {
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.errors?.join(", ") || "Nu s-a putut adauga citatul");
    }
    return response.json();
}

export async function updateQuote(id, quoteData) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.errors?.join(", ") || "Nu s-a putut actualiza citatul.");
    }
    return response.json();
}

export async function deleteQuote(id) {
    const response = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Nu s-a putut sterge citatul.");
}

