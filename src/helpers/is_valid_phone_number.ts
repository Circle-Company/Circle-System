type IsValidPhoneNumberProps = {
    phoneNumber: string
}

export function isValidPhoneNumber({
    phoneNumber
}: IsValidPhoneNumberProps): boolean {
    // Use uma expressão regular para validar o formato esperado do número de telefone
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if(phoneRegex.test(phoneNumber)) return true
    else return false
  }