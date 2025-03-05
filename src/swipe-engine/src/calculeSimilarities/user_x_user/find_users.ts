import User from '../../../models/user/user-model.js'
import MomentInteraction from '../../../models/moments/moment_interaction-model.js'
import { cosineSimilarity } from '../../../math/cossineSimilarity'

export default async function findUsers() {
  // Obtenha os dados de interação dos momentos
  const usersData = await MomentInteraction.findAll({
    attributes: ['moment_id', 'user_id', 'positive_interaction_rate']
});

// Encontre o número total de usuários e momentos únicos
const moments = [...new Set(usersData.map(user => user.moment_id))];
const users = [...new Set(usersData.map(user => user.user_id))];

// Crie uma matriz vazia com as dimensões adequadas para armazenar as interações dos usuários
const formattedMatrix = Array(users.length).fill(null).map(() => Array(moments.length).fill(null));

// Preencha a matriz com os interaction rates correspondentes
usersData.forEach(({ user_id, moment_id, positive_interaction_rate }) => {
    const userIndex = users.indexOf(user_id);
    const momentIndex = moments.indexOf(moment_id);
    formattedMatrix[userIndex][momentIndex] = positive_interaction_rate;
});

// Inicialize a matriz de similaridade
const similarityMatrix: any = [];

// Calcule a similaridade entre cada par de usuários
for (let i = 0; i < formattedMatrix.length; i++) {
    const row: any = [];
    for (let j = 0; j < formattedMatrix.length; j++) {
        // Calcule a similaridade de cosseno entre os vetores de interação dos usuários
        const similarity = cosineSimilarity(formattedMatrix[i], formattedMatrix[j]);
        row.push(similarity);
    }
    similarityMatrix.push(row);
}

return similarityMatrix
}