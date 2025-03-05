import MomentInteraction from '../../models/moments/moment_interaction-model.js'

export async function InteractedMomentsIdsList({user_id}: {user_id: number}) {
    const interactionsList = await MomentInteraction.findAll({ where: {user_id}, attributes: ['id', 'user_id', 'moment_id'] })
    const idsList = interactionsList.map((interaction) => { return interaction.moment_id })
    const uniqueIds: any = [...new Set(idsList)]
    return uniqueIds
}