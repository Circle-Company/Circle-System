export const isValidCoordinate = (coordinate: string): boolean => {
    const coordinateRegex = /^-?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*-?(1[0-7]?\d(\.\d+)?|180(\.0+)?)$/ // Regex para coordenadas
    return coordinateRegex.test(coordinate)
}
