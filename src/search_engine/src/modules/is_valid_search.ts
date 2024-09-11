function isValidSearch(search_term: string): { isValid: boolean; message?: string } {
    try {
        // Verifica se o parâmetro é uma string
        if (typeof search_term !== "string") {
            return { isValid: false, message: "Search term must be a string." }
        }

        // Verifica se a string não está vazia
        if (search_term.trim() === "") {
            return { isValid: false, message: "Search term cannot be empty." }
        }

        // Verificação de comprimento mínimo/máximo, se necessário (opcional)
        if (search_term.length < 3 || search_term.length > 100) {
            return { isValid: false, message: "Search term must be between 3 and 100 characters." }
        }

        // Verifica a presença de caracteres inválidos
        const regex = /[=;]/
        if (regex.test(search_term)) {
            return {
                isValid: false,
                message: "Search term contains forbidden characters (= or ;).",
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
