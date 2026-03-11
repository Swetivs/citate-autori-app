const express = require('express');
const cors = require('cors');
const path = require('path');
const Joi = require('joi');

const app = express();
app.use(cors()); //Permite cererri cros-origin
app.use(express.json()); //parsare json pentru request body
app.use("/images", express.static(path.join(__dirname, "images"))); // Servire imagini statice

const JSON_SERVER_URL = "http://localhost:3000/quotes";

const validateId = (req, res, next) => {
    if (isNaN(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" })
    }
    next();
}

const quoteSchema = Joi.object({
    author: Joi.string().min(2).required(),
    quote: Joi.string().min(5).required(),
});

//Extragem citatele
app.get("/api/quotes", async (req, res) => {
    try {
        const response = await fetch(JSON_SERVER_URL);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Eroare la preluarea citatelor:", error);
        res.status(500).json({ error: "Nu s-au putut prelua citatele" });
    }
});

app.post("/api/quotes", validateId, async (req, res) => {

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

        const postResponse = await fetch(JSON_SERVER_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateQuote),
        });

        const data = await response.json();

        const recorderData = { id: data.id, author: data.author, quote: data.quote };
        res.status(response.status).json(recorderData);
    } catch (error) {
        console.error("Error updating quote:", error);
        res.status(500).json({ error: "Failed to update quote" });
    }
})


// let quotes = [{id:1, author: "Socrates", quote:"The only true wisdom is in knowing you know nothing."},
//     {id:2, author:"Albert Einstein", quote:"Life is like riding a bicycle. To keep your balance you must keep moving."}];

// app.get("/", (req, res) =>{
//     res.json({
//         message: "Printing....",
//         endpoints: {
//             quotes: "api/quotes",
//             health: "api/health",
//         }
//     });
// });

// app.get("/api/quotes", (req, res) =>{
//     res.status(200).json(quotes);
// });

// app.post("/api/quotes", (req, res)=>{
//     const {author, quote} = req.body;
//     const newQuote = {
//         id: quotes.length +1, author, quote
//     };

//     quotes.push(newQuote);
//     res.status(201).json(newQuote);
// });

// app.put("/api/quotes/:id", (req,res)=>{
//     const id = parseInt(req.params.id);
//     const{author, quote} = req.body;

//     const index = quotes.findIndex(q => q.id === id);

//     if(index === -1){
//         return res.status(404).json({message: "Citatul nu a fost gasit"});
//     }

//     quotes[index] = {id,author,quote};
//     res.status(200).json(quotes);
// });

// app.delete("/api/quotes/:id", (req, res) => { 
//     const id = parseInt(req.params.id);
//     const index = quotes.findIndex(q => q.id === id);

//     if(index === -1){
//         return res.status(404).json({message: "Citatul nu a fost gasit"});
//     }

//     quotes.splice(index, 1);
//     res.status(204).json({message: "Citatul a fost sters cu succes."});
// });


//Pornim serversul pe portul 5000
const PORT = process.env.port || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} `);
    console.log(`Server static images from: ${path.join(__dirname, "images")} `);

});

//veri9ficam repornirea automata a serverului
console.log();