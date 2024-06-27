import { Server } from "socket.io";
import Socket from '../models/user/socket-model.js'

let io: Server
type InitializeSocketProps = {
    server: any,
}
export function initializeSocket({ server }: InitializeSocketProps) {
    io = new Server(server, {
        connectTimeout: 500
    });
    io.on('connection', async (socket: any) => {
        console.log(socket.id, 'connection')
        socket.on('sign', async (props: any) => {
            const { user_id } = props
            try {
                const socket_exists = await Socket.findOne({where: {user_id}})
                if(socket_exists){
                    await Socket.update({ socket_id: socket.id }, {where: {user_id}})
                }else {
                    await Socket.create({ user_id, socket_id: socket.id })   
                }
                console.log(`Usuário ${user_id} associado ao socket ${socket.id}`)
            } catch (error) {
                console.error('Erro ao associar o usuário ao socket:', error)
            }
        })
    })
    return io
    }

export function getSocketInstance() {
    if (!io) throw new Error('Socket.IO não inicializado. Chame initializeSocket primeiro.')
    return io;
}