import Alpine from 'alpinejs'
import collapse from '@alpinejs/collapse'
import focus from '@alpinejs/focus'
import morph from '@alpinejs/morph'
import persist from '@alpinejs/persist'
import precognition from 'laravel-precognition-alpine';

window.productGrid = ({ source, endpoint }) => ({
    source, endpoint, activeCategory: 'all', products: [], categories: [], loading: false, error: '',
    async init() {
        if (this.source !== 'api') return
        this.loading = true
        try {
            const response = await fetch(this.endpoint)
            if (!response.ok) throw new Error(`Unable to load products (${response.status})`)
            const payload = await response.json()
            this.products = payload.products ?? []
            this.categories = [...new Set(this.products.map(product => product.category).filter(Boolean))].sort()
        } catch (error) {
            this.error = error.message || 'Unable to load products.'
        } finally { this.loading = false }
    },
    formatPrice(value) {
        return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0)
    },
})

// Call Alpine.
window.Alpine = Alpine
Alpine.plugin([collapse, focus, morph, persist, precognition])
const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })

Alpine.store('cart', {
    items: Alpine.$persist([]).as('statamic-shop.cart.v1'),
    key(source, id) {
        return JSON.stringify([source, String(id)])
    },
    quantity(source, id) {
        const key = this.key(source, id)
        return this.items.find(item => item.key === key)?.quantity ?? 0
    },
    payWithTestMethod() {
        if (!this.count) return null
        const amount = this.money(this.total)
        this.items = []
        return amount
    },
    add(source, product) {
        const key = this.key(source, product.id)
        const existing = this.items.find(item => item.key === key)
        if (existing) {
            existing.quantity++
            return
        }
        this.items.push({
            key,
            title: product.title,
            cents: Math.round(Number(product.price) * 100),
            quantity: 1,
        })
    },
    remove(key) {
        this.items = this.items.filter(item => item.key !== key)
    },
    get count() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0)
    },
    get total() {
        return this.items.reduce((sum, item) => sum + item.cents * item.quantity, 0)
    },
    money(cents) {
        return euro.format(cents / 100)
    },
})
Alpine.start()
