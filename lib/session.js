import idb from './idb'

import { getSimpleId } from '../lib/utils'

const createSession = async (inquiry, mode) => {
    const sid = getSimpleId()

    const session = {
        id: sid,
        datetime: Date.now(),
        inquiry,
        mode,
        items: [],
        sentiment: '',
        summary: ''
    }

    const ret = await idb.addSessionAsync(sid, session)

    return sid
}

const createSessionAsync = async (sid, session) => {
    
    return await idb.addSessionAsync(sid, session)
    
}

const getSession = async (sid) => {

    return await idb.getSessionAsync(sid)

}

const getSessions = async () => {

    return await idb.getSessionsAsync()

}

const updateSession = async (sid, session) => {

    return await idb.modifySessionAsync(sid, session)

}

const deleteSession = async (sid) => {

    return await idb.deleteSessionAsync(sid)

}

export default {
    createSession,
    createSessionAsync,
    getSession,
    getSessions,
    updateSession,
    deleteSession,
}