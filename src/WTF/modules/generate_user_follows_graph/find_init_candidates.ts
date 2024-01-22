const User = require('../../../models/user/user-model.js')

interface UserData {
    id: number;
    username: string;
    following?: UserData[] | null;
  }
  
  interface FindInitCandidatesProps {
    user_id: number;
    depth: number;
  }
  
  export async function findInitCandidates({ user_id, depth }: FindInitCandidatesProps) {
    const visitedUsers = new Set<string>(); // Conjunto global para rastrear todos os usuários visitados

    async function getFollowersLayers(user: UserData, depth: number): Promise<UserData | null> {
      async function getUserData(userId: number, currentDepth: number, previousUsername?: string): Promise<UserData | null> {
        if (currentDepth <= 0 || visitedUsers.has(`${userId}-${user.id}`)) {
          return null;
        }
  
        const userInstance = await User.findOne({
          attributes: ['id', 'username'],
          where: { id: userId },
          include: [
            {
              model: User,
              as: 'following',
              attributes: ['id', 'username'],
              through: { attributes: [] },
            },
          ],
        });
  
        if (!userInstance) {
          return null;
        }
  
        // Verifica se o usuário e quem ele segue são os mesmos
        if (previousUsername && userInstance.username === previousUsername) {
            visitedUsers.add(`${userId}-${user.id}`)
        }
  
        const followingData = await Promise.all(
          userInstance.following?.map(async (followingUser: any) => {
            if (previousUsername && followingUser.username === previousUsername) {
              visitedUsers.add(followingUser.id);
              return null;
            }
  
            return getUserData(followingUser.id, currentDepth - 1, followingUser.username);
          }) || []
        );
  
        return {
          id: userInstance.id,
          username: userInstance.username,
          following: followingData.filter(Boolean) as UserData[] | null,
        };
      }
  
      const result = await getUserData(user.id, depth);
      return result;
    }
  
    try {
      const user = await User.findOne({
        attributes: ['id', 'username'],
        where: { id: user_id },
        include: [
          {
            model: User,
            as: 'following',
            attributes: ['id', 'username'],
            through: { attributes: [] },
          },
        ],
      });
  
      if (user) {
        const result = await getFollowersLayers(user, depth);
        return result;
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
}
  