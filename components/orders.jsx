'use client'

import React from 'react'

import LoadingButton from '@mui/lab/LoadingButton'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'

import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import AddIcon from '@mui/icons-material/Add'
import AddCartIcon from '@mui/icons-material/AddShoppingCart'
import ClearIcon from '@mui/icons-material/Clear'
import DeleteIcon from '@mui/icons-material/DeleteForever'

import CustomTheme from './customtheme'

import { formatPrice, getSimpleId } from '../lib/utils'

import useOrderStore from '../stores/orderstore'

import products from '../assets/products.json'

import captions from '../assets/orders.json'
import useCaption from '../lib/usecaption'

import classes from './orders.module.css'

export default function Orders() {

    const setCaption = useCaption(captions)

    const orders = useOrderStore((state) => state.orders)
    const addOrder = useOrderStore((state) => state.add)

    const [fullName, setFullName] = React.useState('')
    const [address, setAddress] = React.useState('')
    const [orderItems, setOrderItems] = React.useState([])

    const [selOrder, setSelOrder] = React.useState('NO-PRODUCT-ID')
    const [selQuantity, setSelQuantity] = React.useState(1)
    const [unitPrice, setUnitPrice] = React.useState('---')
    const [subTotalPrice, setSubTotalPrice] = React.useState('---')

    const [loading, setLoading] = React.useState(false)
    const [errorMessage, setErrorMessage] = React.useState('')

    const [selectedOrder, setSelectedOrder] = React.useState(null)

    React.useEffect(() => {

        //console.log('[ORDERS]', orders)

    }, [orders])

    const handleSelectOrder = (e) => {
        
        const productCode = e.target.value
        
        if(productCode === 'NO-PRODUCT-ID') {
            setSelOrder(productCode)
            setSelQuantity(1)
            setUnitPrice('---')
            setSubTotalPrice('---')
            return
        }
        
        const order_item = products.items.find((item) => item.id === productCode)

        const unit_price = parseInt(order_item.price)
        const subtotal_price = unit_price * selQuantity

        setSelOrder(productCode)
        setUnitPrice(unit_price)
        setSubTotalPrice(subtotal_price)

    }

    const handleSelectQuantity = (e) => {
        
        const quantity_count = e.target.value

        setSelQuantity(quantity_count)
        setSubTotalPrice(unitPrice * quantity_count)

    }

    const handleAddOrderItem = () => {
        
        const order_item = products.items.find((item) => item.id === selOrder)

        setOrderItems((prevOrders) => [...prevOrders, ...[{
            id: getSimpleId(),
            productCode: selOrder,
            name: order_item.name,
            quantity: selQuantity,
            price: unitPrice
        }]])

        setSelOrder('NO-PRODUCT-ID')
        setSelQuantity(1)
        setUnitPrice('---')
        setSubTotalPrice('---')

    }

    const handleAddOrder = () => {

        setLoading(true)
        
        const total_price = orderItems.reduce((total, item, index, arr) => {
            return total + (item.price * item.quantity)
        }, 0)

        const order = {
            id: getSimpleId(),
            name: fullName,
            address: address,
            items: orderItems,
            quantity: orderItems.length,
            total: total_price,
        }

        addOrder(order)

        setTimeout(() => {
            
            setFullName('')
            setAddress('')
            setOrderItems([])

            setLoading(false)

        }, 500)

        /*
        const [fullName, setFullName] = React.useState('')
    const [address, setAddress] = React.useState('')
    const [orderItems, setOrderItems] = React.useState([])

    const [selOrder, setSelOrder] = React.useState('NO-PRODUCT-ID')
    const [selQuantity, setSelQuantity] = React.useState(1)
    const [unitPrice, setUnitPrice] = React.useState('---')
    const [subTotalPrice, setSubTotalPrice] = React.useState('---')
    */

    }

    const handleSelectOrderItem = (orderId) => {
        
        const order = orders.find((item) => item.id === orderId)

        setSelectedOrder(order)

    }

    const displayTotalPrice = React.useCallback(() => {
        return orderItems.reduce((total, item, index, arr) => {
            return total + (item.price * item.quantity)
        }, 0)
    }, [orderItems])

    return (
        <div className={classes.container}>
            <div className={classes.panel}>
                <div className={classes.form}>
                    <h4 className={classes.fieldsName}>{ setCaption('personal-details') }</h4>
                    <div className={classes.item}>
                        <CustomTheme>
                            <FormControl fullWidth>
                                <TextField
                                //fullWidth
                                required
                                label={setCaption('fullname')}
                                placeholder={setCaption('fullname-placeholder')}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                            disabled={fullName.length === 0}
                                            onClick={() => setFullName('')}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                />
                            </FormControl>
                        </CustomTheme>
                    </div>
                    <div className={classes.item}>
                        <CustomTheme>
                            <FormControl fullWidth>
                                <TextField
                                //fullWidth
                                required
                                label={setCaption('shipping-address')}
                                placeholder={setCaption('shipping-address-placeholder')}
                                value={address}
                                multiline
                                rows={3}
                                onChange={(e) => setAddress(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                            disabled={address.length === 0}
                                            onClick={() => setAddress('')}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                />
                            </FormControl>
                        </CustomTheme>
                    </div>
                    <h4 className={classes.fieldsName}>{setCaption('orders')}</h4>
                    <div className={classes.item}>
                        {
                            orderItems.map((order) => {
                                return (
                                    <div key={order.id} className={classes.order}>
                                        <div className={classes.orderItem}>{order.name}</div>
                                        <div className={classes.orderItem2}>{order.quantity}</div>
                                        <div className={classes.orderItem3}>{formatPrice(order.price)}</div>
                                        <div className={classes.orderItem3}>{formatPrice(order.price * order.quantity)}</div>
                                        <div className={classes.orderItem4}>&nbsp;</div>
                                    </div>
                                )
                            })
                        }
                        <div className={classes.order}>
                            <div className={classes.orderItem}>
                                <CustomTheme>
                                    <FormControl 
                                    //size="small"
                                    fullWidth
                                    >
                                        <InputLabel id="product-label">{setCaption('product-name')}</InputLabel>
                                        <Select
                                        labelId="product-label"
                                        label={setCaption('product-name')}
                                        value={selOrder}
                                        //onChange={(e) => setSelOrder(e.target.value)}
                                        onChange={handleSelectOrder}
                                        >
                                            <MenuItem value={'NO-PRODUCT-ID'}>---</MenuItem>
                                            {
                                                products.items.map((item) => {
                                                    return (
                                                        <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                                                    )
                                                })
                                            }
                                        </Select>
                                    </FormControl>
                                </CustomTheme>
                            </div>
                            <div className={classes.orderItem2}>
                                <CustomTheme>
                                    <FormControl 
                                    //size="small"
                                    fullWidth
                                    >
                                        <InputLabel id="quantity-label">{setCaption('quantity')}</InputLabel>
                                        <Select
                                        disabled={selOrder === 'NO-PRODUCT-ID'}
                                        labelId="quantity-label"
                                        label={setCaption('quantity')}
                                        value={selQuantity}
                                        //onChange={(e) => setSelQuantity(e.target.value)}
                                        onChange={handleSelectQuantity}
                                        >
                                            <MenuItem value={1}>1</MenuItem>
                                            <MenuItem value={2}>2</MenuItem>
                                            <MenuItem value={3}>3</MenuItem>
                                            <MenuItem value={4}>4</MenuItem>
                                            <MenuItem value={5}>5</MenuItem>
                                        </Select>
                                    </FormControl>
                                </CustomTheme>
                            </div>
                            <div className={classes.orderItem3}>{ formatPrice(unitPrice) }</div>
                            <div className={classes.orderItem3}>{ formatPrice(subTotalPrice) }</div>
                            <div className={classes.orderItem4}>
                                <CustomTheme>
                                    <IconButton disabled={selOrder === 'NO-PRODUCT-ID'} onClick={handleAddOrderItem}>
                                        <AddIcon />
                                    </IconButton>
                                </CustomTheme>
                            </div>
                        </div>

                        <div className={classes.order}>
                            <div className={classes.orderItem}>&nbsp;</div>
                            <div className={classes.orderItem2}>&nbsp;</div>
                            <div className={classes.orderItem3}><strong>{setCaption('total-price')}</strong></div>
                            <div className={classes.orderItem3}>{ formatPrice(displayTotalPrice()) }</div>
                            <div className={classes.orderItem4}>&nbsp;</div>
                        </div>

                    </div>
                </div>
                <div className={classes.control}>
                    <CustomTheme>
                        <LoadingButton 
                        disabled={fullName.length === 0 || address.length === 0 || orderItems.length === 0}
                        loading={loading}
                        disableElevation
                        variant="contained"
                        onClick={handleAddOrder}
                        >{setCaption('add-order')}</LoadingButton>
                    </CustomTheme>
                    {
                        errorMessage &&
                        <span className={classes.error}>{ errorMessage }</span>
                    }
                </div>
            </div>
            <div className={classes.panel} style={{marginTop: '2rem'}}>
                <table className={classes.table}>
                    <thead>
                        <tr className={classes.tabRow}>
                            <th className={classes.tabHead}>{setCaption('order-id')}</th>
                            <th className={classes.tabHead}>{setCaption('fullname')}</th>
                            <th className={classes.tabHead}>{setCaption('address')}</th>
                            <th className={classes.tabHead}>{setCaption('quantity')}</th>
                            <th className={classes.tabHead}>{setCaption('total-price')}</th>
                        </tr>
                    </thead>
                    <tbody className={classes.tabBody}>
                    {
                        orders.length === 0 &&
                        <tr className={classes.tabRow}>
                            <td colSpan={5} className={`${classes.tabCell} ${classes.center}`} style={{
                                padding: '3rem 0'
                            }}>{setCaption('no-orders')}</td>
                        </tr>
                    }
                    {
                        orders.length > 0 &&
                        orders.map((item) => {
                            return (
                                <tr key={item.id} className={classes.tabRow} onClick={() => handleSelectOrderItem(item.id)}>
                                    <td className={`${classes.tabCell} ${classes.center}`}>{ item.id }</td>
                                    <td className={`${classes.tabCell} ${classes.center}`}>{ item.name }</td>
                                    <td className={classes.tabCell}>{ `${item.address.substr(0, 18)}...` }</td>
                                    <td className={`${classes.tabCell} ${classes.center}`}>{ item.quantity }</td>
                                    <td className={`${classes.tabCell} ${classes.right}`}>{ formatPrice(item.total) }</td>
                                </tr>
                            )
                        })
                    }
                    </tbody>
                </table>
            </div>
            {
                selectedOrder &&
                <div className={classes.preview}>
                    <div className={classes.toolbar}>
                        <div className={classes.close}>
                            <CustomTheme>
                                <IconButton onClick={() => setSelectedOrder(null)}>
                                    <ClearIcon />
                                </IconButton>
                            </CustomTheme>
                        </div>
                    </div>
                    <table className={classes.table}>
                        <tbody>
                            <tr className={classes.tabRow}>
                                <td className={classes.tabCell} colSpan={5}>{setCaption('order-id')}: {selectedOrder.id}</td>
                            </tr>
                            <tr className={classes.tabRow}>
                                <td className={classes.tabCell} colSpan={5}>{setCaption('fullname')}: {selectedOrder.name}</td>
                            </tr>
                            <tr className={classes.tabRow}>
                                <td className={classes.tabCell} colSpan={5}>{setCaption('shipping-address')}: {selectedOrder.address}</td>
                            </tr>
                            {
                                selectedOrder.items.map((order) => {
                                    return (
                                        <tr key={order.id} className={classes.tabRow}>
                                            <td className={`${classes.tabCell} ${classes.center}`}>{order.id}</td>
                                            <td className={classes.tabCell}>{order.name}</td>
                                            <td className={`${classes.tabCell} ${classes.center}`}>{order.quantity}</td>
                                            <td className={`${classes.tabCell} ${classes.right}`}>{formatPrice(order.price)}</td>
                                            <td className={`${classes.tabCell} ${classes.right}`}>{formatPrice(order.quantity * order.price)}</td>
                                        </tr>
                                    )
                                })
                            }
                            <tr className={classes.tabRow}>
                                <td colSpan={4} className={`${classes.tabCell} ${classes.right}`}>{setCaption('total-price')}</td>
                                <td className={`${classes.tabCell} ${classes.right}`}>{formatPrice(selectedOrder.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            }
        </div>
    )
}