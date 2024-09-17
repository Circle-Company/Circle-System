/**
 * Validate if the input string is a valid IPv4 or IPv6 address.
 * @param {string} ip - The IP address to validate.
 * @returns {boolean} - Returns true if the IP is valid, otherwise false.
 */
function isValidIP(ip: string) {
    // Regular expression for IPv4
    const ipv4Regex =
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

    // Regular expression for IPv6
    const ipv6Regex =
        /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)|(([0-9a-fA-F]{1,4}:){1,7}|:):(([0-9a-fA-F]{1,4}:){1,7}|:)|::|((([0-9a-fA-F]{1,4}:){6}|:):((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)))$/

    // Test against both IPv4 and IPv6 regular expressions
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

export default isValidIP
