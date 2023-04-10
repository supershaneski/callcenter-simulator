'use client'

import React from 'react'

export default function useCaption(captions) {
    
    const [lang, setLang] = React.useState(0)

    React.useEffect(() => {
        
        function handleLanguageChange() {
            setLang(navigator.language.toUpperCase().indexOf('EN') >= 0 ? 0 : 1)
        }
        
        window.addEventListener('languagechange', handleLanguageChange)

        setLang(navigator.language.toUpperCase().indexOf('EN') >= 0 ? 0 : 1)
        
        return () => {
            window.removeEventListener('languagechange', handleLanguageChange)
        }

    }, [])

    return (key) => captions[key][lang]

}