export default function IntensityAjust(x: number): number {
    return 1/(1 + Math.pow(30*x, 3.2))
}