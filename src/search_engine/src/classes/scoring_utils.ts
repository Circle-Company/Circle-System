import Candidate from "./candidate"

class ScoringUtils {
    static calculateTotalScore(candidate: Candidate): number {
      const weights = require('../database/search_weights.json')
      let totalScore = 0
  
      for (const criterion in weights) {
        if (candidate[criterion] !== undefined && weights[criterion].sentiment && weights[criterion].weight) {
          const sentimentFactor = weights[criterion].sentiment === 'positive' ? 1 : -1
          totalScore += candidate[criterion] ? weights[criterion].weight * sentimentFactor : 0
        }
      }
  
      return totalScore
    }
  
    static generateResultObject(candidate: Candidate, totalScore: number): any {
      return {
        id: candidate.id,
        username: candidate.username,
        verifyed: candidate.verifyed,
        name: candidate.name,
        muted: candidate.muted,
        profilePicture: candidate.profilePicture,
        follow_you: candidate.follow_you,
        you_follow: candidate.you_follow,
        block_you: candidate.block_you,
        distance: candidate.distance,
        total_followers_num: candidate.total_followers_num,
        total_score: totalScore
      };
    }
  }
  
  export default ScoringUtils