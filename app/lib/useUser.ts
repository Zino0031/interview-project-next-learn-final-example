import {auth} from '@/auth'

const UseUser = async () => {
    const session = await auth()
    return session?.user
}

export default UseUser