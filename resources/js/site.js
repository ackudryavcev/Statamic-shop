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
Alpine.data('paymentConfirmation', () => ({
    notice: 'Checking payment status…',
    async init() {
        const id = new URL(window.location.href).searchParams.get('checkout_session')
        if (!id) {
            this.notice = 'There is no payment to verify.'
            return
        }
        try {
            const response = await fetch('/checkout/test/' + encodeURIComponent(id), { headers: { Accept: 'application/json' } })
            if (!response.ok) throw new Error()
            const { cents } = await response.json()
            const cart = this.$store.cart
            const snapshotKey = 'stripe-cart:' + id
            const purchased = JSON.parse(sessionStorage.getItem(snapshotKey) || '[]')
            for (const line of purchased) {
                const item = cart.items.find(item => item.key === line.key)
                if (!item) continue
                item.quantity -= line.quantity
                if (item.quantity <= 0) cart.remove(item.key)
            }
            sessionStorage.removeItem(snapshotKey)
            this.notice = 'Test payment successful · ' + cart.money(cents)
        } catch {
            this.notice = 'Payment status could not be verified. Refresh to try again.'
        }
    },
}))

Alpine.data('testCheckout', () => ({
    busy: false,
    notice: '',
    init() {
        const url = new URL(window.location.href)
        if (url.pathname === '/foundation' && url.searchParams.has('checkout_session')) {
            url.pathname = '/payment-confirmation'
            window.location.replace(url)
            return
        }
        if (!url.searchParams.has('checkout_cancelled')) return
        this.$refs.cart.showModal()
        this.notice = 'Checkout cancelled. Your cart is saved.'
        url.searchParams.delete('checkout_cancelled')
        history.replaceState(null, '', url)
    },
    async checkout() {
        if (this.busy || !this.$store.cart.count) return
        this.busy = true
        this.notice = ''
        try {
            const items = this.$store.cart.items.map(item => ({ ...item }))
            const cookie = document.cookie.split('; ').find(cookie => cookie.startsWith('XSRF-TOKEN='))
            const response = await fetch('/checkout/test', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(cookie?.slice(11) || ''),
                },
                body: JSON.stringify({ items }),
            })
            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                if (error.message === 'Stripe test checkout is not configured.') {
                    this.notice = 'Stripe test checkout is not configured yet. Your cart is saved.'
                    return
                }
                this.notice = response.status === 503
                    ? 'Stripe test checkout is unavailable. Please try again later.'
                    : 'Could not start checkout. Refresh and try again.'
                return
            }
            const { id, url } = await response.json()
            sessionStorage.setItem('stripe-cart:' + id, JSON.stringify(items))
            window.location.assign(url)
        } catch {
            this.notice = 'Could not reach checkout. Please try again.'
        } finally {
            this.busy = false
        }
    },
}))
Alpine.start()
