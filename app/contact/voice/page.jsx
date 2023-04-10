import VoiceCall from "../../../components/voicecall"

export const metadata = {
    title: `${process.env.siteTitle} - Voice Call`,
    description: 'A sample callcenter simulator',
    viewport: 'maximum-scale=1.0, minimum-scale=1.0, initial-scale=1.0, width=device-width, user-scalable=0',
    icons: {
        icon: '/logo192.png',
        shortcut: '/logo192.png',
    }
}

export default function Page(props) {
    return (
        <VoiceCall {...props} />
    )
}