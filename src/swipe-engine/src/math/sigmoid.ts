export default function sigmoid(z: number) {
    return 1 / (1 + Math.exp(-z))
}