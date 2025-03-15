import Security from "../../../security-tool/src"
import rules from "../database/rules.json"
export function isValidSearch(search_term: string): { isValid: boolean; message?: string } {
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

        const sanitization = new Security().sanitizerMethods.sanitizeSQLInjection(search_term)

        if (sanitization.isDangerous) {
            return {
                isValid: false,
                message:
                    "Characters that are considered malicious have been identified in the SearchTerm.",
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
