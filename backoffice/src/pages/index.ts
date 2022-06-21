import {Dashboard} from './Dashboard'
import {Posts} from './Posts'
import {NotFound} from "./NotFound";

type AppPage = {
    name: string
    url: string
    component: () => JSX.Element
}

const pages: AppPage[] = [
    {
        name: '404 Not Found',
        url: '*',
        component: NotFound
    },
    {
        name: 'Dashboard',
        url: '/',
        component: Dashboard
    },
    {
        name: 'Posts',
        url: '/posts',
        component: Posts
    }
]

export default pages