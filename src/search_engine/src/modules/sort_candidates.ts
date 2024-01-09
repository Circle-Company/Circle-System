import { SortCandidatesProps } from "../types"

export async function sort_candidates({
    candidates
}: SortCandidatesProps) {
    console.log(candidates)
        // Ordena os candidatos com base no totalScore (ordem decrescente)
        const sorted_candidates = candidates.sort((a, b) => {
          if (a.total_score < b.total_score) {
            return 1
          }
          if (a.total_score > b.total_score) {
            return -1
          }
          return 0;
        });
        const filtered_candidates = sorted_candidates.map((candidate) => {
            return {
                id: candidate.id,
                username: candidate.username,
                verifyed: candidate.verifyed,
                name: candidate.name,
                profile_picture: candidate.profilePicture,
            }
        })
        return filtered_candidates     
}