import { z, addRoute } from '@agree-able/contract'
const Expectations = z.object({
  reason: z.string().describe('the reason for the room'),
  rules: z.string().describe('rules for the room')
})
export const RoomExpectiations = z.function().args().returns(z.promise(Expectations))
export const NewRoom = z.function().args().returns(z.promise(z.string().describe('a z32 encoded room invite')))
const api = {
  role: 'roommanager',
  version: '1.0.0',
  description: 'open a room',
  routes: {
    newRoom: addRoute(NewRoom),
    roomExpectations: addRoute(RoomExpectiations)
  }
}
export default api
