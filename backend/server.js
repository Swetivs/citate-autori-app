const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');

require("dotenv").config();

const OpenAI = require("openai");

const openai = new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: process.env.GITHUB_TOKEN,
});

const app = express();
app.use(cors()); //Permite cererri cros-origin
app.use(express.json()); //parsare json pentru request body

// Directorul unde salvam imaginile descarcate.
// path.join asigura compatibilitate cross-platform.
const IMAGES_DIR = path.join(__dirname, "images");

// Cream directorul /images daca nu exista deja
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

app.use("/images", express.static(path.join(__dirname, "images"))); // Servire imagini statice

const JSON_SERVER_URL = "http://localhost:3000/quotes";

const validateId = (req, res, next) => {
    if (!req.params.id || isNaN(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" })
    }
    next();
}

const quoteSchema = Joi.object({
    author: Joi.string().min(2).required(),
    quote: Joi.string().min(5).required(),
    imageUrl: Joi.string().allow("").optional(),
});

// GET /api/quotes?search=termen
// Daca parametrul `search` exista in query string, filtram rezultatele.
// Cautarea este case-insensitive si cauta atat in author cat si in quote.
app.get("/api/quotes", async (req, res) => {
    try {
        const response = await fetch(JSON_SERVER_URL);
        const data = await response.json();

        const { search } = req.query;

        if (search && search.trim()) {
            const term = search.trim().toLowerCase();

            const filtered = data.filter((q) =>
                q.author.toLowerCase().includes(term) ||
                q.quote.toLowerCase().includes(term)
            );

            return res.status(200).json(filtered);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Eroare la preluarea citatelor:", error.message);
        res.status(500).json({ error: "Nu s-au putut prelua citatele." });
    }
});

// POST /api/quotes/fetch-image
// Primeste { author } din body, cauta pe Wikipedia,
// descarca imaginea si o salveaza in /images.
// Returneaza URL-ul local al imaginii.
app.post("/api/quotes/fetch-image", async (req, res) => {
    const { author } = req.body;

    if (!author || !author.trim()) {
        return res.status(400).json({ error: "Numele autorului este obligatoriu." });
    }

    try {
        // "Albert Einstein" -> "Albert_Einstein"
        const wikiName = author.trim().replace(/\s+/g, "_");
        const wikiUrl =
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiName)}`;

        // Cerere catre Wikipedia REST API
        const wikiResponse = await fetch(wikiUrl, {
            headers: {
                "User-Agent": "PrintingQuotesApp/1.0"
            }
        });

        if (!wikiResponse.ok) {
            return res.status(404).json({
                error: `Autorul "${author}" nu a fost gasit pe Wikipedia.`
            });
        }

        const wikiData = await wikiResponse.json();

        // Verificam daca pagina Wikipedia are imagine thumbnail
        if (!wikiData.thumbnail?.source) {
            return res.status(404).json({
                error: `Nu exista imagine disponibila pentru "${author}" pe Wikipedia.`
            });
        }

        const imageUrl = wikiData.thumbnail.source;

        // Determinam extensia fisierului din URL (.jpg, .png etc.)
        const imageExt = imageUrl.split(".").pop().split("?")[0].toLowerCase() || "jpg";

        // Numele fisierului local: "albert_einstein.jpg"
        const fileName = `${author.trim().toLowerCase().replace(/\s+/g, "_")}.${imageExt}`;
        const filePath = path.join(IMAGES_DIR, fileName);

        // Daca imaginea a fost descarcata anterior, o returnam direct
        if (fs.existsSync(filePath)) {
            return res.status(200).json({ imageUrl: `/images/${fileName}` });
        }

        // Descarcam imaginea de la Wikipedia
        const imgResponse = await fetch(imageUrl);
        if (!imgResponse.ok) {
            return res.status(500).json({ error: "Nu s-a putut descarca imaginea." });
        }

        // Convertim raspunsul intr-un Buffer (date binare)
        const buffer = Buffer.from(await imgResponse.arrayBuffer());

        // Scriem fisierul pe disc in directorul /images
        fs.writeFileSync(filePath, buffer);

        // Returnam URL-ul local - Express serveste /images/* ca static
        res.status(200).json({ imageUrl: `/images/${fileName}` });
    } catch (error) {
        console.error("Eroare la fetch-image:", error.message);
        res.status(500).json({ error: "Eroare interna la preluarea imaginii." });
    }
});

app.post("/api/quotes/generate-quote", async (req, res) => {
    const { author } = req.body;

    if (!author || !author.trim()) {
        return res.status(400).json({ error: "Numele autorului este obligatoriu!" });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "system",
                content: 'Esti un cunoscator in literatura si filosfie. Generezi citate scurte, inspirationale si autentice. Raspunzi DOAR cu citatul, fara ghilimele, fara numele autorului, fara explicatii suplimentare. Maxim 2 propozitii!'
            },
            {
                role: "user",
                content: `Scrie un citat autentic specific lui ${author.trim()}. Daca autorul are citate celebre cunoscute, foloseste unul dintre ele. Daca nu genereaza unul in stilul si filosofia sa.`
            },
            ],
            max_tokens: 150,
            temperature: 0.7,
        });

        const generateQuote = completion.choices[0].message.content.trim();

        res.status(200).json({ quote: generateQuote });
    } catch (error) {
        console.error("Eroare OpenAI:", error.message);

        if (error.status === 401) {
            return res.status(500).json({ error: "Cheie API OpenAI invalida!" });
        }

        return res.status(500).json({ error: "Nu s-a putut genera citatul!" });
    }
});

app.post("/api/quotes", async (req, res) => {

    const { error } = quoteSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const response = await fetch(JSON_SERVER_URL);
        const quotes = await response.json();

        //geneream un id numeric (urmatorul nr disponib)
        const newId = quotes.length > 0 ? Math.max(...quotes.map(q => Number(q.id))) + 1 : 1;

        const newQuote = { id: newId.toString(), ...req.body };

        const postResponse = await fetch(JSON_SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newQuote),
        });

        const data = await postResponse.json();
        res.status(postResponse.status).json(data);
    } catch (error) {
        console.error("Error adding quotes", error);
        res.status(500).json({ message: "Failed to add quote!" })
    }
});

app.put("/api/quotes/:id", validateId, async (req, res) => {

    const { error } = quoteSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const quoteId = req.params.id;
        const updateQuote = { id: quoteId, ...req.body };

        const putResponse = await fetch(`${JSON_SERVER_URL}/${quoteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateQuote),
        });

        const data = await putResponse.json();

        const recorderData = { id: data.id, author: data.author, quote: data.quote };
        res.status(putResponse.status).json(recorderData);
    } catch (error) {
        console.error("Error updating quote:", error);
        res.status(500).json({ error: "Failed to update quote" });
    }
})


//Pornim serversul pe portul 5000
const PORT = process.env.port || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} `);
    console.log(`Server static images from: ${path.join(__dirname, "images")} `);

});

//veri9ficam repornirea automata a serverului
console.log();