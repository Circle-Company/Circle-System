type ContainSpecialCharactersProps = {
    text: string,
    allow_space_point?: boolean
}

export async function ContainSpecialCharacters({
    text,
    allow_space_point = true,
}: ContainSpecialCharactersProps): Promise<boolean> {
    const regex_allow_space_point = /^[a-zA-Z0-9_.]+$/
    const regex = /^[a-zA-Z\s]+$/

    if(allow_space_point){
        if (!regex_allow_space_point.test(text)) {
            const specialCharacters = text.split('').filter(char => !regex.test(char))
            return specialCharacters.length > 0 ? true : false
        }
        return false       
    }else {
        if (!regex.test(text)) {
            const specialCharacters = text.split('').filter(char => !regex.test(char))
            return specialCharacters.length > 0 ? true : false
        }
        return false   
    }
}