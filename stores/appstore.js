import { create } from "zustand"
//import { persist, createJSONStorage } from "zustand/middleware"

/*const useFileStore = create(
    persist(
        (set, get) => ({
            
            darkMode: false,
            
            setMode: (mode) => set({ darkMode: mode }),
            
        }),
        {
            name: "callcenter-simulator-app-storage",
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
)*/

const useAppStore = create((set) => ({
  darkMode: false,
  inquiryType: 0,
  contactMode: 0,
  sessionId: '',
  tabSettings: 0,
  setMode: (mode) => set({ darkMode: mode }),
  setInquiry: (inquiry) => set({ inquiryType: inquiry }),
  setContact: (mode) => set({ contactMode: mode }),
  setSession: (sid) => set({ sessionId: sid }),
  setTabSettings: (tab) => set({ tabSettings: tab }),
  setApp: (inquiry, mode, sid) => set({ inquiryType: inquiry, contactMode: mode, sessionId: sid }),
}))

export default useAppStore