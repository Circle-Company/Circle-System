### contexto:
Estou criando uma aplicação (rede social) que pretendo escalar, e na tela de pesquisa de usuários, eu precisava de um método de pesquisa mais eficiente que `Users.findAll()` ou algo assim, afinal para uma aplicação com centenas de usuários até seria possível, mas conforme fosse crescendo, rapidamente se tornaria inviável simplesmente varrer todos os usuários.

Isso lembrando que a cada letra adicionada ao input de pesquisa, é necessária uma nova consulta ao banco de dados, o que torna extremamente custoso pesquisar por milhares de usuários.

Ainda que eu aplicasse algum algoritmo de pesquisa mais eficiente, eu poderia melhorar em alguns milisegundos o tempo de resposta, mas ainda teria os mesmos problemas.

Outro problema é que, um usuário quer pesquisar por alguém que ele já conheça, alguém que esteja na mesma região ou alguém que tenha muitos seguidores por exemplo. Então você quer ver
estes usuários em primeiro na lista, e não completos desconhecidos.

----------

### Então qual é a solução???
Bom, parte dela é tão simples quanto parece, sobre o desempenho, basta limitar a busca em um número pequeno de usuários ex: `Users.findAll({where: username:"termo de pesquisa", limit: 20})` e você terá um exelente tempo de resposta.

Afinal a lista é atualizada rapidamente conforme o usuário digita, e não é necessário pesquisar muito mais usuários do que será exibido na tela, somente se o usuário rolar para baixo, ai poderíamos usar paginação para pesquisar mais usuários com o mesmo parâmetro de pesquisa.

Mas ainda assim, a ordem que esses usuários seriam exibidos seria de "baixa qualidade" para quem está pesquisando, pelos motivos já citados.

Então para resolver isso vamos criar um ranqueamento baseado nas interações dos usuários pesquisados com o usuário que está pesquisando, então ordenamos esta lista em forma decrescente (a maior pontuação é exibida no topo)

Se ainda não ficou tão claro, a pontuação significa o quão relevante aquele usuário da lista é para quem está pesquisando, logo ele será exibido acima de um menos relevante, assim tornando a pesquisa mais fácil e intuitiva.

 -------
### O Algoritmo ( Search Engine)

Primeiro devemos fazer a pesquisa dos 20 usuários iniciais baseados nos parâmetros de pesquisa.
###### para simplificar a explicação, chamaremos a lista inicial dos 20 usuários de "candidatos à pesquisa", e o usuário que está pesquisando de "pesquisador"

Agora filtraremos estes "candidatos à pesquisa" para que não apareçam usuários indesejáveis. Como candidatos que foram bloqueados pela plataforma, que tiveram a conta deletada pela plataforma ou candidatos bloqueados pelo pesquisador. (mas isso fica ao seu critério implementar ou não)
Implementei desse jeito: 
```typescript
 //typescript com sequelize e banco de dados mysql no nodejs
 
    // procuramos pelas coordenadas do pesquisador por que usaremos mais tarde.
    const user_coordinates = await Coordinate.findOne({
        attributes: ['latitude', 'longitude'],
        where: { user_id: user_id }
    })
    
    // agora procuramos pela lista de usuários baseado no termo de pesquisa
    const users = await User.findAll({
        attributes: ['id', 'username', 'muted' 'profile_picture'],
        where: {
            username: {[Op.like]: `%${username_to_search}%`},
            id: {[Op.not]: user_id},
            blocked: {[Op.not]: true},
            deleted: {[Op.not]: true}
        },
        include: [
            {
                model: Coordinate,
                as: 'coordinates',
                attributes: ['latitude', 'longitude']
            },
            {
                model: Statistic,
                as: 'statistics',
                attributes: ['total_followers_num']
            }
        ],
        limit: 20
    })
    
    // aqui retornamos a lista + a coordenadas do pesquisador + o id do pesquisador
    return {
        users: users,
        user_coordinates: user_coordinates,
        user_id: user_id
    }
```

O retorno da lista deve parecer com isso: 
```typescript
[
  {
    id: 1,
    username: 'apple',
    profile_picture: "https://example.image",
    muted: false,
    total_followers_num: 0
  },
  {
    id: 2,
    username: 'microsoft',
    profile_picture: "https://example.image",
    muted: false,
    total_followers_num: 0
  },
  ...
]
```

Em seguida pesquisamos no banco de dados as interações dos "candidatos à pesquisa" com o "pesquisador"

Mas para isso devemos definir quais parâmetros usaremos para ranquear os usuários, para não pesquisar mais dados do que usaremos (os parâmetros são muito individuais pois estão diretamente ligado as regras de negócios do sistema) mas vou mostrar os que eu escolhi inicialmente: 


```typescript
distance
/** a distância entre o pesquisador e o candidato à pesquisa, serve para evitar que seja
exibido no topo da lista usuários muito distantes do pesquisador, já que provavelmente
ele não procura por isto **/

total_followers_num
/** se o candidato, tem muitos seguidores provavelmente é alguém relevante na plataforma,
então queremos exibi-lo mais ao topo da lista, mas temos que ter cuidado ao dar importância
demais a este parâmetro já que o pesquisador quer ver amigos também, e não somente famosos
no topo da lista **/

you_follow
/** se o pesquisador segue o candidato, provavelmente ele é alguém importante para o
pesquisador então queremos exibir este usuário mais ao topo da lista **/

follow_you
/** se o candidato segue o pesquisador, provavelmente eles também se conhecem, mas nao darei
a mesma importância que o "you_follow" no ranqueamento, já que o pesquisador pode ter
vários seguidores o que torna este parâmetro um pouco menos importante no ranqueamento**/

blocked_you
/** se o candidato bloqueou o pesquisador é por que ele não quer ser
encontrado, então, até exibiremos ele, mas obviamente não no topo lista **/

muted
/** se o usuário é mutado pela plataforma, ele tem o alcance prejudicado então tembém
não queremos que o pesquisador o encontre no topo da lista **/
```
Agora que definimos os parâmetros você deve pesquisa-los no seu banco de dados, e este é o código que estou usando para isso:

```typescript
//typescript com sequelize e banco de dados mysql no nodejs

    const result = await Promise.all(
        users.map(async( user: UserProps ) => {

        // checa se o candidato segue o pesquisador
        const user_followed = await Follow.findOne({
            attributes: ['followed_user_id', 'user_id'],
            where: { followed_user_id: user_id, user_id: user.id }
        })
        // checa se o pesquisador segue o candidato
        const user_follow = await Follow.findOne({
            attributes: ['followed_user_id', 'user_id'],
            where: { followed_user_id: user.id, user_id: user_id }
        })
        // checa se o candidato bloqueou o pesquisador
        const user_blocked = await Block.findOne({
            attributes: ['blocked_user_id', 'user_id'],
            where: { blocked_user_id: user_id, user_id: user.id }
        })        
        //checa se o pesquisador bloqueou o candidato
        const user_block = await Block.findOne({
            attributes: ['blocked_user_id', 'user_id'],
            where: { blocked_user_id: user.id, user_id: user_id }
        })
        // se isso aconteceu queremos não queremos que o candidato seja
        // exibido ao pesquisador, então retornamos nulo
        if(Boolean(user_block)) return null
        
        const user_cords = new Coordinates(
            user_coordinates.latitude,
            user_coordinates.longitude
        )
        const compared_candidate_cords = new Coordinates(
            user.coordinates.latitude,
            user.coordinates.longitude
        )
        
        //calcula a distância entre o pesquisador e o candidato
        const distance = haversineDistance(user_cords, compared_candidate_cords)

        //retorna o candidato com os parâmetros de interação com o pesquisador
        return new Candidate(
            user.id,
            user.username,
            user.muted,
            user.profile_picture
            Boolean(user_followed),
            Boolean(user_follow),
            Boolean(user_blocked),
            distance,
            user.statistics.total_followers_num
        )
    }))
    // limpa possiveis objetos nulos do array
    const candidates = result.filter((candidate) => candidate !== null && candidate !== undefined)

    return { candidates }

```
A sua lista deve retornar com os candidatos e suas interações, deve se parecer com isso: 
```typescript
[
  {
    id: 1,
    username: 'apple',
    profile_picture: "https://example.image",
    muted: false,
    follow_you: false,
    you_follow: true,
    block_you: false,
    distance: 12.742787655111056, // em quilometros
    total_followers_num: 0
  },
  {
    id: 2,
    username: 'microsoft',
    profile_picture: "https://example.image",
    muted: false,
    follow_you: true,
    you_follow: false,
    block_you: false,
    distance: 6.396197655111056, // em quilometros
    total_followers_num: 0
  },
  ...
]
```

Tá, mas como vamos definir o que é mais ou menos importante na pontuação final, e o que afeta positivamente e negativamente essa pontuação??

Novamente, a solução é tão simples quanto parece. Aplicaremos pesos a esses parâmetros e indicaremos se eles serão positivos ou negativos.

Para isso, criaremos um json chamado `search_weights.json` para armazenar os pesos dos parâmetros.

Deve ficar algo assim:

```json
{
    "distance": { "sentiment": "positive", "weight": 5 },
    "total_followers_num": { "sentiment": "positive", "weight": 2 },
    "follow_you": { "sentiment": "positive", "weight": 3 },
    "you_follow": { "sentiment": "positive", "weight": 7 },
    "block_you": { "sentiment": "negative", "weight": 30 },
    "muted": { "sentiment": "negative", "weight": 50 }
}
```
Volto lembrar que os pesos e os parametros variam de acordo com a sua regra de negócios, então não tem certo e errado, apenas o que faz sentido e o que não faz na sua aplicação.

Agora devemos multiplicar os parametros pelos pesos, e então calcular o `total_score` de cada candidato.
```typescript
// typescript
// Método para calcular a pontuação total de um candidato com base nos pesos dos parâmetros
    static calculateTotalScore(candidate: Candidate): number {
    
      // Importa o arquivo JSON contendo os pesos dos parâmetros de pesquisa
      const weights = require('../database/search_weights.json')
      
      // Inicializa a pontuação total como zero
      let totalScore = 0
      
      // Itera sobre cada parâmetro presente nos pesos
      for (const parameter in weights) {
      
        // Verifica se o candidato possui um valor para o parâmetro e se o sentimento e peso estão definidos
        if (candidate[parameter] !== undefined && weights[parameter].sentiment && weights[parameter].weight) {
        
          // Calcula o fator de sentimento com base no valor 'positive' ou 'negative'
          const sentimentFactor = weights[parameter].sentiment === 'positive' ? 1 : -1
          
          // Calcula a pontuação parcial para esse parâmetro e a adiciona à pontuação total
          totalScore += candidate[parameter] ? weights[parameter].weight * sentimentFactor : 0
        }
      }
  
      return totalScore
    }
```
Escolhi fazer dessa maneira ao invés de fazer um `candidates.map()` e multiplicar os pesos pelos parâmetros no braço, porque assim, caso eu adicione mais parâmetros futuramente, eu só preciso adidioná-lo ao `search_weights.json` e pesquisar a interão correpondente no banco de dados, sem ter que alterar uma única linha código do `calculateTotalScore`

Ao retornar os candidatos, cada um com seu respectivo `total_score` a lista deve se parecer com isto:

```typescript
[
  {
    id: 1,
    username: 'apple',
    profile_picture: "https://example.image",
    muted: false,
    follow_you: false,
    you_follow: true,
    block_you: false,
    distance: 12.742787655111056, // em quilometros
    total_followers_num: 0,
    total_score: 5 // este score é apenas um exemplo
  },
  {
    id: 2,
    username: 'microsoft',
    profile_picture: "https://example.image",
    muted: false,
    follow_you: true,
    you_follow: false,
    block_you: false,
    distance: 6.396197655111056, // em quilometros
    total_followers_num: 0,
    total_score: 6 // este score é apenas um exemplo
  },
  ...
]
```


por fim nós só precisamos ordenar a lista (em ordem decrescente) usando o `total_score` como referência, e remover da lista dados que não serão consumidos pelo client:
```typescript
    const sorted_candidates = candidates.sort((a, b) => {
        if (a.total_score < b.total_score) return 1
        if (a.total_score > b.total_score) return -1
        return 0
    })
    
        const filtered_candidates = sorted_candidates.map((candidate) => {
        return {
            id: candidate.id,
            username: candidate.username,
            you_follow: candidate.you_follow,
            total_followers_num: candidate.total_followers_num,
            profile_picture: candidate.profilePicture,
        }
    })
    return filtered_candidates
```
Agora o algoritmo de pesquisa já funciona perfeitamente (Para a minha necessiadade pelo menos) com um tempo de resposta rápido e exibindo uma lista de forma "inteligente", claro que quanto mais parâmetros, mais precisa será a estimativa do `total score`, mais ai fica da sua criatividade.

Fiz este post, sem a intenção de mostrar de forma detalhada a implementação do código em sí, pois achei mais interessante explicar a ideia por trás e estimular que você também use a suacriatividade na hora de resolver problemas assim, e principalmente que você ao entender a ideia possa utilizar esse mesmo raciocínio, possa aplicar isto em qualquer linguagem de programação.

Aqui está o link do repositório com a implementação completa do código [Link do Github](https://github.com/Circle-Company/Circle-System/tree/main/src/search_engine)

Inclusive se tiver interesse em me ajudar a melhorar mais este código deixe sua sugestão por favor.