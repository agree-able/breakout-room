import { z, addRoute } from 'agreeable'
export const NewRoom = z.function().args().returns(z.promise(z.string().describe('a z32 encoded room invite')))
const api = {
  role: 'roommanager',
  version: '1.0.0',
  description: 'open a room',
  routes: {
    newRoom: addRoute(NewRoom)
  }
}
export default api
