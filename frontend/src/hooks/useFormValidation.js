import { useState } from "react";

// Hook custom pentru validarea unui formular generic.
// Primeste un obiect `rules` care descrie regulile per camp.
// Returneaza: errors (obiect), validate (functie), clearErrors.
export function useFormValidation(rules) {
	// `errors` - obiect cu { author: "mesaj eroare", quote: "mesaj eroare" }
	// Campurile fara eroare nu apar in obiect.
	const [errors, setErrors] = useState({});

	// Valideaza datele formularului fata de regulile definite.
	// Returneaza true daca totul este valid, false daca exista erori.
	function validate(data) {
		const newErrors = {};

		// Iteram prin fiecare camp din rules si aplicam validarile
		for (const field in rules) {
			const value = (data[field] || "").trim();
			const rule = rules[field];

			if (rule.required && !value) {
				newErrors[field] = rule.requiredMsg || "Campul este obligatoriu.";
				continue; // daca lipseste valoarea, nu mai verificam lungimea.
			}

			if (rule.minLength && value.length < rule.minLength) {
				newErrors[field] =
					rule.minLengthMsg || `Minim ${rule.minLength} caractere.`;
			}

			if (rule.maxLength && value.length > rule.maxLength) {
				newErrors[field] =
					rule.maxLengthMsg || `Maxim ${rule.maxLength} caractere.`;
			}
		}

		setErrors(newErrors);
		// Formularul este valid daca nu exista nicio cheie in newErrors
		return Object.keys(newErrors).length === 0;
	}

	function clearErrors() {
		setErrors({});
	}

	return { errors, validate, clearErrors };
}
