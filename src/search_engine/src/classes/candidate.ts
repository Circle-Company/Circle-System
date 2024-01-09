class Candidate {
    id: number
    username: string
    verifyed: boolean
    name: string | null
    muted: boolean
    profilePicture: {
        fullhd_resolution: null | string,
        tiny_resolution: null | string
    }
    follow_you: boolean
    you_follow: boolean
    block_you: boolean
    distance: number | null
    total_followers_num: number
  
    constructor(
        id: number,
        username: string,
        verifyed: boolean,
        name: string | null,
        muted: boolean,
        profilePicture: {
            fullhd_resolution: null | string,
            tiny_resolution: null | string
        },
        follow_you: boolean,
        you_follow: boolean,
        block_you: boolean,
        distance: number | null,
        total_followers_num: number,
    ) {
      this.id = id
      this.username = username
      this.verifyed = verifyed
      this.name = name
      this.muted = muted
      this.profilePicture = profilePicture
      this.follow_you = follow_you
      this.you_follow = you_follow
      this.block_you = block_you
      this.distance = distance
      this.total_followers_num = total_followers_num
    }

      // Método para calcular a pontuação total
    calculateTotalScore(weights: any): number {
        let totalScore = 0

        for (const criterion in weights) {
            if (this[criterion] !== undefined && weights[criterion].sentiment && weights[criterion].weight) {
                const sentimentFactor = weights[criterion].sentiment === 'positive' ? 1 : -1
                totalScore += this[criterion] ? weights[criterion].weight * sentimentFactor : 0
            }
        }
        return totalScore
    }
}
  
export default Candidate