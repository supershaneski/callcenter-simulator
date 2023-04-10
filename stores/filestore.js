import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"


/**
 * File format
 * {
        name: file.name,
        url: URL.createObjectURL(file),
        datetime: 
        type: file.type,
        size: file.size,
        expanded: false,
        embedding: meanEmbedding,
        chunks: chunks,
        extractedText: text,
    }
 */

const useFileStore = create(
    persist(
        (set, get) => ({
            
            files: [],
            
            add: (sfiles) => {

                let files = get().files.slice(0)

                sfiles.forEach((file) => {
                    if(!(files.some((item) => item.name === file.name && item.type === file.type && item.size === file.size))) {
                        files.push(file)
                    }
                })

                set({ files })
            },
            delete: (name) => {

                let files = get().files.slice(0)
                files = files.filter((file) => file.name !== name)

                set({ files })
            },
            getFile: (name) => {

                let files = get().files.slice(0)

                return files[0]

            },
            clear: () => set({ files: [] })
            
        }),
        {
            name: "callcenter-simulator-file-storage",
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
)

export default useFileStore