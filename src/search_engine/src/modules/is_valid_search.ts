export function isValidSearch(search_term: string): { isValid: boolean; message?: string } {
    const rules = require("../database/rules.json")
    try {
        // Verifica se o parâmetro é uma string
        if (typeof search_term !== "string") {
            return { isValid: false, message: "Search term must be a string." }
        }

        // Verifica se a string não está vazia
        if (search_term.trim() === "") {
            return { isValid: false, message: "Search term cannot be empty." }
        }

        // Verificação de comprimento mínimo/máximo
        if (
            search_term.length < rules.min_search_length ||
            search_term.length > rules.max_search_length
        ) {
            return {
                isValid: false,
                message: `Search term must be between ${rules.min_search_length} and ${rules.max_search_length} characters.`,
            }
        }

        // Definindo uma lista de caracteres permitidos (somente letras, números e espaços)
        const allowedCharactersRegex = /^[a-zA-Z0-9\s]+$/
        if (!allowedCharactersRegex.test(search_term)) {
            return {
                isValid: false,
                message:
                    "Search term contains invalid characters. Only letters, numbers, and spaces are allowed.",
            }
        }

        // Prevenção contra SQL Injection: Verificação de padrões comuns de injeção
        const sqlInjectionRegex = /['"%;()<>]/ // Caracteres comuns usados em injeções SQL
        if (sqlInjectionRegex.test(search_term)) {
            return {
                isValid: false,
                message: "Search term contains forbidden characters (' \" % ; ( ) < >).",
            }
        }

        // Se passar por todas as validações
        return { isValid: true }
    } catch (error) {
        // Caso algum erro inesperado ocorra, captura e retorna o erro
        console.error("Error validating search term:", error)
        return { isValid: false, message: "An unexpected error occurred during validation." }
    }
}
