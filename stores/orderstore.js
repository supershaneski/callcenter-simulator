import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

const useOrderStore = create(
    persist(
        (set, get) => ({
            orders: [],
            add: (order) => {

                let orders = get().orders.slice(0)

                orders.push(order)

                set({ orders })

            },
            update: (id, order) => {

                let orders = get().orders.slice(0)

                orders = orders.map((item) => {
                    
                    if(item.id === id) {
                        return order
                    }

                    return item
                })

            },
            getOrder: (id) => {

                return get().orders.slice(0).find((item) => item.id === id)

            },
            delete: (id) => {

                let orders = get().orders.slice(0)

                orders = orders.filter((item) => item.id !== id)

                set({ orders })

            },
            clear: () => set({ orders: [] })
        }),
        {
            name: "callcenter-simulator-order-storage",
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
)

export default useOrderStore