type ContainSpecialCharactersProps = {
    text: string
}

export async function ContainSpecialCharacters({
    text
}: ContainSpecialCharactersProps): Promise<boolean> {
    const regex = /^[a-zA-Z0-9_.]+$/
    if (!regex.test(text)) {
      const specialCharacters = text.split('').filter(char => !regex.test(char))
      return specialCharacters.length > 0 ? true : false
    }
    return false
}