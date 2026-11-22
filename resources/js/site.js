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
Alpine.start()
