import { ApplyCandidatesWeights } from "../types"
import ScoringUtils from "../classes/scoring_utils"

export async function apply_candidates_weights({
    candidates
}: ApplyCandidatesWeights) {
    const candidates_with_weights = candidates.map((candidate: any) =>{
        // Calcula a pontuação total para o candidato usando a função de scoringUtils
        const totalScore = ScoringUtils.calculateTotalScore(candidate)
        // Retorna um objeto contendo as informações relevantes usando a função de scoringUtils
        return ScoringUtils.generateResultObject(candidate, totalScore)
    })

    return candidates_with_weights
}