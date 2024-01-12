import { ApplyCandidatesWeights } from "../types"
import ScoringUtils from "../classes/scoring_utils"

export async function apply_candidates_weights({
    candidates
}: ApplyCandidatesWeights) {
    const candidates_with_weights = candidates.map((candidate: any) =>{

        // Calculates the total_score for the candidate using the scoringUtils function
        const totalScore = ScoringUtils.calculateTotalScore(candidate)

        // returns the candidate and their total_score
        return ScoringUtils.generateResultObject(candidate, totalScore)
    })

    return candidates_with_weights
}