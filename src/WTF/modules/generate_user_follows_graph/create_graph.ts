import { findInitCandidates } from "./find_init_candidates";


interface createWeightedGraphProps {
    user_id: number,
    depth?: number
}
interface UserData {
    id: number;
    username: string;
    following?: UserData[] | null;
  }

export async function createWeightedGraph({
    user_id, depth= 10
}: createWeightedGraphProps): Promise<any> {
    const userData = await findInitCandidates({ user_id, depth });

    if (!userData) {
      return { dotGraph: '', userData: {} as UserData };
    }
  
    let dotGraph = 'digraph WeightedUserGraph {\n';
  
    function addUserToGraph(user: UserData, weight: number) {
      dotGraph += `"${user.id}" [label="${user.username}", weight=${weight.toFixed(2)}];\n`;
    }
  
    addUserToGraph(userData, 0);
  
    function traverseGraph(user: UserData, currentDepth: number, previousWeight: number) {
        if (user.following) {
          user.following.forEach((followingUser, index) => {
            let weight = 0;
    
            if (currentDepth === 1) {
              weight = 0;
            } else if (currentDepth === 2) {
              weight = 1;
            } else {
              weight = previousWeight -(1 / depth);
            }
    
            dotGraph += `"${user.id}" -> "${followingUser.id}" [label=${weight.toFixed(2)}];\n`;
    
            addUserToGraph(followingUser, weight);
    
            traverseGraph(followingUser, currentDepth + 1, weight);
          });
        }
      }
  
    traverseGraph(userData, 1, 0);
  
    dotGraph += '}';
  
    return dotGraph
}